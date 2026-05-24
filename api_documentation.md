# OmniResol — UCCD API Documentation

**Base URL:** `http://localhost:8888/api/v1`  
**Auth:** Bearer JWT — pass `Authorization: Bearer <token>` on all protected routes.  
**WebSocket:** `ws://localhost:8888/api/v1/ws/supervisor`

---

## Table of Contents

### ✅ Implemented Endpoints
| # | Method | Route | Summary |
|:--|:--|:--|:--|
| 1 | `POST` | [`/auth/login`](#post-authlogin) | Issue JWT access token |
| 2 | `POST` | [`/complaints`](#post-complaints) | Ingest a new complaint |
| 3 | `GET` | [`/complaints`](#get-complaints) | List complaints (paginated) |
| 4 | `GET` | [`/complaints/{id}`](#get-complaintsid) | Fetch single complaint detail |
| 5 | `PUT` | [`/complaints/{id}/status`](#put-complaintsidstatus) | Update complaint status |
| 6 | `GET` | [`/complaints/{id}/sla`](#get-complaintsidsla) | Fetch SLA countdown from Redis |
| 7 | `GET` | [`/complaints/{id}/draft`](#get-complaintsiddraft) | Generate AI draft response |
| 8 | `POST` | [`/complaints/{id}/respond`](#post-complaintsidrespond) | Submit final agent response |
| 9 | `GET` | [`/complaints/{id}/history`](#get-complaintsidhistory) | Fetch ticket audit trail |
| 10 | `GET` | [`/complaints/escalations`](#get-complaintsescalations) | List escalated complaints |
| 11 | `GET` | [`/dashboard/kpis`](#get-dashboardkpis) | Aggregate KPI metrics |
| 12 | `GET` | [`/analytics/trends`](#get-analyticstrends) | Volume & trend analytics |
| 13 | `GET` | [`/agents/load`](#get-agentsload) | Agent queue load metrics |
| 14 | `POST` | [`/simulation/run`](#post-simulationrun) | Run operational scenario |
| 15 | `GET` | [`/ai/translate-preview`](#get-aitranslate-preview) | Real-time translation preview |
| 16 | `GET` | [`/ai/draft/{id}`](#get-aidraftid) | AI draft (helper alias) |
| 17 | `WS` | [`/ws/supervisor`](#ws-wssupervisor) | Real-time WebSocket stream |

### 🔜 Not Yet Implemented
| # | Method | Route | Summary |
|:--|:--|:--|:--|
| 18 | `GET` | [`/regulatory/{id}/status`](#get-regulatoryidstatus) | Regulatory countdown timer |
| 19 | `GET` | [`/escalations`](#get-escalations-alias) | Escalations alias route |
| 20 | `GET` | [`/kpis`](#get-kpis-alias) | KPIs alias route |

---

## ✅ Implemented Endpoints

---

### `POST /auth/login`

Verifies credentials for mock roles and issues a signed JWT access token.

**File:** [`api/routes/auth.py#L61`](file:///d:/UCCD/api/routes/auth.py#L61)

**Request Body**

```json
{
  "email": "supervisor@example.com",
  "password": "password"
}
```

| Field | Type | Required | Description |
|:--|:--|:--:|:--|
| `email` | `string` | ✅ | Registered user email |
| `password` | `string` | ✅ | User password |

**Response — `200 OK`**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzdXBlcnZpc29yQGV4YW1wbGUuY29tIiwicm9sZSI6IlNVUEVSVklTT1IiLCJleHAiOjE3NDgwMDAwMDB9.abc123",
  "token_type": "bearer",
  "role": "SUPERVISOR",
  "expires_at": "2026-05-22T20:30:00+00:00"
}
```

**Error — `401 Unauthorized`**

```json
{
  "detail": "Invalid credentials"
}
```

> [!NOTE]
> **Known Mismatch:** The roadmap (Suryansh W2 / Pritesh W2) requires `user_id` and `name` in the response. These fields are not yet returned. See [task backlog](#4-required-backend-tasks).

---

### `POST /complaints`

Ingests a new customer complaint. Creates a database entry, broadcasts a WebSocket alert, and asynchronously triggers the LangGraph classification pipeline.

**File:** [`api/routes/complaints.py#L23`](file:///d:/UCCD/api/routes/complaints.py#L23)  
**Auth:** Required

**Request Body**

```json
{
  "customer_id": "cust-102",
  "channel": "email",
  "raw_text": "I was double charged on my visa card ending in 4242 on May 20th.",
  "language_code": "en",
  "bot_slots": {}
}
```

| Field | Type | Required | Description |
|:--|:--|:--:|:--|
| `customer_id` | `string` | ✅ | Unique customer identifier |
| `channel` | `string` | ✅ | Source channel: `email`, `whatsapp`, `instagram`, `telegram`, `facebook` |
| `raw_text` | `string` | ✅ | Full raw complaint text as received |
| `language_code` | `string` | ✅ | BCP-47 language code, e.g. `en`, `hi` |
| `bot_slots` | `object` | ❌ | Optional pre-extracted NLP slots from bot pre-processing |

**Response — `201 Created`**

```json
{
  "id": "comp-7f3a1b2c",
  "customer_id": "cust-102",
  "channel": "email",
  "raw_text": "I was double charged on my visa card ending in 4242 on May 20th.",
  "language_code": "en",
  "status": "queued",
  "category": null,
  "sub_category": null,
  "severity_score": null,
  "assigned_to": null,
  "department": null,
  "regulatory_flag": false,
  "created_at": "2026-05-22T15:10:00Z",
  "updated_at": "2026-05-22T15:10:00Z"
}
```

---

### `GET /complaints`

Returns a paginated list of complaints. Supports filtering by `status` and `channel`.

**File:** [`api/routes/complaints.py#L76`](file:///d:/UCCD/api/routes/complaints.py#L76)  
**Auth:** Required

**Query Parameters**

| Parameter | Type | Default | Description |
|:--|:--|:--|:--|
| `status` | `string` | — | Filter by status: `queued`, `new`, `in_progress`, `escalated`, `resolved` |
| `channel` | `string` | — | Filter by channel: `email`, `whatsapp`, `telegram`, etc. |
| `page` | `integer` | `1` | Page number |
| `limit` | `integer` | `20` | Results per page (max `100`) |

**Example Request**

```
GET /api/v1/complaints?status=in_progress&channel=email&page=1&limit=5
```

**Response — `200 OK`**

```json
{
  "total": 47,
  "page": 1,
  "limit": 5,
  "complaints": [
    {
      "id": "comp-7f3a1b2c",
      "customer_id": "cust-102",
      "channel": "email",
      "raw_text": "I was double charged on my visa card...",
      "status": "in_progress",
      "category": "billing",
      "sub_category": "double_charge",
      "severity_score": 0.82,
      "assigned_to": "agent@bank.com",
      "department": "Cards",
      "regulatory_flag": false,
      "created_at": "2026-05-22T15:10:00Z",
      "updated_at": "2026-05-22T15:45:00Z"
    }
  ]
}
```

> [!WARNING]
> **Missing Filters (Roadmap Gap):** The following query parameters are expected by the frontend but are **not yet implemented** in the backend:
> - `assigned_to={agent_id}` — filter tickets by assigned agent
> - `tier={HIGH|MEDIUM|NORMAL|REGULATORY}` — filter by SLA tier
> - `regulatory_flag={true|false}` — filter regulatory compliance tickets
> - `search={query}` — full-text search across complaint fields

---

### `GET /complaints/{id}`

Returns the full detail record for a single complaint by its ID.

**File:** [`api/routes/complaints.py#L119`](file:///d:/UCCD/api/routes/complaints.py#L119)  
**Auth:** Required

**Path Parameters**

| Parameter | Type | Description |
|:--|:--|:--|
| `id` | `string` | Complaint UUID (e.g. `comp-7f3a1b2c`) |

**Response — `200 OK`**

```json
{
  "id": "comp-7f3a1b2c",
  "customer_id": "cust-102",
  "channel": "email",
  "raw_text": "I was double charged on my visa card ending in 4242 on May 20th.",
  "language_code": "en",
  "status": "in_progress",
  "category": "billing",
  "sub_category": "double_charge",
  "severity_score": 0.82,
  "breach_probability": 0.34,
  "assigned_to": "agent@bank.com",
  "department": "Cards",
  "regulatory_flag": false,
  "resolution_notes": null,
  "created_at": "2026-05-22T15:10:00Z",
  "updated_at": "2026-05-22T15:45:00Z"
}
```

**Error — `404 Not Found`**

```json
{
  "detail": "Complaint comp-7f3a1b2c not found"
}
```

---

### `PUT /complaints/{id}/status`

Changes the status of a complaint. Validates state transitions before applying the update.

**File:** [`api/routes/complaints.py#L141`](file:///d:/UCCD/api/routes/complaints.py#L141)  
**Auth:** Required

**Path Parameters**

| Parameter | Type | Description |
|:--|:--|:--|
| `id` | `string` | Complaint UUID |

**Request Body**

```json
{
  "new_status": "in_progress"
}
```

**Valid State Transitions**

```
queued      →  new, escalated
new         →  in_progress, escalated
in_progress →  resolved, escalated
```

**Response — `200 OK`**

```json
{
  "id": "comp-7f3a1b2c",
  "previous_status": "new",
  "new_status": "in_progress",
  "updated_at": "2026-05-22T16:00:00Z"
}
```

**Error — `422 Unprocessable Entity`** (Invalid transition)

```json
{
  "detail": "Invalid status transition from 'resolved' to 'queued'"
}
```

---

### `GET /complaints/{id}/sla`

Fetches real-time SLA countdown data from Redis for a specific complaint.

**File:** [`api/routes/complaints.py#L126`](file:///d:/UCCD/api/routes/complaints.py#L126)  
**Auth:** Required

**Path Parameters**

| Parameter | Type | Description |
|:--|:--|:--|
| `id` | `string` | Complaint UUID |

**Response — `200 OK`**

```json
{
  "complaint_id": "comp-7f3a1b2c",
  "time_remaining_seconds": 84200,
  "percentage_elapsed": 2.54,
  "deadline": "2026-05-23T08:30:00Z",
  "tier": "HIGH",
  "sla_breached": false
}
```

| Field | Description |
|:--|:--|
| `time_remaining_seconds` | Seconds left before SLA breach |
| `percentage_elapsed` | % of total SLA window consumed |
| `tier` | `HIGH`, `MEDIUM`, `NORMAL`, or `REGULATORY` |
| `sla_breached` | `true` if deadline has passed |

---

### `GET /complaints/{id}/draft`

Uses Groq (`llama-3.1-8b-instant`) to generate a tone-matched draft response for the agent to review and edit before sending.

**File:** [`api/routes/complaints.py#L166`](file:///d:/UCCD/api/routes/complaints.py#L166)  
**Auth:** Required

**Query Parameters**

| Parameter | Type | Default | Options |
|:--|:--|:--|:--|
| `tone` | `string` | `apologetic` | `apologetic`, `assertive`, `formal`, `empathetic`, `neutral` |

**Example Request**

```
GET /api/v1/complaints/comp-7f3a1b2c/draft?tone=apologetic
```

**Response — `200 OK`**

```json
{
  "complaint_id": "comp-7f3a1b2c",
  "tone": "apologetic",
  "draft": "Dear Valued Customer,\n\nWe sincerely apologize for the inconvenience caused by the duplicate charge on your Visa card ending in 4242. This is not the experience we want for our customers.\n\nWe have initiated an immediate reversal of the excess charge of ₹2,499. The amount will be credited to your account within 2-3 business days.\n\nPlease accept our deepest apologies for this error. We have flagged this incident for a root-cause review to ensure it does not recur.\n\nWarm regards,\nOmniResol Support Team"
}
```

---

### `POST /complaints/{id}/respond`

Submits the agent's final response. Updates complaint status to `resolved`, logs resolution notes, terminates the Redis SLA timer, and triggers closed-loop notifications (e.g. Telegram).

**File:** [`api/routes/complaints.py#L201`](file:///d:/UCCD/api/routes/complaints.py#L201)  
**Auth:** Required

**Request Body**

```json
{
  "response_text": "We have credited back the excess charge of ₹2,499 to your account. The reversal will reflect within 2-3 business days. Apologies for the inconvenience."
}
```

**Response — `200 OK`**

```json
{
  "complaint_id": "comp-7f3a1b2c",
  "status": "resolved",
  "resolved_at": "2026-05-22T16:30:00Z",
  "sla_met": true,
  "notification_sent": true
}
```

---

### `GET /complaints/{id}/history`

Returns the full chronological audit trail for a complaint — every state change, AI action, assignment, and resolution event.

**File:** [`api/routes/history.py#L8`](file:///d:/UCCD/api/routes/history.py#L8)  
**Auth:** Required

**Response — `200 OK`**

```json
{
  "complaint_id": "comp-7f3a1b2c",
  "timeline": [
    {
      "timestamp": "2026-05-22T15:10:00Z",
      "status": "queued",
      "action": "Ticket Ingested",
      "actor": "System / Channel Gateway",
      "description": "Complaint received via email channel and queued for processing."
    },
    {
      "timestamp": "2026-05-22T15:10:03Z",
      "status": "new",
      "action": "AI Classification Complete",
      "actor": "LangGraph Orchestrator",
      "description": "Category: billing / double_charge. Severity: 0.82. Tier: HIGH. Assigned to Cards department."
    },
    {
      "timestamp": "2026-05-22T15:12:00Z",
      "status": "in_progress",
      "action": "Agent Assigned",
      "actor": "agent@bank.com",
      "description": "Ticket picked up by agent for resolution."
    },
    {
      "timestamp": "2026-05-22T16:30:00Z",
      "status": "resolved",
      "action": "Complaint Resolved",
      "actor": "agent@bank.com",
      "description": "Resolution submitted. Reversal initiated. Customer notified via Telegram."
    }
  ]
}
```

---

### `GET /complaints/escalations`

Returns all unresolved complaints that have been escalated or have a breach probability exceeding **70%**.

**File:** [`api/routes/complaints.py#L98`](file:///d:/UCCD/api/routes/complaints.py#L98)  
**Auth:** Required

> [!WARNING]
> **Route Path Mismatch:** The roadmap (Suryansh W3 / Hemant W3) expects this at `GET /api/v1/escalations`. Currently implemented under `/api/v1/complaints/escalations`.

**Response — `200 OK`**

```json
{
  "total": 3,
  "escalations": [
    {
      "id": "comp-a1b2c3",
      "customer_id": "cust-88",
      "channel": "whatsapp",
      "category": "fraud",
      "severity_score": 0.95,
      "breach_probability": 0.87,
      "status": "escalated",
      "tier": "HIGH",
      "assigned_to": "supervisor@bank.com",
      "created_at": "2026-05-22T10:00:00Z"
    }
  ]
}
```

---

### `GET /dashboard/kpis`

Aggregates real-time complaint volume KPIs across all statuses.

**File:** [`api/routes/dashboard.py#L10`](file:///d:/UCCD/api/routes/dashboard.py#L10)  
**Auth:** Required

> [!WARNING]
> **Route Path Mismatch:** The roadmap (Pritesh W3 / Hemant W3) expects this at `GET /api/v1/kpis`. Currently implemented under `/api/v1/dashboard/kpis`.

**Response — `200 OK`**

```json
{
  "total_complaints": 214,
  "queued": 12,
  "in_progress": 45,
  "escalated": 8,
  "resolved_today": 63,
  "sla_breached": 3,
  "avg_resolution_time_minutes": 42.7,
  "sla_compliance_rate": 0.986
}
```

---

### `GET /analytics/trends`

Returns daily volume, category distribution, average severity, and SLA compliance over a time window.

**File:** [`api/routes/analytics.py#L10`](file:///d:/UCCD/api/routes/analytics.py#L10)  
**Auth:** Required

**Query Parameters**

| Parameter | Type | Default | Description |
|:--|:--|:--|:--|
| `window` | `integer` | `7` | Number of days to look back (range: `1–90`) |

> [!WARNING]
> **Parameter Mismatch:** The frontend (Hemant's Volume Chart) passes `?window=12h` and `?window=30d` as strings. The current backend only accepts plain integers (`7`, `30`). Passing `"12h"` will cause a `422 Unprocessable Entity` error.

**Example Request**

```
GET /api/v1/analytics/trends?window=7
```

**Response — `200 OK`**

```json
{
  "window_days": 7,
  "generated_at": "2026-05-22T16:00:00Z",
  "daily_volumes": [
    { "date": "2026-05-16", "count": 28 },
    { "date": "2026-05-17", "count": 34 },
    { "date": "2026-05-18", "count": 19 },
    { "date": "2026-05-19", "count": 41 },
    { "date": "2026-05-20", "count": 55 },
    { "date": "2026-05-21", "count": 48 },
    { "date": "2026-05-22", "count": 22 }
  ],
  "category_distribution": {
    "billing": 0.38,
    "fraud": 0.22,
    "loan": 0.18,
    "technical": 0.14,
    "other": 0.08
  },
  "avg_severity_score": 0.64,
  "sla_compliance_rate": 0.986
}
```

---

### `GET /agents/load`

Returns active queue metrics grouped by department and agent email.

**File:** [`api/routes/agents.py#L9`](file:///d:/UCCD/api/routes/agents.py#L9)  
**Auth:** Required

> [!WARNING]
> **Logic Gap:** Currently calculated using database counts only. The roadmap (Pritesh / Suryansh W4) requires that `cognitive_load` be computed via `compute_agent_load(agent_id)` — pulling from Redis keys `queue:{agent_id}` and `complexity:{agent_id}` including shift fatigue statistics.

**Response — `200 OK`**

```json
{
  "agents": [
    {
      "agent_email": "agent.sharma@bank.com",
      "department": "Cards",
      "active_tickets": 7,
      "escalated_tickets": 1,
      "cognitive_load": 0.73
    },
    {
      "agent_email": "agent.mehta@bank.com",
      "department": "Fraud",
      "active_tickets": 3,
      "escalated_tickets": 0,
      "cognitive_load": 0.41
    }
  ],
  "total_agents_online": 6,
  "avg_load": 0.58
}
```

---

### `POST /simulation/run`

Runs a sandbox scenario to project the operational impact of staffing changes, volume spikes, or policy adjustments.

**File:** [`api/routes/simulation.py#L16`](file:///d:/UCCD/api/routes/simulation.py#L16)  
**Auth:** Required

**Request Body**

```json
{
  "staff_adjustment": 3,
  "volume_spike": 0.50,
  "sla_hours_override": null,
  "policy_mode": "auto_refund"
}
```

| Field | Type | Required | Description |
|:--|:--|:--:|:--|
| `staff_adjustment` | `integer` | ❌ | Net change in available agents (`+3` adds agents, `-2` removes) |
| `volume_spike` | `float` | ❌ | Percentage spike in incoming complaints (`0.50` = +50%) |
| `sla_hours_override` | `integer \| null` | ❌ | Override SLA deadline hours for simulation |
| `policy_mode` | `string` | ❌ | `auto_refund`, `manual_review`, `escalate_all` |

**Response — `200 OK`**

```json
{
  "scenario_id": "sim-20260522-003",
  "inputs": {
    "staff_adjustment": 3,
    "volume_spike": 0.50,
    "sla_hours_override": null,
    "policy_mode": "auto_refund"
  },
  "projections": {
    "predicted_breach_rate": 0.04,
    "estimated_resolution_time_minutes": 31.2,
    "queue_depth_at_peak": 38,
    "sla_compliance_rate": 0.96,
    "cost_per_resolution_estimate_inr": 180.5
  },
  "recommendation": "Adding 3 agents with auto_refund policy reduces breach risk by ~62% under a 50% volume spike scenario."
}
```

---

### `GET /ai/translate-preview`

Provides on-demand translation previews from English to a target customer language. Used for debounced previews while agents type.

**File:** [`api/routes/ai.py#L10`](file:///d:/UCCD/api/routes/ai.py#L10)  
**Auth:** Required

**Query Parameters**

| Parameter | Type | Required | Description |
|:--|:--|:--:|:--|
| `text` | `string` | ✅ | The text string to translate |
| `target_lang` | `string` | ✅ | BCP-47 language code (e.g. `hi-IN`, `ta-IN`, `mr-IN`) |

**Example Request**

```
GET /api/v1/ai/translate-preview?text=We+are+sorry+for+the+inconvenience&target_lang=hi-IN
```

**Response — `200 OK`**

```json
{
  "original": "We are sorry for the inconvenience",
  "translated": "हम असुविधा के लिए क्षमा चाहते हैं",
  "target_lang": "hi-IN",
  "model_used": "llama-3.1-8b-instant"
}
```

---

### `GET /ai/draft/{id}`

Helper alias route. Proxies to `GET /complaints/{id}/draft`. Accepts the same `tone` query parameter.

**File:** [`api/routes/ai.py`](file:///d:/UCCD/api/routes/ai.py)  
**Auth:** Required

> [!NOTE]
> This is a duplicate routing alias. Both `/ai/draft/{id}` and `/complaints/{id}/draft` invoke the same underlying handler.

---

### `WS /ws/supervisor`

Real-time WebSocket connection for supervisor dashboards. Broadcasts live events as they occur.

**File:** [`api/websocket.py#L35`](file:///d:/UCCD/api/websocket.py#L35)

**Connection URL**

```
ws://localhost:8888/api/v1/ws/supervisor
```

**Broadcasted Event Payload Examples**

```json
// New complaint ingested
{
  "event": "complaint.created",
  "payload": {
    "id": "comp-7f3a1b2c",
    "channel": "whatsapp",
    "category": null,
    "status": "queued",
    "created_at": "2026-05-22T15:10:00Z"
  }
}
```

```json
// Status changed
{
  "event": "complaint.status_changed",
  "payload": {
    "id": "comp-7f3a1b2c",
    "previous_status": "new",
    "new_status": "escalated",
    "updated_at": "2026-05-22T15:20:00Z"
  }
}
```

```json
// SLA breach alert
{
  "event": "sla.breach_warning",
  "payload": {
    "id": "comp-a1b2c3",
    "tier": "HIGH",
    "time_remaining_seconds": 300,
    "breach_probability": 0.91
  }
}
```

---
---

## 🔜 Not Yet Implemented Endpoints

> These endpoints are defined in the project roadmaps but **have not been coded yet**. Sample payloads below represent the **expected contract** for frontend/documentation purposes. Cross-referenced from all individual roadmaps (Hemant, Suryansh, Pritesh, Akash, Abhineet).

---

### `GET /regulatory/{id}/status`

Fetches the remaining regulatory countdown timer, percentage elapsed, and deadline for a complaint flagged under regulatory compliance rules. Data is stored and managed in Redis under key `regulatory:{complaint_id}`.

**Defined In:** Suryansh W4 / Pritesh W4 — `services/regulatory_service.py → get_regulatory_status()`  
**Status:** ❌ Not implemented — route does not exist in codebase  
**Required By:** Hemant's Regulatory Dashboard (Screen 5) — `DeadlineCountdown` component

**Expected Request**

```
GET /api/v1/regulatory/comp-a1b2c3/status
Authorization: Bearer <token>
```

**Expected Response — `200 OK`** *(Sample / Mock)*

```json
{
  "complaint_id": "comp-a1b2c3",
  "regulatory_flag": true,
  "regulatory_body": "RBI",
  "regulatory_deadline": "2026-05-29T17:00:00Z",
  "time_remaining_seconds": 593400,
  "percentage_elapsed": 15.8,
  "tier": "REGULATORY",
  "sla_breached": false,
  "escalation_triggered": false
}
```

| Field | Type | Description |
|:--|:--|:--|
| `regulatory_body` | `string` | Governing body: `RBI`, `BANKING_OMBUDSMAN`, `IBA`, `IRDAI`, `SEBI` |
| `regulatory_deadline` | `ISO 8601` | Hard regulatory deadline (cannot be cancelled even if resolved) |
| `time_remaining_seconds` | `integer` | Seconds remaining before regulatory breach |
| `percentage_elapsed` | `float` | % of regulatory window consumed |
| `escalation_triggered` | `boolean` | Whether 80% threshold alert has fired |

**Expected Error — `404 Not Found`**

```json
{ "detail": "No regulatory timer found for complaint comp-a1b2c3" }
```

**Expected Error — `400 Bad Request`**

```json
{ "detail": "Complaint comp-7f3a1b2c is not flagged as regulatory" }
```

---

### `GET /escalations` *(Alias Route)*

Route alias for `GET /complaints/escalations`. Required because Hemant's Supervisor Command Centre (Screen 4) directly calls `/api/v1/escalations`, not the nested path.

**Defined In:** Suryansh W3 / Hemant W3  
**Status:** ❌ Not implemented — alias route does not exist  
**Implementation Note:** Add a FastAPI redirect or duplicate handler pointing to the same service as `/complaints/escalations`.

**Expected Request**

```
GET /api/v1/escalations
Authorization: Bearer <token>
```

**Expected Response — `200 OK`** *(Same schema as `GET /complaints/escalations`)*

```json
{
  "total": 3,
  "escalations": [
    {
      "id": "comp-a1b2c3",
      "customer_id": "cust-88",
      "channel": "whatsapp",
      "category": "fraud",
      "severity_score": 0.95,
      "breach_probability": 0.87,
      "status": "escalated",
      "tier": "HIGH",
      "assigned_to": "supervisor@bank.com",
      "created_at": "2026-05-22T10:00:00Z"
    }
  ]
}
```

---

### `GET /kpis` *(Alias Route)*

Route alias for `GET /dashboard/kpis`. Required because Hemant's KPI Bar (Screen 4) calls `/api/v1/kpis` directly.

**Defined In:** Pritesh W3 / Hemant W3  
**Status:** ❌ Not implemented — alias route does not exist  
**Implementation Note:** Add FastAPI redirect or duplicate handler pointing to the same service as `/dashboard/kpis`.

**Expected Request**

```
GET /api/v1/kpis
Authorization: Bearer <token>
```

**Expected Response — `200 OK`** *(Same schema as `GET /dashboard/kpis`)*

```json
{
  "total_complaints": 214,
  "queued": 12,
  "in_progress": 45,
  "escalated": 8,
  "resolved_today": 63,
  "sla_breached": 3,
  "avg_resolution_time_minutes": 42.7,
  "sla_compliance_rate": 0.986
}
```

---

### Missing Query Parameters on `GET /complaints`

The following **four query filters** are referenced across Hemant's frontend roadmap but are **not implemented** in the current backend. They are listed here as documentation of the expected behavior, not as separate endpoints.

#### `?assigned_to={agent_id}`

**Defined In:** Hemant W2 — My Queue screen (Screen 2)  
**Status:** ❌ Missing parameter  
**Used For:** `GET /api/v1/complaints?status=open&assigned_to=agent.sharma@bank.com`

```json
// Expected to filter: returns only complaints assigned to the specified agent
{
  "total": 7,
  "page": 1,
  "limit": 50,
  "complaints": [ /* only agent.sharma's tickets */ ]
}
```

#### `?regulatory_flag=true`

**Defined In:** Hemant W4 — Regulatory Dashboard (Screen 5)  
**Status:** ❌ Missing parameter  
**Used For:** `GET /api/v1/complaints?regulatory_flag=true&status=open`

```json
// Expected to filter: returns only complaints where regulatory_flag = true
{
  "total": 4,
  "page": 1,
  "limit": 20,
  "complaints": [ /* only regulatory complaints */ ]
}
```

#### `?tier={HIGH|MEDIUM|NORMAL|REGULATORY}`

**Defined In:** Suryansh W3  
**Status:** ❌ Missing parameter  
**Used For:** `GET /api/v1/complaints?tier=HIGH&status=open`

```json
// Expected to filter: returns only HIGH tier SLA complaints
{
  "total": 15,
  "page": 1,
  "limit": 20,
  "complaints": [ /* only HIGH tier tickets */ ]
}
```

#### `?search={query}&type={y}`

**Defined In:** Hemant W6 — Complaint Search screen (Screen 8)  
**Status:** ❌ Missing parameter (backend has no text search logic)  
**Used For:** `GET /api/v1/complaints?search=double+charge&status=in_progress&type=billing`

```json
// Expected to return: full-text search results across raw_text and customer fields
{
  "total": 3,
  "page": 1,
  "limit": 20,
  "complaints": [
    {
      "id": "comp-7f3a1b2c",
      "raw_text": "I was double charged on my visa card...",
      "category": "billing",
      "status": "in_progress"
    }
  ]
}
```

---

### Auth Response — Missing `user_id` and `name` fields

`POST /auth/login` currently returns `{access_token, token_type, role, expires_at}`.

**Defined In:** Suryansh W2 / Pritesh W2  
**Status:** ❌ Response schema mismatch — `user_id` and `name` are missing  
**Required By:** Hemant's frontend stores these in `AuthContext` for display in the sidebar.

**Expected Full Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "role": "SUPERVISOR",
  "user_id": "usr-00421",
  "name": "Abhineet Sharma",
  "expires_at": "2026-05-22T21:30:00+00:00"
}
```

---

### `GET /analytics/trends` — String Window Format

`GET /analytics/trends` currently only accepts an `integer` for the `window` parameter.

**Defined In:** Hemant W3 (Volume Chart) and Hemant W4 (Insights Screen)  
**Status:** ❌ Parameter type mismatch — string formats crash the backend  
**Used As:**
- `?window=12h` → hourly grouping over last 12 hours (Supervisor dashboard Volume Chart)
- `?window=30d` → daily grouping over last 30 days (Insights Trend Dashboard)

**Expected Response for `?window=12h`** *(hourly granularity)*

```json
{
  "window": "12h",
  "granularity": "hourly",
  "generated_at": "2026-05-22T16:00:00Z",
  "data_points": [
    { "label": "04:00", "count": 5 },
    { "label": "05:00", "count": 8 },
    { "label": "06:00", "count": 14 },
    { "label": "07:00", "count": 22 },
    { "label": "08:00", "count": 31 }
  ],
  "category_distribution": {
    "billing": 0.38,
    "fraud": 0.22,
    "loan": 0.18
  },
  "avg_severity_score": 0.64,
  "sla_compliance_rate": 0.986
}
```

**Expected Response for `?window=30d`** *(daily granularity, grouped by complaint type)*

```json
{
  "window": "30d",
  "granularity": "daily",
  "generated_at": "2026-05-22T16:00:00Z",
  "daily_volumes": [
    { "date": "2026-04-23", "type": "billing", "count": 28 },
    { "date": "2026-04-23", "type": "fraud", "count": 12 },
    { "date": "2026-04-24", "type": "billing", "count": 34 }
  ],
  "category_distribution": {
    "billing": 0.38,
    "fraud": 0.22,
    "loan": 0.18,
    "technical": 0.14,
    "other": 0.08
  },
  "avg_severity_score": 0.61,
  "sla_compliance_rate": 0.984
}
```

---

### `GET /agents/load` — Redis-backed Logic Gap

This route **exists** but its internal logic is incomplete. Currently uses raw DB counts. The roadmap requires Redis-computed cognitive load scores.

**Defined In:** Suryansh W4 / Pritesh W4 — `compute_agent_load(agent_id)`  
**Status:** ⚠️ Route exists but uses wrong data source (DB counts vs Redis)

**Expected Redis keys consumed per agent:**

| Redis Key | Description |
|:--|:--|
| `queue:{agent_id}` | List of active complaint IDs |
| `complexity:{agent_id}` | Rolling complexity average (float) |
| `login:{agent_id}` | Login timestamp for shift fatigue calculation |

**Expected Correct Response:**

```json
{
  "agents": [
    {
      "agent_email": "agent.sharma@bank.com",
      "department": "Cards",
      "active_tickets": 7,
      "escalated_tickets": 1,
      "cognitive_load": 0.73,
      "load_breakdown": {
        "queue_score": 0.35,
        "complexity_score": 0.28,
        "shift_fatigue_score": 0.10
      }
    }
  ],
  "total_agents_online": 6,
  "avg_load": 0.58
}
```

---

### `GET /regulatory/{id}/status`

Fetches the remaining regulatory countdown timer, percentage elapsed, and deadline for a complaint flagged under regulatory compliance rules. The data is stored and managed in Redis.

**Defined In:** Suryansh Week 4 Roadmap  
**Status:** ❌ Not implemented — route does not exist in codebase

**Path Parameters**

| Parameter | Type | Description |
|:--|:--|:--|
| `id` | `string` | Complaint UUID |

**Expected Request**

```
GET /api/v1/regulatory/comp-a1b2c3/status
Authorization: Bearer <token>
```

**Expected Response — `200 OK`** *(Sample / Mock)*

```json
{
  "complaint_id": "comp-a1b2c3",
  "regulatory_flag": true,
  "regulatory_body": "RBI",
  "regulatory_deadline": "2026-05-29T17:00:00Z",
  "time_remaining_seconds": 593400,
  "percentage_elapsed": 15.8,
  "tier": "REGULATORY",
  "sla_breached": false,
  "escalation_triggered": false
}
```

| Field | Type | Description |
|:--|:--|:--|
| `regulatory_body` | `string` | Governing body (e.g. `RBI`, `SEBI`, `IRDAI`) |
| `regulatory_deadline` | `ISO 8601` | Hard regulatory deadline |
| `time_remaining_seconds` | `integer` | Seconds remaining before regulatory breach |
| `percentage_elapsed` | `float` | % of regulatory window consumed |
| `escalation_triggered` | `boolean` | Whether automatic escalation has been triggered |

**Expected Error — `404 Not Found`**

```json
{
  "detail": "No regulatory timer found for complaint comp-a1b2c3"
}
```

**Expected Error — `400 Bad Request`**

```json
{
  "detail": "Complaint comp-7f3a1b2c is not flagged as regulatory"
}
```

---

### `GET /escalations` *(Alias)*

A route alias for `GET /complaints/escalations`. Required because Hemant's frontend (Suryansh W3 / Hemant W3) calls `/api/v1/escalations` directly.

**Defined In:** Suryansh W3 / Hemant W3 Roadmap  
**Status:** ❌ Not implemented — alias route does not exist

> [!NOTE]
> **Implementation Note:** This can be a simple FastAPI redirect or a duplicate handler pointing to the same service function as `GET /complaints/escalations`.

**Expected Request**

```
GET /api/v1/escalations
Authorization: Bearer <token>
```

**Expected Response — `200 OK`** *(Same schema as `/complaints/escalations`)*

```json
{
  "total": 3,
  "escalations": [
    {
      "id": "comp-a1b2c3",
      "customer_id": "cust-88",
      "channel": "whatsapp",
      "category": "fraud",
      "severity_score": 0.95,
      "breach_probability": 0.87,
      "status": "escalated",
      "tier": "HIGH",
      "assigned_to": "supervisor@bank.com",
      "created_at": "2026-05-22T10:00:00Z"
    },
    {
      "id": "comp-d4e5f6",
      "customer_id": "cust-201",
      "channel": "telegram",
      "category": "loan",
      "severity_score": 0.79,
      "breach_probability": 0.72,
      "status": "in_progress",
      "tier": "REGULATORY",
      "assigned_to": "agent.kapoor@bank.com",
      "created_at": "2026-05-22T09:15:00Z"
    }
  ]
}
```

---

### `GET /kpis` *(Alias)*

A route alias for `GET /dashboard/kpis`. Required because Pritesh and Hemant's frontend calls `/api/v1/kpis` directly.

**Defined In:** Pritesh W3 / Hemant W3 Roadmap  
**Status:** ❌ Not implemented — alias route does not exist

> [!NOTE]
> **Implementation Note:** This can be a simple FastAPI redirect or a duplicate handler pointing to the same service function as `GET /dashboard/kpis`.

**Expected Request**

```
GET /api/v1/kpis
Authorization: Bearer <token>
```

**Expected Response — `200 OK`** *(Same schema as `/dashboard/kpis`)*

```json
{
  "total_complaints": 214,
  "queued": 12,
  "in_progress": 45,
  "escalated": 8,
  "resolved_today": 63,
  "sla_breached": 3,
  "avg_resolution_time_minutes": 42.7,
  "sla_compliance_rate": 0.986
}
```

---

## Shared Schemas

### `ComplaintResponse` Object

```json
{
  "id": "comp-7f3a1b2c",
  "customer_id": "cust-102",
  "channel": "email",
  "raw_text": "I was double charged...",
  "language_code": "en",
  "status": "in_progress",
  "category": "billing",
  "sub_category": "double_charge",
  "severity_score": 0.82,
  "breach_probability": 0.34,
  "assigned_to": "agent@bank.com",
  "department": "Cards",
  "regulatory_flag": false,
  "resolution_notes": null,
  "created_at": "2026-05-22T15:10:00Z",
  "updated_at": "2026-05-22T15:45:00Z"
}
```

### Status Enum

| Value | Meaning |
|:--|:--|
| `queued` | Received, awaiting AI processing |
| `new` | AI classified, awaiting agent pick-up |
| `in_progress` | Agent actively working |
| `escalated` | Escalated to supervisor |
| `resolved` | Closed with response |

### SLA Tier Enum

| Tier | SLA Window |
|:--|:--|
| `NORMAL` | 72 hours |
| `MEDIUM` | 48 hours |
| `HIGH` | 24 hours |
| `REGULATORY` | 7 days (hard regulatory deadline) |

---

## Error Reference

| HTTP Status | Meaning |
|:--|:--|
| `200 OK` | Request successful |
| `201 Created` | Resource created |
| `400 Bad Request` | Invalid input or business rule violation |
| `401 Unauthorized` | Missing or invalid token |
| `403 Forbidden` | Insufficient role permissions |
| `404 Not Found` | Resource does not exist |
| `422 Unprocessable Entity` | Schema validation failure |
| `500 Internal Server Error` | Unexpected server error |
