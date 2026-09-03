import json
import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.lead import Lead, LeadStatus
from app.models.import_log import ImportLog
from app.schemas.lead import LeadCreate
from app.services.phone_utils import normalize_phone
from app.auth.dependencies import require_manager
from app.config import get_settings

router = APIRouter(prefix="/api/import", tags=["import"])
settings = get_settings()

# Google Sheets column name mapping
# Adjust these keys to match the actual sheet header names
COLUMN_MAP = {
    "lead_id":              "external_lead_id",
    "id":                   "external_lead_id",
    "name":                 "customer_name",
    "customer name":        "customer_name",
    "phone":                "phone",
    "mobile":               "phone",
    "city":                 "city",
    "location":             "city",
    "country":              "country",
    "gender":               "gender",
    "vehicle":              "vehicle_interest",
    "vehicle interest":     "vehicle_interest",
    "version":              "vehicle_version",
    "v-1":                  "vehicle_version",
    "variant":              "vehicle_variant",
    "h-1":                  "vehicle_variant",
    "lead type":            "lead_type",
    "type":                 "lead_type",
    "units":                "units",
    "operation type":       "operation_type",
    "operated":             "operation_type",
    "preferred call time":  "preferred_call_time",
    "call time":            "preferred_call_time",
    "source":               "source",
    "lead source":          "source",
    "campaign":             "campaign",
    "form":                 "campaign",
    "created at":           "source_created_at",
    "timestamp":            "source_created_at",
    "email":                "email",
}

KNOWN_CRM_FIELDS = set(COLUMN_MAP.values())


def _map_row(row: dict) -> dict:
    """Map a raw sheet row to CRM lead fields."""
    mapped = {}
    raw_extras = {}

    for col, val in row.items():
        col_lower = col.strip().lower()
        crm_field = COLUMN_MAP.get(col_lower)
        if crm_field and val:
            mapped[crm_field] = str(val).strip()
        elif val:
            raw_extras[col] = str(val).strip()

    mapped["raw_source_data"] = raw_extras if raw_extras else None
    return mapped


def _get_gc():
    """Return authenticated gspread client.

    GOOGLE_SERVICE_ACCOUNT_JSON may be either a path to a key file (local
    dev) or the raw JSON of the key itself — serverless platforms have a
    read-only filesystem, so there the credentials arrive as an env var.
    """
    import gspread
    from google.oauth2.service_account import Credentials
    scopes = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    raw = (settings.GOOGLE_SERVICE_ACCOUNT_JSON or "").strip()
    if not raw:
        raise HTTPException(status_code=500, detail="Google service account credentials not configured")

    if raw.startswith("{"):
        try:
            info = json.loads(raw)
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON")
        creds = Credentials.from_service_account_info(info, scopes=scopes)
    else:
        if not os.path.exists(raw):
            raise HTTPException(status_code=500, detail="Google service account key file not found")
        creds = Credentials.from_service_account_file(raw, scopes=scopes)
    return gspread.authorize(creds)


