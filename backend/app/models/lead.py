import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Enum, ForeignKey,
    Text, JSON, func, Index
)
from sqlalchemy.orm import relationship
from app.database import Base


class LeadStatus(str, enum.Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    FOLLOW_UP = "FOLLOW_UP"
    PENDING = "PENDING"
    NO_RESPONSE = "NO_RESPONSE"
    WON = "WON"
    LOST = "LOST"


ACTIVE_STATUSES = [
    LeadStatus.NEW,
    LeadStatus.CONTACTED,
    LeadStatus.FOLLOW_UP,
    LeadStatus.PENDING,
    LeadStatus.NO_RESPONSE,
]

CLOSED_STATUSES = [LeadStatus.WON, LeadStatus.LOST]


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)

    # --- Source / Google Sheet fields ---
    external_lead_id = Column(String(100), unique=True, nullable=True, index=True)
    customer_name = Column(String(200), nullable=False)
    phone = Column(String(50), nullable=False)
    phone_normalized = Column(String(50), nullable=True, index=True)  # for deduplication
    email = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    gender = Column(String(20), nullable=True)
    vehicle_interest = Column(String(150), nullable=True)
    vehicle_version = Column(String(100), nullable=True)
    vehicle_variant = Column(String(100), nullable=True)
    lead_type = Column(String(100), nullable=True)
    units = Column(String(50), nullable=True)
    operation_type = Column(String(50), nullable=True)
    preferred_call_time = Column(String(50), nullable=True)
    source = Column(String(50), nullable=True)
    campaign = Column(String(200), nullable=True)
    raw_source_data = Column(JSON, nullable=True)  # catch-all for unknown columns

    # --- CRM-owned fields ---
    status = Column(Enum(LeadStatus), nullable=False, default=LeadStatus.NEW, index=True)
    assigned_employee_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    contact_attempt_count = Column(Integer, default=0, nullable=False)
    last_call_at = Column(DateTime, nullable=True)
    next_follow_up_at = Column(DateTime, nullable=True)
    internal_notes = Column(Text, nullable=True)

    # --- Timestamps ---
    source_created_at = Column(DateTime, nullable=True)   # original timestamp from Google Sheet
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # --- Relationships ---
    assigned_employee = relationship("User", back_populates="assigned_leads", foreign_keys=[assigned_employee_id])
    calls = relationship("Call", back_populates="lead", cascade="all, delete-orphan", order_by="Call.call_datetime")
    follow_ups = relationship("FollowUp", back_populates="lead", cascade="all, delete-orphan", order_by="FollowUp.scheduled_at")
    notes = relationship("LeadNote", back_populates="lead", cascade="all, delete-orphan", order_by="LeadNote.created_at")

    __table_args__ = (
        Index("ix_leads_status_employee", "status", "assigned_employee_id"),
    )
