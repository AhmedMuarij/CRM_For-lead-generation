# Import all models here so Alembic can detect them for migrations
from app.models.user import User, UserRole
from app.models.lead import Lead, LeadStatus, ACTIVE_STATUSES, CLOSED_STATUSES
from app.models.call import Call, CallOutcome
from app.models.follow_up import FollowUp, FollowUpStatus
from app.models.note import LeadNote
from app.models.import_log import ImportLog

__all__ = [
    "User", "UserRole",
    "Lead", "LeadStatus", "ACTIVE_STATUSES", "CLOSED_STATUSES",
    "Call", "CallOutcome",
    "FollowUp", "FollowUpStatus",
    "LeadNote",
    "ImportLog",
]
