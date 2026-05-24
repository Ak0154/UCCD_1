"""add translation columns

Revision ID: 8a2c3d4e5f6b
Revises: 7fef1b86c011
Create Date: 2026-05-23 20:42:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '8a2c3d4e5f6b'
down_revision: Union[str, None] = '7fef1b86c011'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('complaints', sa.Column('detected_language', sa.String(), nullable=True))
    op.add_column('complaints', sa.Column('translated_text', sa.Text(), nullable=True))
    op.add_column('complaints', sa.Column('translation_status', sa.String(), nullable=True, server_default=sa.text("'pending'")))


def downgrade() -> None:
    op.drop_column('complaints', 'translation_status')
    op.drop_column('complaints', 'translated_text')
    op.drop_column('complaints', 'detected_language')