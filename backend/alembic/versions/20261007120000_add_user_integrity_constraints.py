"""Add User role and email integrity constraints.

Revision ID: 20261007120000
Revises: 20261003150000
Create Date: 2026-10-07 12:00:00.000000
"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20261007120000"
down_revision: str | None = "20261003150000"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_index("ix_users_email", table_name="users")
    op.create_check_constraint(
        "ck_users_email_lowercase",
        "users",
        "email = lower(email)",
    )
    op.create_check_constraint(
        "ck_users_role",
        "users",
        "role IN ('student', 'company', 'admin', 'super_admin')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_users_role", "users", type_="check")
    op.drop_constraint("ck_users_email_lowercase", "users", type_="check")
    op.create_index("ix_users_email", "users", ["email"], unique=True)
