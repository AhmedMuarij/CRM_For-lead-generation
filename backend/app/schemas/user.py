from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.EMPLOYEE


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    active: Optional[bool] = None


class UserPasswordReset(BaseModel):
    new_password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserOutWithStats(UserOut):
    assigned_leads_count: int = 0
    active_leads_count: int = 0
