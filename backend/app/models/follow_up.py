import enum
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text, func, Index
from sqlalchemy.orm import relationship
from app.database import Base


class FollowUpStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    OVERDUE = "OVERDUE"
    CANCELLED = "CANCELLED"


class FollowUp(Base):
    __tablename__ = "follow_ups"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    scheduled_at = Column(DateTime, nullable=False, index=True)
    completed_at = Column(DateTime, nullable=True)
    status = Column(Enum(FollowUpStatus), nullable=False, default=FollowUpStatus.SCHEDULED, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    lead = relationship("Lead", back_populates="follow_ups")
    employee = relationship("User", back_populates="follow_ups")

    # Fix #8: composite indexes for dashboard queries that filter on all three
    # columns simultaneously — prevents Postgres from using three single-column
    # indexes and scanning far more rows than necessary.
    __table_args__ = (
        Index(
            "ix_follow_ups_employee_status_scheduled",
            "employee_id", "status", "scheduled_at",
        ),
        Index(
            "ix_follow_ups_status_scheduled",   # manager-wide (no employee filter)
            "status", "scheduled_at",
        ),
    )
