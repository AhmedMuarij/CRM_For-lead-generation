from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func, Index
from sqlalchemy.orm import relationship
from app.database import Base


class AuditLog(Base):
    """Immutable record of who changed what on a lead, and when.

    Rows are only ever inserted by the backend (never from the frontend),
    so this table is the source of truth for "who did what" — it cannot be
    tampered with by an employee through the UI/API.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(50), nullable=False)  # e.g. STATUS_CHANGE, ASSIGN, UPDATE, NOTE_ADDED
    field_name = Column(String(100), nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)

    # Relationships
    lead = relationship("Lead", back_populates="audit_logs")
    user = relationship("User")

    __table_args__ = (
        Index("ix_audit_logs_lead_created", "lead_id", "created_at"),
    )
