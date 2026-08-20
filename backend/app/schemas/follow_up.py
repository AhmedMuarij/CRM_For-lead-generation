from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.follow_up import FollowUpStatus


class FollowUpCreate(BaseModel):
    scheduled_at: datetime
    notes: Optional[str] = None


class FollowUpReschedule(BaseModel):
    scheduled_at: datetime
    notes: Optional[str] = None


class FollowUpOut(BaseModel):
    id: int
    lead_id: int
    employee_id: int
    scheduled_at: datetime
    completed_at: Optional[datetime]
    status: FollowUpStatus
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    # enriched fields
    customer_name: Optional[str] = None
    phone: Optional[str] = None
    vehicle_interest: Optional[str] = None
    lead_status: Optional[str] = None
    last_call_at: Optional[datetime] = None
    assigned_employee_name: Optional[str] = None

    class Config:
        from_attributes = True
