import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Enum, ForeignKey,
    Text, JSON, func
)
from sqlalchemy.orm import relationship
from app.database import Base


class UserRole(str, enum.Enum):
    MANAGER = "MANAGER"
    EMPLOYEE = "EMPLOYEE"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.EMPLOYEE)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    assigned_leads = relationship("Lead", back_populates="assigned_employee", foreign_keys="Lead.assigned_employee_id")
    calls = relationship("Call", back_populates="employee")
    follow_ups = relationship("FollowUp", back_populates="employee")
    notes = relationship("LeadNote", back_populates="employee")
    import_logs = relationship("ImportLog", back_populates="imported_by_user")
