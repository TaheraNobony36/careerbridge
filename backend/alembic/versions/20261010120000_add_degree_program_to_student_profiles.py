"""Add degree program to student profiles

Revision ID: 20261010120000
Revises: 20261007130000
Create Date: 2026-10-10 12:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20261010120000"
down_revision: str | None = "20261007130000"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "student_profiles",
        sa.Column("degree_program", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("student_profiles", "degree_program")