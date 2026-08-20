from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User, UserRole
from app.models.lead import Lead
from app.schemas.user import UserCreate, UserUpdate, UserOut, UserOutWithStats, UserPasswordReset
from app.auth.utils import get_password_hash
from app.auth.dependencies import require_manager, get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])


def _user_with_stats(user: User, db: Session) -> UserOutWithStats:
    total = db.query(Lead).filter(Lead.assigned_employee_id == user.id).count()
    active = db.query(Lead).filter(
        Lead.assigned_employee_id == user.id,
        Lead.status.notin_(["WON", "LOST"])
    ).count()
    out = UserOutWithStats.model_validate(user)
    out.assigned_leads_count = total
    out.active_leads_count = active
    return out


@router.get("", response_model=List[UserOutWithStats])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    users = db.query(User).order_by(User.name).all()
    return [_user_with_stats(u, db) for u in users]


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserOutWithStats)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_with_stats(user, db)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}/password", response_model=UserOut)
def reset_password(
    user_id: int,
    payload: UserPasswordReset,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.password_hash = get_password_hash(payload.new_password)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}/leads")
def get_user_leads(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    leads = db.query(Lead).filter(Lead.assigned_employee_id == user_id).all()
    return [
        {
            "id": l.id,
            "customer_name": l.customer_name,
            "phone": l.phone,
            "status": l.status,
            "city": l.city,
            "next_follow_up_at": l.next_follow_up_at,
            "created_at": l.created_at,
        }
        for l in leads
    ]
