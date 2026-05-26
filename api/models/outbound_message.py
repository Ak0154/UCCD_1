import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB

from api.db.session import Base


class OutboundMessage(Base):
    __tablename__ = "outbound_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    complaint_id = Column(UUID(as_uuid=True), nullable=True)
    channel = Column(String(100), nullable=False)
    source_ref = Column(String(255), nullable=True)
    message_text = Column(Text, nullable=False)
    direction = Column(String(20), default="outbound")
    status = Column(String(20), default="pending")
    provider_message_id = Column(String(512), nullable=True)
    sent_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    msg_metadata = Column('msg_metadata', JSONB, default=dict)