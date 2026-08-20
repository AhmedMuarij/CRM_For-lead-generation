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
    employee_ids = [e.id for e in employees]

    # One GROUP BY per metric instead of 4 queries per employee — the
    # per-employee loop this replaced made 4N round trips, which is slow even
    # locally and can exceed a serverless function's time limit against a
    # real network-hop database.
    lead_stats = {eid: {"total": 0, "won": 0, "lost": 0} for eid in employee_ids}
    if employee_ids:
        lead_q = db.query(Lead.assigned_employee_id, Lead.status, func.count(Lead.id)).filter(
            Lead.assigned_employee_id.in_(employee_ids)
        )
        if from_date:
            lead_q = lead_q.filter(Lead.created_at >= datetime.combine(from_date, datetime.min.time()))
        if to_date:
            lead_q = lead_q.filter(Lead.created_at <= datetime.combine(to_date, datetime.max.time()))
        for eid, status, count in lead_q.group_by(Lead.assigned_employee_id, Lead.status).all():
            lead_stats[eid]["total"] += count
            if status == LeadStatus.WON:
                lead_stats[eid]["won"] = count
            elif status == LeadStatus.LOST:
                lead_stats[eid]["lost"] = count

    call_counts = {eid: 0 for eid in employee_ids}
    if employee_ids:
        call_q = db.query(Call.employee_id, func.count(Call.id)).filter(
            Call.employee_id.in_(employee_ids)
        )
        if from_date:
            call_q = call_q.filter(Call.call_datetime >= datetime.combine(from_date, datetime.min.time()))
        if to_date:
            call_q = call_q.filter(Call.call_datetime <= datetime.combine(to_date, datetime.max.time()))
        for eid, count in call_q.group_by(Call.employee_id).all():
            call_counts[eid] = count

    result = []
    for emp in employees:
        stats = lead_stats[emp.id]
        total, won, lost = stats["total"], stats["won"], stats["lost"]
        result.append({
            "employee_id": emp.id,
            "employee_name": emp.name,
            "active": emp.active,
            "assigned_leads": total,
            "total_calls": call_counts[emp.id],
            "won": won,
            "lost": lost,
            "conversion_rate": round((won / total * 100), 2) if total > 0 else 0.0,
        })

    return {"employees": result}
