"""add user identification fields for complaint details collection

Revision ID: a1b2c3d4e5f6
Revises: 9b3d4e5f6a7c
Create Date: 2026-05-27 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '9b3d4e5f6a7c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('complaints', sa.Column('customer_name', sa.String(255), nullable=True))
    op.add_column('complaints', sa.Column('customer_email', sa.String(255), nullable=True))
    op.add_column('complaints', sa.Column('customer_phone', sa.String(50), nullable=True))
    op.add_column('complaints', sa.Column('account_number', sa.String(100), nullable=True))
    op.add_column('complaints', sa.Column('awaiting_details', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.add_column('complaints', sa.Column('details_requested_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('complaints', 'details_requested_at')
    op.drop_column('complaints', 'awaiting_details')
    op.drop_column('complaints', 'account_number')
    op.drop_column('complaints', 'customer_phone')
    op.drop_column('complaints', 'customer_email')
    op.drop_column('complaints', 'customer_name')