"""add_composite_follow_up_indexes

Revision ID: c4e9f1a2b3d5
Revises: b2f4a9c1d3e7
Create Date: 2026-09-03 15:48:00.000000

Performance fix #8: adds two composite indexes on the follow_ups table that
the dashboard queries filter on simultaneously:

  1. ix_follow_ups_employee_status_scheduled  (employee_id, status, scheduled_at)
     — used by both employee_dashboard and the manager's per-employee overdue count.

  2. ix_follow_ups_status_scheduled           (status, scheduled_at)
     — used by manager_dashboard when querying across all employees.

Without these, Postgres picks one of the three existing single-column indexes
and still has to scan far more rows than necessary.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4e9f1a2b3d5'
down_revision: Union[str, None] = 'b2f4a9c1d3e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        'ix_follow_ups_employee_status_scheduled',
        'follow_ups',
        ['employee_id', 'status', 'scheduled_at'],
        unique=False,
    )
    op.create_index(
        'ix_follow_ups_status_scheduled',
        'follow_ups',
        ['status', 'scheduled_at'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index('ix_follow_ups_status_scheduled', table_name='follow_ups')
    op.drop_index('ix_follow_ups_employee_status_scheduled', table_name='follow_ups')
