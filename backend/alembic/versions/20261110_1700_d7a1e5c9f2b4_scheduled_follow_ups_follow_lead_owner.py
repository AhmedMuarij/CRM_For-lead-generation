"""scheduled_follow_ups_follow_lead_owner

Revision ID: d7a1e5c9f2b4
Revises: c4e9f1a2b3d5
Create Date: 2026-11-10 17:00:00.000000

Data fix, no schema change. Follow-ups used to be saved under whoever clicked
"Schedule" (often the manager) instead of the employee who owns the lead, and
reassigning a lead left its pending follow-ups with the old employee. Those
rows never showed up in the right employee's follow-up list or overdue count.

This moves every still-SCHEDULED follow-up to its lead's current assigned
employee. Completed and cancelled follow-ups are left alone as history.
Safe to run more than once.
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'd7a1e5c9f2b4'
down_revision: Union[str, None] = 'c4e9f1a2b3d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE follow_ups
        SET employee_id = (
            SELECT leads.assigned_employee_id FROM leads
            WHERE leads.id = follow_ups.lead_id
        )
        WHERE status = 'SCHEDULED'
          AND EXISTS (
            SELECT 1 FROM leads
            WHERE leads.id = follow_ups.lead_id
              AND leads.assigned_employee_id IS NOT NULL
              AND leads.assigned_employee_id <> follow_ups.employee_id
          )
        """
    )


def downgrade() -> None:
    # The original (wrong) owners aren't recorded anywhere, so there is
    # nothing to restore.
    pass
