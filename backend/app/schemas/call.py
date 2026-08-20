from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.call import CallOutcome


class CallCreate(BaseModel):
    call_datetime: datetime
    outcome: CallOutcome
    notes: Optional[str] = None


class CallOut(BaseModel):
    id: int
    lead_id: int
    employee_id: int
    employee_name: Optional[str] = None
    call_datetime: datetime
    outcome: CallOutcome
    notes: Optional[str]
    attempt_number: int
    created_at: datetime

    class Config:
        from_attributes = True
