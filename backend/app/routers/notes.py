from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User, UserRole
from app.models.lead import Lead
from app.models.note import LeadNote
from app.schemas.note import NoteCreate, NoteOut
from app.auth.dependencies import get_current_user

router = APIRouter(tags=["notes"])


@router.post("/api/leads/{lead_id}/notes", response_model=NoteOut, status_code=201)
def add_note(
    lead_id: int,
    payload: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if current_user.role == UserRole.EMPLOYEE and lead.assigned_employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    note = LeadNote(lead_id=lead_id, employee_id=current_user.id, content=payload.content)
    db.add(note)
    db.commit()
    db.refresh(note)
    out = NoteOut.model_validate(note)
    out.employee_name = current_user.name
    return out


@router.get("/api/leads/{lead_id}/notes", response_model=List[NoteOut])
def get_notes(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if current_user.role == UserRole.EMPLOYEE and lead.assigned_employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    notes = db.query(LeadNote).filter(LeadNote.lead_id == lead_id).order_by(LeadNote.created_at.desc()).all()
    result = []
    for n in notes:
        out = NoteOut.model_validate(n)
        if n.employee:
            out.employee_name = n.employee.name
        result.append(out)
    return result
