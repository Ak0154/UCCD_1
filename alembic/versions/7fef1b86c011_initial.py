"""initial

Revision ID: 7fef1b86c011
Revises:
Create Date: 2026-05-23 18:41:22.398305

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = '7fef1b86c011'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table('users',
        sa.Column('id', sa.UUID(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint("role IN ('AGENT', 'SUPERVISOR')", name="users_role_check"),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    op.create_table('complaints',
        sa.Column('id', sa.UUID(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column('customer_id', sa.String(length=255), nullable=False),
        sa.Column('channel', sa.String(length=100), nullable=False),
        sa.Column('source_ref', sa.String(length=255), nullable=True),
        sa.Column('raw_text', sa.Text(), nullable=False),
        sa.Column('language_code', sa.String(length=10), nullable=True),
        sa.Column('voice_transcript', postgresql.JSONB(), nullable=True),
        sa.Column('attachments', postgresql.JSONB(), nullable=True),
        sa.Column('bot_slots', postgresql.JSONB(), nullable=True),
        sa.Column('complaint_type', sa.String(length=100), nullable=True),
        sa.Column('type_confidence', sa.Float(), nullable=True),
        sa.Column('product_code', sa.String(length=50), nullable=True),
        sa.Column('intent', sa.String(length=255), nullable=True),
        sa.Column('regulatory_obligation', sa.String(length=100), nullable=True),
        sa.Column('severity_score', sa.Float(), nullable=True),
        sa.Column('sla_tier', sa.String(length=50), nullable=True),
        sa.Column('emotion_arc', postgresql.JSONB(), nullable=True),
        sa.Column('cluster_id', sa.String(length=100), nullable=True),
        sa.Column('breach_probability', sa.Float(), nullable=True),
        sa.Column('ai_draft', sa.Text(), nullable=True),
        sa.Column('root_cause', sa.String(length=255), nullable=True),
        sa.Column('regulatory_flag', sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column('vip_customer', sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column('viral_risk_score', sa.Float(), nullable=True),
        sa.Column('priority_tier', sa.Integer(), nullable=False, server_default=sa.text("4")),
        sa.Column('sla_deadline', sa.DateTime(timezone=True), nullable=True),
        sa.Column('sla_breached', sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column('status', sa.String(length=50), nullable=False, server_default=sa.text("'queued'")),
        sa.Column('assigned_to', sa.String(length=255), nullable=True),
        sa.Column('resolution_notes', sa.Text(), nullable=True),
        sa.Column('pre_escalate', sa.Boolean(), nullable=True, server_default=sa.text("false")),
        sa.Column('escalation_reason', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.execute("ALTER TABLE complaints ADD COLUMN embedding vector(1536)")

    op.create_index(op.f('ix_complaints_customer_id'), 'complaints', ['customer_id'], unique=False)
    op.create_index(op.f('ix_complaints_status'), 'complaints', ['status'], unique=False)
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_complaints_embedding_hnsw "
        "ON complaints USING hnsw (embedding vector_cosine_ops)"
    )


def downgrade() -> None:
    op.drop_index('idx_complaints_embedding_hnsw', table_name='complaints')
    op.drop_index(op.f('ix_complaints_status'), table_name='complaints')
    op.drop_index(op.f('ix_complaints_customer_id'), table_name='complaints')
    op.drop_table('complaints')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    op.execute("DROP EXTENSION IF EXISTS vector")