@router.post("/google-sheets")
def import_from_google_sheets(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    if not settings.GOOGLE_SHEET_ID:
        raise HTTPException(status_code=500, detail="GOOGLE_SHEET_ID not configured in .env")

    try:
        gc = _get_gc()
        sh = gc.open_by_key(settings.GOOGLE_SHEET_ID)
        worksheet = sh.get_worksheet(0)
        rows = worksheet.get_all_records(numericise_ignore=["all"])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google Sheets error: {str(e)}")

    rows_found = len(rows)

    # Fix #5: pre-map all rows first so we can collect all incoming IDs/phones
    # in a single pass, then do TWO bulk DB queries to fetch existing records
    # instead of up to 2×N individual queries inside the loop.
    mapped_rows = []
    for row in rows:
        mapped = _map_row(row)
        phone = mapped.get("phone", "").strip()
        mapped["_norm_phone"] = normalize_phone(phone) if phone else None
        mapped_rows.append(mapped)

    # Collect all incoming dedup keys
    incoming_ext_ids = {
        str(m["external_lead_id"])
        for m in mapped_rows
        if m.get("external_lead_id")
    }
    incoming_phones = {
        m["_norm_phone"]
        for m in mapped_rows
        if m.get("_norm_phone")
    }

    # Two bulk queries instead of up to 2×N individual SELECTs
    existing_ext_ids: set[str] = set()
    if incoming_ext_ids:
        existing_ext_ids = {
            row[0]
            for row in db.query(Lead.external_lead_id)
            .filter(Lead.external_lead_id.in_(incoming_ext_ids))
            .all()
        }

    existing_phones: set[str] = set()
    if incoming_phones:
        existing_phones = {
            row[0]
            for row in db.query(Lead.phone_normalized)
            .filter(Lead.phone_normalized.in_(incoming_phones))
            .all()
        }

    new_leads = 0
    duplicates = 0
    errors = 0
    error_details = []

    for i, mapped in enumerate(mapped_rows, start=2):  # row 1 is header
        try:
            customer_name = mapped.get("customer_name", "").strip()
            phone = mapped.get("phone", "").strip()
            if not customer_name or not phone:
                errors += 1
                error_details.append({"row": i, "error": "Missing customer name or phone"})
                continue

            ext_id = mapped.get("external_lead_id")
            norm_phone = mapped["_norm_phone"]

            # Deduplication — O(1) set lookups, no DB round-trips
            if ext_id and str(ext_id) in existing_ext_ids:
                duplicates += 1
                continue
            if norm_phone and norm_phone in existing_phones:
                duplicates += 1
                continue

            # Parse source timestamp if present
            source_created_at = None
            if mapped.get("source_created_at"):
                try:
                    source_created_at = datetime.fromisoformat(str(mapped["source_created_at"]))
                except Exception:
                    pass

            lead = Lead(
                external_lead_id=str(ext_id) if ext_id else None,
                customer_name=customer_name,
                phone=phone,
                phone_normalized=norm_phone,
                email=mapped.get("email"),
                city=mapped.get("city"),
                country=mapped.get("country"),
                gender=mapped.get("gender"),
                vehicle_interest=mapped.get("vehicle_interest"),
                vehicle_version=mapped.get("vehicle_version"),
                vehicle_variant=mapped.get("vehicle_variant"),
                lead_type=mapped.get("lead_type"),
                units=mapped.get("units"),
                operation_type=mapped.get("operation_type"),
                preferred_call_time=mapped.get("preferred_call_time"),
                source=mapped.get("source"),
                campaign=mapped.get("campaign"),
                raw_source_data=mapped.get("raw_source_data"),
                source_created_at=source_created_at,
                status=LeadStatus.NEW,
            )
            db.add(lead)
            new_leads += 1

            # Keep in-memory sets current so duplicates within the same batch
            # are also caught without an extra DB hit.
            if ext_id:
                existing_ext_ids.add(str(ext_id))
            if norm_phone:
                existing_phones.add(norm_phone)

        except Exception as e:
            errors += 1
            error_details.append({"row": i, "error": str(e)})

    db.flush()

    log = ImportLog(
        imported_by=current_user.id,
        rows_found=rows_found,
        new_leads=new_leads,
        duplicates=duplicates,
        errors=errors,
        error_details=error_details if error_details else None,
    )
    db.add(log)
    db.commit()

    return {
        "message": "Import completed",
        "rows_found": rows_found,
        "new_leads": new_leads,
        "duplicates": duplicates,
        "errors": errors,
        "error_details": error_details[:20],  # cap for display
    }


@router.get("/history")
def import_history(
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    # Fix #7: joinedload eliminates the N+1 lazy SELECT per log row on
    # imported_by_user (was one SELECT per row, up to 20 per page load).
    logs = (
        db.query(ImportLog)
        .options(joinedload(ImportLog.imported_by_user))
        .order_by(ImportLog.imported_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id": log.id,
            "imported_by": log.imported_by_user.name if log.imported_by_user else "Unknown",
            "rows_found": log.rows_found,
            "new_leads": log.new_leads,
            "duplicates": log.duplicates,
            "errors": log.errors,
            "imported_at": log.imported_at,
        }
        for log in logs
    ]
