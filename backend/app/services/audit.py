"""Helpers for writing to the audit_logs table.

Rules of thumb for callers:
  * Always call this from inside the same request/transaction that makes the
    change, *before* db.commit() — that way the audit row and the actual
    change land together (or not at all, if something fails).
  * Never let the frontend construct these rows directly; only backend
    route handlers should call `record()` / `record_field_changes()`.
"""
from typing import Any, Optional
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.models.user import User

FIELD_LABELS = {
    "status": "Status",
    "assigned_employee_id": "Assigned employee",
    "internal_notes": "Internal notes",
    "next_follow_up_at": "Next follow-up",
    "customer_name": "Customer name",
    "phone": "Phone",
    "email": "Email",
}

# Some fields get a more specific action name than the generic "UPDATE".
FIELD_ACTIONS = {
    "status": "STATUS_CHANGE",
    "assigned_employee_id": "ASSIGN",
}


def _label(field_name: str) -> str:
    return FIELD_LABELS.get(field_name, field_name.replace("_", " ").capitalize())


def _stringify(value: Any) -> Optional[str]:
    if value is None:
        return None
    if hasattr(value, "value"):  # enums
        return str(value.value)
    return str(value)


def record(
    db: Session,
    *,
    lead_id: int,
    user: Optional[User],
    action: str,
    field_name: Optional[str] = None,
    old_value: Any = None,
    new_value: Any = None,
    description: Optional[str] = None,
) -> AuditLog:
    """Insert one audit log row (does not commit — caller's transaction owns that)."""
    entry = AuditLog(
        lead_id=lead_id,
        user_id=user.id if user else None,
        action=action,
        field_name=field_name,
        old_value=_stringify(old_value),
        new_value=_stringify(new_value),
        description=description,
    )
    db.add(entry)
    return entry


def record_field_changes(
    db: Session,
    *,
    lead_id: int,
    user: Optional[User],
    changes: dict[str, tuple[Any, Any]],
    action: str = "UPDATE",
) -> list[AuditLog]:
    """Write one audit row per changed field.

    `changes` maps field_name -> (old_value, new_value). Fields whose old
    and new value are equal are skipped (no-op edits shouldn't clutter the
    history).
    """
    entries = []
    for field_name, (old_value, new_value) in changes.items():
        if old_value == new_value:
            continue
        label = _label(field_name)
        entries.append(
            record(
                db,
                lead_id=lead_id,
                user=user,
                action=FIELD_ACTIONS.get(field_name, action),
                field_name=field_name,
                old_value=old_value,
                new_value=new_value,
                description=f"{label} changed from {_stringify(old_value) or '—'} to {_stringify(new_value) or '—'}",
            )
        )
    return entries
