import enum
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from app.database import Base


class CallOutcome(str, enum.Enum):
    INTERESTED = "INTERESTED"
    NOT_INTERESTED = "NOT_INTERESTED"
    FOLLOW_UP_REQUIRED = "FOLLOW_UP_REQUIRED"
    PENDING = "PENDING"
    NO_ANSWER = "NO_ANSWER"
    BUSY = "BUSY"
    WRONG_NUMBER = "WRONG_NUMBER"
    OTHER = "OTHER"


class Call(Base):
    __tablename__ = "calls"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    call_datetime = Column(DateTime, nullable=False)
    outcome = Column(Enum(CallOutcome), nullable=False)
    notes = Column(Text, nullable=True)
    attempt_number = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    lead = relationship("Lead", back_populates="calls")
    employee = relationship("User", back_populates="calls")
