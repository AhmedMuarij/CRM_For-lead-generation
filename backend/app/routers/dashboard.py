from datetime import datetime, date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User, UserRole
from app.models.lead import Lead, LeadStatus
from app.models.follow_up import FollowUp, FollowUpStatus
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def _status_counts(db: Session, employee_id: int | None = None) -> dict[str, int]:
    """One GROUP BY query instead of one COUNT per status."""
    q = db.query(Lead.status, func.count(Lead.id)).group_by(Lead.status)
    if employee_id is not None:
        q = q.filter(Lead.assigned_employee_id == employee_id)
    counts = {s.value: 0 for s in LeadStatus}
    for status, count in q.all():
        counts[status.value] = count
    return counts


def _bucket_follow_ups(scheduled_ats: list[datetime], now: datetime, today_start: datetime, today_end: datetime):
    """Bucket a list of scheduled_at values into overdue/today/upcoming counts in
    Python — cheaper than three separate range-filtered COUNT queries, and the
    portable way to do it across SQLite (tests) and Postgres (prod)."""
    overdue = today = upcoming = 0
    for dt in scheduled_ats:
        if dt < now:
            overdue += 1
        elif today_start <= dt <= today_end:
            today += 1
        elif dt > today_end:
            upcoming += 1
    return overdue, today, upcoming


@router.get("/employee")
def employee_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    eid = current_user.id
    now = datetime.utcnow()
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_end = datetime.combine(date.today(), datetime.max.time())

    counts = _status_counts(db, eid)
    total = sum(counts.values())

    scheduled_ats = [
        row[0] for row in db.query(FollowUp.scheduled_at).filter(
            FollowUp.employee_id == eid,
            FollowUp.status == FollowUpStatus.SCHEDULED,
        ).all()
    ]
    overdue_count, today_count, upcoming_count = _bucket_follow_ups(scheduled_ats, now, today_start, today_end)

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
            "new": counts[LeadStatus.NEW.value],
            "contacted": counts[LeadStatus.CONTACTED.value],
            "follow_up": counts[LeadStatus.FOLLOW_UP.value],
            "pending": counts[LeadStatus.PENDING.value],
            "no_response": counts[LeadStatus.NO_RESPONSE.value],
            "won": counts[LeadStatus.WON.value],
            "lost": counts[LeadStatus.LOST.value],
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

    # Overall stats — 2 queries total instead of 1 (total) + 2 (date ranges) + 7 (per status).
    status_counts = _status_counts(db)
    total = sum(status_counts.values())

    all_scheduled = [
        row[0] for row in db.query(FollowUp.scheduled_at)
        .filter(FollowUp.status == FollowUpStatus.SCHEDULED).all()
    ]
    overdue_total, today_total, _ = _bucket_follow_ups(all_scheduled, now, today_start, today_end)

    # Per-employee performance — 2 queries total instead of 9 per employee.
    employees = db.query(User).filter(User.role == UserRole.EMPLOYEE, User.active == True).all()
    employee_ids = [e.id for e in employees]

    per_emp_status: dict[int, dict[str, int]] = {eid: {s.value: 0 for s in LeadStatus} for eid in employee_ids}
    if employee_ids:
        rows = (
            db.query(Lead.assigned_employee_id, Lead.status, func.count(Lead.id))
            .filter(Lead.assigned_employee_id.in_(employee_ids))
            .group_by(Lead.assigned_employee_id, Lead.status)
            .all()
        )
        for eid, status, count in rows:
            per_emp_status[eid][status.value] = count

    per_emp_overdue: dict[int, int] = {eid: 0 for eid in employee_ids}
    if employee_ids:
        overdue_rows = (
            db.query(FollowUp.employee_id, func.count(FollowUp.id))
            .filter(
                FollowUp.employee_id.in_(employee_ids),
                FollowUp.status == FollowUpStatus.SCHEDULED,
                FollowUp.scheduled_at < now,
            )
            .group_by(FollowUp.employee_id)
            .all()
        )
        for eid, count in overdue_rows:
            per_emp_overdue[eid] = count

    emp_perf = [
        {
            "employee_id": emp.id,
            "employee_name": emp.name,
            "assigned": sum(per_emp_status[emp.id].values()),
            "new": per_emp_status[emp.id][LeadStatus.NEW.value],
            "contacted": per_emp_status[emp.id][LeadStatus.CONTACTED.value],
            "follow_up": per_emp_status[emp.id][LeadStatus.FOLLOW_UP.value],
            "pending": per_emp_status[emp.id][LeadStatus.PENDING.value],
            "no_response": per_emp_status[emp.id][LeadStatus.NO_RESPONSE.value],
            "won": per_emp_status[emp.id][LeadStatus.WON.value],
            "lost": per_emp_status[emp.id][LeadStatus.LOST.value],
            "overdue": per_emp_overdue[emp.id],
        }
        for emp in employees
    ]

    return {
        "stats": {
            "total_leads": total,
            "overdue_follow_ups": overdue_total,
            "today_follow_ups": today_total,
            **{k.lower(): v for k, v in status_counts.items()},
        },
        "employee_performance": emp_perf,
    }
