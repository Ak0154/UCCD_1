-- Bootstrap schema for first-time database initialization.
-- When setting up Alembic (TSK-1.3), generate the initial migration from these
-- existing tables and stamp the revision as applied:
--   alembic revision --autogenerate -m "initial"
--   alembic stamp head
-- Future schema changes should be managed exclusively through Alembic migrations.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('AGENT', 'SUPERVISOR')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(255) NOT NULL,
    channel VARCHAR(100) NOT NULL,
    source_ref VARCHAR(255),
    raw_text TEXT NOT NULL,
    language_code VARCHAR(10),
    voice_transcript JSONB,
    attachments JSONB,
    bot_slots JSONB,
    complaint_type VARCHAR(100),
    type_confidence FLOAT,
    product_code VARCHAR(50),
    intent VARCHAR(255),
    regulatory_obligation VARCHAR(100),
    severity_score FLOAT,
    sla_tier VARCHAR(50),
    emotion_arc JSONB,
    cluster_id VARCHAR(100),
    breach_probability FLOAT,
    ai_draft TEXT,
    root_cause VARCHAR(255),
    embedding vector(1536),
    regulatory_flag BOOLEAN NOT NULL DEFAULT false,
    vip_customer BOOLEAN NOT NULL DEFAULT false,
    viral_risk_score FLOAT,
    priority_tier INTEGER NOT NULL DEFAULT 4,
    sla_deadline TIMESTAMPTZ,
    sla_breached BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(50) NOT NULL DEFAULT 'queued',
    assigned_to VARCHAR(255),
    resolution_notes TEXT,
    pre_escalate BOOLEAN DEFAULT false,
    escalation_reason VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_complaints_customer_id ON complaints(customer_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);

CREATE INDEX IF NOT EXISTS idx_complaints_embedding_hnsw
    ON complaints
    USING hnsw (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS outbound_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID REFERENCES complaints(id) ON DELETE SET NULL,
    channel VARCHAR(100) NOT NULL,
    source_ref VARCHAR(255),
    message_text TEXT NOT NULL,
    direction VARCHAR(20) DEFAULT 'outbound',
    status VARCHAR(20) DEFAULT 'pending',
    provider_message_id VARCHAR(512),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_outbound_complaint ON outbound_messages(complaint_id);
CREATE INDEX IF NOT EXISTS idx_outbound_channel ON outbound_messages(channel);

CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    raw_payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    complaint_id UUID,
    error_message TEXT,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_webhook_channel ON webhook_events(channel);