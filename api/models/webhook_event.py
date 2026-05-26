import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Boolean, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB

from api.db.session import Base


class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    channel = Column(String(100), nullable=False)
    event_type = Column(String(100), nullable=False)
    raw_payload = Column(JSONB, nullable=False)
    processed = Column(Boolean, default=False)
    complaint_id = Column(UUID(as_uuid=True), nullable=True)
    error_message = Column(Text, nullable=True)
    received_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    processed_at = Column(DateTime(timezone=True), nullable=True)