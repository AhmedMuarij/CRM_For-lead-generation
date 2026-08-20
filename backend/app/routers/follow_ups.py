from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func
from typing import List, Optional
from app.database import get_db
from app.models.user import User, UserRole
from app.models.lead import Lead, LeadStatus
from app.models.follow_up import FollowUp, FollowUpStatus
from app.schemas.follow_up import FollowUpCreate, FollowUpReschedule, FollowUpOut
from app.auth.dependencies import get_current_user

router = APIRouter(tags=["follow_ups"])


def _enrich(fu: FollowUp) -> FollowUpOut:
    out = FollowUpOut.model_validate(fu)
    if fu.lead:
        out.customer_name = fu.lead.customer_name
        out.phone = fu.lead.phone
        out.vehicle_interest = fu.lead.vehicle_interest
        out.lead_status = fu.lead.status.value if fu.lead.status else None
        out.last_call_at = fu.lead.last_call_at
    if fu.employee:
        out.assigned_employee_name = fu.employee.name
    return out


@router.post("/api/leads/{lead_id}/follow-ups", response_model=FollowUpOut, status_code=201)
def schedule_follow_up(
    lead_id: int,
    payload: FollowUpCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if current_user.role == UserRole.EMPLOYEE and lead.assigned_employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Cancel any existing scheduled follow-up for this lead
    db.query(FollowUp).filter(
        FollowUp.lead_id == lead_id,
        FollowUp.status == FollowUpStatus.SCHEDULED,
    ).update({"status": FollowUpStatus.CANCELLED})

    fu = FollowUp(
        lead_id=lead_id,
        employee_id=current_user.id,
        scheduled_at=payload.scheduled_at,
        notes=payload.notes,
        status=FollowUpStatus.SCHEDULED,
    )
    db.add(fu)
    lead.next_follow_up_at = payload.scheduled_at
    lead.status = LeadStatus.FOLLOW_UP
    db.commit()
    db.refresh(fu)
    db.refresh(lead)
    return _enrich(fu)


@router.patch("/api/follow-ups/{fu_id}", response_model=FollowUpOut)
def reschedule_follow_up(
    fu_id: int,
    payload: FollowUpReschedule,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fu = db.query(FollowUp).options(joinedload(FollowUp.lead), joinedload(FollowUp.employee)).filter(FollowUp.id == fu_id).first()
    if not fu:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    if current_user.role == UserRole.EMPLOYEE and fu.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    fu.scheduled_at = payload.scheduled_at
    if payload.notes is not None:
        fu.notes = payload.notes
    fu.status = FollowUpStatus.SCHEDULED
    # Update lead's follow-up pointer
    if fu.lead:
        fu.lead.next_follow_up_at = payload.scheduled_at
    db.commit()
    db.refresh(fu)
    return _enrich(fu)


@router.post("/api/follow-ups/{fu_id}/complete", response_model=FollowUpOut)
def complete_follow_up(
    fu_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fu = db.query(FollowUp).options(joinedload(FollowUp.lead), joinedload(FollowUp.employee)).filter(FollowUp.id == fu_id).first()
    if not fu:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    if current_user.role == UserRole.EMPLOYEE and fu.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    fu.status = FollowUpStatus.COMPLETED
    fu.completed_at = datetime.utcnow()
    if fu.lead:
        fu.lead.next_follow_up_at = None
    db.commit()
    db.refresh(fu)
    return _enrich(fu)


@router.post("/api/follow-ups/{fu_id}/cancel", response_model=FollowUpOut)
def cancel_follow_up(
    fu_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fu = db.query(FollowUp).options(joinedload(FollowUp.lead), joinedload(FollowUp.employee)).filter(FollowUp.id == fu_id).first()
    if not fu:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    if current_user.role == UserRole.EMPLOYEE and fu.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    fu.status = FollowUpStatus.CANCELLED
    db.commit()
    db.refresh(fu)
    return _enrich(fu)


@router.get("/api/follow-ups", response_model=List[FollowUpOut])
def list_follow_ups(
    filter: Optional[str] = Query(None, description="today | overdue | upcoming | all"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.utcnow()
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_end = datetime.combine(date.today(), datetime.max.time())

    query = (
        db.query(FollowUp)
        .options(joinedload(FollowUp.lead), joinedload(FollowUp.employee))
        .filter(FollowUp.status == FollowUpStatus.SCHEDULED)
    )

    # Scope by employee role
    if current_user.role == UserRole.EMPLOYEE:
        query = query.filter(FollowUp.employee_id == current_user.id)

    if filter == "overdue":
        query = query.filter(FollowUp.scheduled_at < now)
    elif filter == "today":
        query = query.filter(FollowUp.scheduled_at >= today_start, FollowUp.scheduled_at <= today_end)
    elif filter == "upcoming":
        query = query.filter(FollowUp.scheduled_at > today_end)

    follow_ups = query.order_by(FollowUp.scheduled_at.asc()).all()
    return [_enrich(fu) for fu in follow_ups]
