from datetime import datetime, date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional
from app.database import get_db
from app.models.user import User, UserRole
from app.models.lead import Lead, LeadStatus
from app.models.call import Call
from app.models.follow_up import FollowUp
from app.auth.dependencies import require_manager

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/summary")
def summary_report(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    query = db.query(Lead)
    if from_date:
        query = query.filter(Lead.created_at >= datetime.combine(from_date, datetime.min.time()))
    if to_date:
        query = query.filter(Lead.created_at <= datetime.combine(to_date, datetime.max.time()))

    total = query.count()
    won = query.filter(Lead.status == LeadStatus.WON).count()
    lost = query.filter(Lead.status == LeadStatus.LOST).count()
    conversion_rate = round((won / total * 100), 2) if total > 0 else 0.0

    status_breakdown = {}
    for s in LeadStatus:
        status_breakdown[s.value] = query.filter(Lead.status == s).count()

    return {
        "total_leads": total,
        "won": won,
        "lost": lost,
        "conversion_rate": conversion_rate,
        "status_breakdown": status_breakdown,
        "date_range": {
            "from": from_date.isoformat() if from_date else None,
            "to": to_date.isoformat() if to_date else None,
        },
    }


@router.get("/employee-performance")
def employee_performance(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
):
    employees = db.query(User).filter(User.role == UserRole.EMPLOYEE).all()
    result = []
    for emp in employees:
        lead_query = db.query(Lead).filter(Lead.assigned_employee_id == emp.id)
        if from_date:
            lead_query = lead_query.filter(Lead.created_at >= datetime.combine(from_date, datetime.min.time()))
        if to_date:
            lead_query = lead_query.filter(Lead.created_at <= datetime.combine(to_date, datetime.max.time()))

        total = lead_query.count()
        won = lead_query.filter(Lead.status == LeadStatus.WON).count()
        lost = lead_query.filter(Lead.status == LeadStatus.LOST).count()

        call_query = db.query(func.count(Call.id)).filter(Call.employee_id == emp.id)
        if from_date:
            call_query = call_query.filter(Call.call_datetime >= datetime.combine(from_date, datetime.min.time()))
        if to_date:
            call_query = call_query.filter(Call.call_datetime <= datetime.combine(to_date, datetime.max.time()))
        total_calls = call_query.scalar() or 0

        result.append({
            "employee_id": emp.id,
            "employee_name": emp.name,
            "active": emp.active,
            "assigned_leads": total,
            "total_calls": total_calls,
            "won": won,
            "lost": lost,
            "conversion_rate": round((won / total * 100), 2) if total > 0 else 0.0,
        })

    return {"employees": result}
