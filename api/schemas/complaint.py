from pydantic import BaseModel, ConfigDict
from typing import Optional,List
from datetime import datetime
from uuid import UUID

class ComplaintCreate(BaseModel):
    customer_id: str 
    channel: str
    source_ref: Optional[str] = None
    raw_text: str
    regulatory_flag: Optional[bool] = False
    vip_customer: Optional[bool] = False
    priority_tier: Optional[int] = 4
    bot_slots: Optional[dict] = None
    language_code: Optional[str] = None

class ComplaintResponse(BaseModel):
    id: UUID
    status: str
    complaint_type: Optional[str] = None
    type_confidence: Optional[float] = None
    product_code: Optional[str]= None
    intent: Optional[str]= None
    severity_score: Optional[float] = None
    sla_tier: Optional[str] = None
    breach_probability: Optional[float] = None
    sla_deadline: Optional[datetime] = None
    sla_breached: bool = False
    assigned_to: Optional[str] = None
    ai_draft: Optional[str] = None
    cluster_id: Optional[str] = None
    root_cause: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    customer_id: str 
    channel: str
    source_ref: Optional[str] = None
    regulatory_obligation: Optional[str] = None
    raw_text: str
    regulatory_flag: Optional[bool] = False
    vip_customer: Optional[bool] = False
    priority_tier: Optional[int] = 4
    bot_slots: Optional[dict] = None
    language_code: Optional[str] = None
    viral_risk_score: Optional[float] = None
    emotion_arc: Optional[dict] = None
    escalation_reason: Optional[str] = None
    pre_escalate: Optional[bool] = False
    resolution_notes: Optional[str] = None
    updated_at: Optional[datetime] = None
    detected_language: Optional[str] = None
    translated_text: Optional[str] = None
    translation_status: Optional[str] = None
    attachments: Optional[dict] = None
    voice_transcript: Optional[dict] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    account_number: Optional[str] = None
    awaiting_details: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)

class BulkAutoAssignRequest(BaseModel):
    complaint_ids: List[str]
    department: Optional[str] = None

class BulkAutoAssignResponse(BaseModel):
    assigned: int
    failed: int
    assignments: dict[str, Optional[str]]

class ComplaintListResponse(BaseModel):
    complaints: List[ComplaintResponse]
    total: int
    page: int
    limit: int

class StatusUpdate(BaseModel):
    new_status: str

class ComplaintSummary(BaseModel):
    complaint_id: str
    status: str
    complaint_type: Optional[str] = None
    intent: Optional[str] = None
    product_code: Optional[str] = None
    channel: str
    raw_text: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    sla_breached: bool = False
    sla_deadline: Optional[datetime] = None
    regulatory_flag: bool = False
    assigned_to: Optional[str] = None
    ai_draft: Optional[str] = None
    root_cause: Optional[str] = None

class CustomerProfileResponse(BaseModel):
    customer_id: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    account_number: Optional[str] = None
    vip_customer: bool = False
    total_complaints: int = 0
    open_complaints: int = 0
    resolved_complaints: int = 0
    avg_resolution_hours: Optional[float] = None
    sla_breach_count: int = 0
    most_common_issue: Optional[str] = None
    preferred_channel: Optional[str] = None
    viral_risk_score: Optional[float] = None
    regulatory_flagged: bool = False
    repeat_complaint: bool = False
    active_complaints: List[ComplaintSummary] = []
    complaint_history: List[ComplaintSummary] = []