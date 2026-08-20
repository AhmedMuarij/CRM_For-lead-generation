from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
from typing import Optional, List
from app.database import get_db
from app.models.user import User, UserRole
from app.models.lead import Lead, LeadStatus, ACTIVE_STATUSES
from app.models.follow_up import FollowUp, FollowUpStatus
from app.schemas.lead import LeadCreate, LeadUpdate, LeadOut, LeadListOut, LeadAssign, PaginatedLeads
from app.auth.dependencies import get_current_user, require_manager
from app.services.phone_utils import normalize_phone

router = APIRouter(prefix="/api/leads", tags=["leads"])


def _build_list_item(lead: Lead, db: Session) -> dict:
    emp_name = None
    if lead.assigned_employee:
        emp_name = lead.assigned_employee.name
    return {
        "id": lead.id,
        "external_lead_id": lead.external_lead_id,
        "customer_name": lead.customer_name,
        "phone": lead.phone,
        "city": lead.city,
        "vehicle_interest": lead.vehicle_interest,
        "units": lead.units,
        "operation_type": lead.operation_type,
        "status": lead.status,
        "assigned_employee_id": lead.assigned_employee_id,
        "assigned_employee_name": emp_name,
        "contact_attempt_count": lead.contact_attempt_count,
        "next_follow_up_at": lead.next_follow_up_at,
        "created_at": lead.created_at,
    }


@router.get("", response_model=PaginatedLeads)
def list_leads(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    status: Optional[str] = None,
    employee_id: Optional[int] = None,
    city: Optional[str] = None,
    source: Optional[str] = None,
    search: Optional[str] = None,
    follow_up_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Lead).options(joinedload(Lead.assigned_employee))

    # Employees only see their own leads
    if current_user.role == UserRole.EMPLOYEE:
        query = query.filter(Lead.assigned_employee_id == current_user.id)
    elif employee_id:
        query = query.filter(Lead.assigned_employee_id == employee_id)

    if status:
        query = query.filter(Lead.status == status)
    if city:
        query = query.filter(Lead.city.ilike(f"%{city}%"))
    if source:
        query = query.filter(Lead.source.ilike(f"%{source}%"))
    if search:
        query = query.filter(
            or_(
                Lead.customer_name.ilike(f"%{search}%"),
                Lead.phone.ilike(f"%{search}%"),
                Lead.external_lead_id.ilike(f"%{search}%"),
            )
        )
    if follow_up_date:
        query = query.filter(
            and_(
                Lead.next_follow_up_at >= datetime.combine(follow_up_date, datetime.min.time()),
                Lead.next_follow_up_at < datetime.combine(follow_up_date, datetime.max.time()),
            )
        )

    total = query.count()
    leads = query.order_by(Lead.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    import math
    return PaginatedLeads(
        items=[LeadListOut(**_build_list_item(l, db)) for l in leads],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total else 1,
    )


@router.get("/{lead_id}", response_model=LeadOut)
def get_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    # Employees can only see their own leads
    if current_user.role == UserRole.EMPLOYEE and lead.assigned_employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return lead


@router.post("", response_model=LeadOut, status_code=status.HTTP_201_CREATED)
def create_lead(
    payload: LeadCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    norm_phone = normalize_phone(payload.phone)
    if payload.external_lead_id:
        existing = db.query(Lead).filter(Lead.external_lead_id == payload.external_lead_id).first()
        if existing:
            raise HTTPException(status_code=409, detail="Lead with this external ID already exists")
    if norm_phone:
        existing = db.query(Lead).filter(Lead.phone_normalized == norm_phone).first()
        if existing:
            raise HTTPException(status_code=409, detail="Lead with this phone number already exists")
    lead = Lead(**payload.model_dump(), phone_normalized=norm_phone)
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.patch("/{lead_id}", response_model=LeadOut)
def update_lead(
    lead_id: int,
    payload: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if current_user.role == UserRole.EMPLOYEE and lead.assigned_employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    # Validate FOLLOW_UP requires next_follow_up_at (set via follow-ups endpoint, checked here)
    if payload.status == LeadStatus.FOLLOW_UP and not lead.next_follow_up_at:
        raise HTTPException(
            status_code=400,
            detail="Please schedule a follow-up date and time first before setting status to Follow-Up",
        )
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(lead, key, value)
    db.commit()
    db.refresh(lead)
    return lead


@router.post("/{lead_id}/assign", response_model=LeadOut)
def assign_lead(
    lead_id: int,
    payload: LeadAssign,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    employee = db.query(User).filter(User.id == payload.employee_id, User.active == True).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found or inactive")
    lead.assigned_employee_id = payload.employee_id
    db.commit()
    db.refresh(lead)
    return lead


@router.post("/{lead_id}/reopen", response_model=LeadOut)
def reopen_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if lead.status not in [LeadStatus.WON, LeadStatus.LOST]:
        raise HTTPException(status_code=400, detail="Only closed leads can be reopened")
    lead.status = LeadStatus.CONTACTED
    db.commit()
    db.refresh(lead)
    return lead
