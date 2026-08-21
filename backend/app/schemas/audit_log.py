from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AuditLogOut(BaseModel):
    id: int
    lead_id: int
    user_id: Optional[int]
    user_name: Optional[str] = None
    action: str
    field_name: Optional[str]
    old_value: Optional[str]
    new_value: Optional[str]
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
