export type UserRole = 'AGENT' | 'SUPERVISOR' | 'COMPLIANCE'

export interface LoginResponse {
  access_token: string
  token_type: string
  role: UserRole
  user_id: string
  name: string
  expires_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface Complaint {
  id: string
  status: string
  complaint_type?: string | null
  type_confidence?: number | null
  product_code?: string | null
  intent?: string | null
  severity_score?: number | null
  sla_tier?: string | null
  breach_probability?: number | null
  sla_deadline?: string | null
  sla_breached: boolean
  assigned_to?: string | null
  ai_draft?: string | null
  cluster_id?: string | null
  root_cause?: string | null
  created_at: string
  updated_at?: string | null
  resolved_at?: string | null
  customer_id: string
  channel: string
  source_ref?: string | null
  regulatory_obligation?: string | null
  raw_text: string
  regulatory_flag?: boolean
  vip_customer?: boolean
  priority_tier?: number
  bot_slots?: Record<string, unknown> | null
  language_code?: string | null
  detected_language?: string | null
  translated_text?: string | null
  translation_status?: string | null
  viral_risk_score?: number | null
  emotion_arc?: Record<string, unknown> | null
  escalation_reason?: string | null
  pre_escalate?: boolean
  resolution_notes?: string | null
  customer_name?: string | null
  customer_email?: string | null
  customer_phone?: string | null
  account_number?: string | null
  awaiting_details?: boolean
}

export interface ComplaintListResponse {
  complaints: Complaint[]
  total: number
  page: number
  limit: number
}

export interface ComplaintFilters {
  status?: string
  channel?: string
  assigned_to?: string
  regulatory_flag?: boolean
  priority_tier?: number
  sla_tier?: string
  search?: string
  page?: number
  limit?: number
}

export interface DashboardKpis {
  total: number
  open: number
  queued: number
  in_progress: number
  escalated: number
  breached: number
}

export interface AgentLoad {
  status: string
  total_active_load: number
  departments: Record<string, number>
  agents: Record<string, number>
}

export interface TrendPoint {
  date: string
  count: number
}

export interface TrendsResponse {
  window: string
  granularity: string
  daily_volume: TrendPoint[]
  category_distribution: Record<string, number>
  average_severity: number
  sla_compliance: {
    met: number
    breached: number
    compliance_rate: number
  }
}

export interface DraftResponse {
  complaint_id: string
  tone: string
  draft: string
}

export interface HistoryEvent {
  timestamp: string
  status: string
  action: string
  actor: string
  description: string
}

export interface ComplaintHistoryResponse {
  complaint_id: string
  timeline: HistoryEvent[]
}

export interface WebSocketEvent {
  type: string
  ts?: string
  complaint_id?: string
  [key: string]: unknown
}
