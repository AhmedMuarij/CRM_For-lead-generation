from datetime import datetime, date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.database import get_db
from app.models.user import User, UserRole
from app.models.lead import Lead, LeadStatus
from app.models.follow_up import FollowUp, FollowUpStatus
from app.models.call import Call
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def _status_count(db, status, employee_id=None):
    q = db.query(func.count(Lead.id)).filter(Lead.status == status)
    if employee_id:
        q = q.filter(Lead.assigned_employee_id == employee_id)
    return q.scalar() or 0


@router.get("/employee")
def employee_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    eid = current_user.id
    now = datetime.utcnow()
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_end = datetime.combine(date.today(), datetime.max.time())

    total = db.query(func.count(Lead.id)).filter(Lead.assigned_employee_id == eid).scalar() or 0
    new = _status_count(db, LeadStatus.NEW, eid)
    contacted = _status_count(db, LeadStatus.CONTACTED, eid)
    follow_up = _status_count(db, LeadStatus.FOLLOW_UP, eid)
    pending = _status_count(db, LeadStatus.PENDING, eid)
    no_response = _status_count(db, LeadStatus.NO_RESPONSE, eid)
    won = _status_count(db, LeadStatus.WON, eid)
    lost = _status_count(db, LeadStatus.LOST, eid)

    overdue_count = db.query(func.count(FollowUp.id)).filter(
        FollowUp.employee_id == eid,
        FollowUp.status == FollowUpStatus.SCHEDULED,
        FollowUp.scheduled_at < now,
    ).scalar() or 0

    today_count = db.query(func.count(FollowUp.id)).filter(
        FollowUp.employee_id == eid,
        FollowUp.status == FollowUpStatus.SCHEDULED,
        FollowUp.scheduled_at >= today_start,
        FollowUp.scheduled_at <= today_end,
    ).scalar() or 0

    upcoming_count = db.query(func.count(FollowUp.id)).filter(
        FollowUp.employee_id == eid,
        FollowUp.status == FollowUpStatus.SCHEDULED,
        FollowUp.scheduled_at > today_end,
    ).scalar() or 0

    # Priority lists
    overdue_leads = (
        db.query(FollowUp)
        .join(Lead, Lead.id == FollowUp.lead_id)
        .filter(
            FollowUp.employee_id == eid,
            FollowUp.status == FollowUpStatus.SCHEDULED,
            FollowUp.scheduled_at < now,
        )
        .order_by(FollowUp.scheduled_at.asc())
        .limit(10)
        .all()
    )

    today_leads = (
        db.query(FollowUp)
        .join(Lead, Lead.id == FollowUp.lead_id)
        .filter(
            FollowUp.employee_id == eid,
            FollowUp.status == FollowUpStatus.SCHEDULED,
            FollowUp.scheduled_at >= today_start,
            FollowUp.scheduled_at <= today_end,
        )
        .order_by(FollowUp.scheduled_at.asc())
        .limit(10)
        .all()
    )

    new_leads = (
        db.query(Lead)
        .filter(Lead.assigned_employee_id == eid, Lead.status == LeadStatus.NEW)
        .order_by(Lead.created_at.asc())
        .limit(10)
        .all()
    )

    def fu_summary(fu: FollowUp):
        return {
            "follow_up_id": fu.id,
            "lead_id": fu.lead_id,
            "customer_name": fu.lead.customer_name if fu.lead else "",
            "phone": fu.lead.phone if fu.lead else "",
            "vehicle_interest": fu.lead.vehicle_interest if fu.lead else "",
            "scheduled_at": fu.scheduled_at,
            "notes": fu.notes,
        }

    def lead_summary(l: Lead):
        return {
            "lead_id": l.id,
            "customer_name": l.customer_name,
            "phone": l.phone,
            "city": l.city,
            "vehicle_interest": l.vehicle_interest,
            "status": l.status,
            "created_at": l.created_at,
        }

    return {
        "stats": {
            "total": total,
            "new": new,
            "contacted": contacted,
            "follow_up": follow_up,
            "pending": pending,
            "no_response": no_response,
            "won": won,
            "lost": lost,
            "overdue": overdue_count,
            "today_follow_ups": today_count,
            "upcoming": upcoming_count,
        },
        "overdue_follow_ups": [fu_summary(fu) for fu in overdue_leads],
        "today_follow_ups": [fu_summary(fu) for fu in today_leads],
        "new_leads": [lead_summary(l) for l in new_leads],
    }


@router.get("/manager")
def manager_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.utcnow()
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_end = datetime.combine(date.today(), datetime.max.time())

    # Overall stats
    total = db.query(func.count(Lead.id)).scalar() or 0
    overdue_total = db.query(func.count(FollowUp.id)).filter(
        FollowUp.status == FollowUpStatus.SCHEDULED,
        FollowUp.scheduled_at < now,
    ).scalar() or 0
    today_total = db.query(func.count(FollowUp.id)).filter(
        FollowUp.status == FollowUpStatus.SCHEDULED,
        FollowUp.scheduled_at >= today_start,
        FollowUp.scheduled_at <= today_end,
    ).scalar() or 0

    status_counts = {}
    for s in LeadStatus:
        status_counts[s.value.lower()] = _status_count(db, s)

    # Per-employee performance
    employees = db.query(User).filter(User.role == UserRole.EMPLOYEE, User.active == True).all()
    emp_perf = []
    for emp in employees:
        eid = emp.id
        emp_total = db.query(func.count(Lead.id)).filter(Lead.assigned_employee_id == eid).scalar() or 0
        emp_overdue = db.query(func.count(FollowUp.id)).filter(
            FollowUp.employee_id == eid,
            FollowUp.status == FollowUpStatus.SCHEDULED,
            FollowUp.scheduled_at < now,
        ).scalar() or 0
        emp_perf.append({
            "employee_id": emp.id,
            "employee_name": emp.name,
            "assigned": emp_total,
            "new": _status_count(db, LeadStatus.NEW, eid),
            "contacted": _status_count(db, LeadStatus.CONTACTED, eid),
            "follow_up": _status_count(db, LeadStatus.FOLLOW_UP, eid),
            "pending": _status_count(db, LeadStatus.PENDING, eid),
            "no_response": _status_count(db, LeadStatus.NO_RESPONSE, eid),
            "won": _status_count(db, LeadStatus.WON, eid),
            "lost": _status_count(db, LeadStatus.LOST, eid),
            "overdue": emp_overdue,
        })

    return {
        "stats": {
            "total_leads": total,
            "overdue_follow_ups": overdue_total,
            "today_follow_ups": today_total,
            **status_counts,
        },
        "employee_performance": emp_perf,
    }
