"""add outbound_messages and webhook_events tables

Revision ID: 9b3d4e5f6a7c
Revises: 8a2c3d4e5f6b
Create Date: 2026-05-26 11:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


revision: str = '9b3d4e5f6a7c'
down_revision: Union[str, None] = '8a2c3d4e5f6b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'outbound_messages',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('complaint_id', UUID(as_uuid=True), nullable=True),
        sa.Column('channel', sa.String(100), nullable=False),
        sa.Column('source_ref', sa.String(255), nullable=True),
        sa.Column('message_text', sa.Text, nullable=False),
        sa.Column('direction', sa.String(20), server_default='outbound'),
        sa.Column('status', sa.String(20), server_default='pending'),
        sa.Column('provider_message_id', sa.String(512), nullable=True),
        sa.Column('sent_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('error_message', sa.Text, nullable=True),
        sa.Column('msg_metadata', JSONB, server_default=sa.text("'{}'::jsonb")),
    )
    op.create_index('idx_outbound_complaint', 'outbound_messages', ['complaint_id'])
    op.create_index('idx_outbound_channel', 'outbound_messages', ['channel'])

    op.create_table(
        'webhook_events',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('channel', sa.String(100), nullable=False),
        sa.Column('event_type', sa.String(100), nullable=False),
        sa.Column('raw_payload', JSONB, nullable=False),
        sa.Column('processed', sa.Boolean, server_default=sa.text('false')),
        sa.Column('complaint_id', UUID(as_uuid=True), nullable=True),
        sa.Column('error_message', sa.Text, nullable=True),
        sa.Column('received_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('idx_webhook_channel', 'webhook_events', ['channel'])


def downgrade() -> None:
    op.drop_index('idx_webhook_channel', table_name='webhook_events')
    op.drop_table('webhook_events')
    op.drop_index('idx_outbound_channel', table_name='outbound_messages')
    op.drop_index('idx_outbound_complaint', table_name='outbound_messages')
    op.drop_table('outbound_messages')