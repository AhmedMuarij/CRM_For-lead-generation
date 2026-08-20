from datetime import datetime
from pydantic import BaseModel


class NoteCreate(BaseModel):
    content: str


class NoteOut(BaseModel):
    id: int
    lead_id: int
    employee_id: int
    employee_name: str = ""
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
