from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ChannelStatus(BaseModel):
    name: str
    display_name: str
    enabled: bool
    supports_inbound: bool
    supports_outbound: bool
    inbound_method: str


class ChannelStatusList(BaseModel):
    channels: List[ChannelStatus]


class OutboundMessageResponse(BaseModel):
    id: str
    complaint_id: Optional[str] = None
    channel: str
    source_ref: Optional[str] = None
    message_text: str
    direction: str
    status: str
    provider_message_id: Optional[str] = None
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    error_message: Optional[str] = None
    msg_metadata: Optional[dict] = None

    class Config:
        from_attributes = True