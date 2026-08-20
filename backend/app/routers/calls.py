from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User, UserRole
from app.models.lead import Lead, LeadStatus
from app.models.call import Call
from app.schemas.call import CallCreate, CallOut
from app.auth.dependencies import get_current_user

router = APIRouter(tags=["calls"])


@router.post("/api/leads/{lead_id}/calls", response_model=CallOut, status_code=201)
def log_call(
    lead_id: int,
    payload: CallCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if current_user.role == UserRole.EMPLOYEE and lead.assigned_employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Increment attempt count
    lead.contact_attempt_count += 1
    lead.last_call_at = payload.call_datetime

    call = Call(
        lead_id=lead_id,
        employee_id=current_user.id,
        call_datetime=payload.call_datetime,
        outcome=payload.outcome,
        notes=payload.notes,
        attempt_number=lead.contact_attempt_count,
    )
    db.add(call)
    db.commit()
    db.refresh(call)

    out = CallOut.model_validate(call)
    out.employee_name = current_user.name
    return out


@router.get("/api/leads/{lead_id}/calls", response_model=List[CallOut])
def get_calls(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if current_user.role == UserRole.EMPLOYEE and lead.assigned_employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    calls = db.query(Call).filter(Call.lead_id == lead_id).order_by(Call.call_datetime.desc()).all()
    result = []
    for c in calls:
        out = CallOut.model_validate(c)
        if c.employee:
            out.employee_name = c.employee.name
        result.append(out)
    return result
