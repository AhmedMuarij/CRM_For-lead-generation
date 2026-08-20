from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel
from app.models.lead import LeadStatus


class LeadCreate(BaseModel):
    customer_name: str
    phone: str
    email: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    gender: Optional[str] = None
    vehicle_interest: Optional[str] = None
    vehicle_version: Optional[str] = None
    vehicle_variant: Optional[str] = None
    lead_type: Optional[str] = None
    units: Optional[str] = None
    operation_type: Optional[str] = None
    preferred_call_time: Optional[str] = None
    source: Optional[str] = None
    campaign: Optional[str] = None
    external_lead_id: Optional[str] = None
    raw_source_data: Optional[Dict[str, Any]] = None


class LeadUpdate(BaseModel):
    status: Optional[LeadStatus] = None
    internal_notes: Optional[str] = None


class LeadAssign(BaseModel):
    employee_id: int


class LeadOut(BaseModel):
    id: int
    external_lead_id: Optional[str]
    customer_name: str
    phone: str
    email: Optional[str]
    city: Optional[str]
    country: Optional[str]
    gender: Optional[str]
    vehicle_interest: Optional[str]
    vehicle_version: Optional[str]
    vehicle_variant: Optional[str]
    lead_type: Optional[str]
    units: Optional[str]
    operation_type: Optional[str]
    preferred_call_time: Optional[str]
    source: Optional[str]
    campaign: Optional[str]
    raw_source_data: Optional[Dict[str, Any]]
    status: LeadStatus
    assigned_employee_id: Optional[int]
    contact_attempt_count: int
    last_call_at: Optional[datetime]
    next_follow_up_at: Optional[datetime]
    internal_notes: Optional[str]
    source_created_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LeadListOut(BaseModel):
    """Slimmed-down version for list views."""
    id: int
    external_lead_id: Optional[str]
    customer_name: str
    phone: str
    city: Optional[str]
    vehicle_interest: Optional[str]
    units: Optional[str]
    operation_type: Optional[str]
    status: LeadStatus
    assigned_employee_id: Optional[int]
    assigned_employee_name: Optional[str] = None
    contact_attempt_count: int
    next_follow_up_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedLeads(BaseModel):
    items: list[LeadListOut]
    total: int
    page: int
    page_size: int
    total_pages: int
