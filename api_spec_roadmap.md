# UCCD API Specification: Current Implementation vs. Roadmaps

This document serves as the single source of truth for the API endpoints of the **Unified Customer Complaint Communication Dashboard (UCCD)**. It compares the current backend implementation (FastAPI) against the requirements specified in the developer roadmaps (`Roadmaps/` folder).

---

## 1. Quick Comparison Matrix

The table below summarizes the alignment status of all endpoints. 

| HTTP Method | API Route Path | Status in Code | Expected in Roadmap | Alignment / Gap Notes |
|:---|:---|:---:|:---:|:---|
| **GET** | `/api/health` | `[x]` | `[ ]` | Internal health check route. |
| **POST** | `/api/v1/auth/login` | `[x]` | `[x]` | **Mismatch**: Current returns `{access_token, role, expires_at}`. Roadmap requests `user_id` and `name` as well. |
| **POST** | `/api/v1/complaints` | `[x]` | `[x]` | Aligned. Starts the async LangGraph classification pipeline. |
| **GET** | `/api/v1/complaints` | `[x]` | `[x]` | **Mismatch**: Lacks roadmap-required query filters `tier`, `assigned_to`, `regulatory_flag`, and `search`. |
| **GET** | `/api/v1/complaints/{id}` | `[x]` | `[x]` | Aligned. Fetches detailed complaint record. |
| **PUT** | `/api/v1/complaints/{id}/status` | `[x]` | `[x]` | Aligned. Performs state transition validation. |
| **GET** | `/api/v1/complaints/{id}/sla` | `[x]` | `[x]` | Aligned. Fetches Redis SLA remaining countdown. |
| **GET** | `/api/v1/complaints/{id}/draft` | `[x]` | `[x]` | Aligned. Generates LLM draft response using Groq. |
| **POST** | `/api/v1/complaints/{id}/respond` | `[x]` | `[x]` | Aligned. Resolves the complaint and sends closed-loop notifications. |
| **GET** | `/api/v1/complaints/{id}/history` | `[x]` | `[x]` | Aligned. Returns audit event log history trail. |
| **GET** | `/api/v1/complaints/escalations` | `[x]` | `[x]` | **Route Path Mismatch**: Implemented under `/api/v1/complaints/escalations`, but the roadmap requests `/api/v1/escalations`. |
| **GET** | `/api/v1/dashboard/kpis` | `[x]` | `[x]` | **Route Path Mismatch**: Implemented under `/api/v1/dashboard/kpis`, but the roadmap requests `/api/v1/kpis`. |
| **GET** | `/api/v1/agents/load` | `[x]` | `[x]` | **Logic Gap**: Implemented using basic database counts; roadmap expects query to fetch actual cognitive load values from Redis. |
| **GET** | `/api/v1/analytics/trends` | `[x]` | `[x]` | **Parameter Mismatch**: Implementation only accepts integer day windows; roadmap specifies strings like `12h` or `30d`. |
| **POST** | `/api/v1/simulation/run` | `[x]` | `[x]` | Aligned. Returns projected operational impact analysis. |
| **GET** | `/api/v1/ai/translate-preview` | `[x]` | `[x]` | Aligned. Debounced translation preview for agents. |
| **GET** | `/api/v1/ai/draft/{id}` | `[x]` | `[x]` | Aligned. Duplicate helper routing pointing to `/complaints/{id}/draft`. |
| **GET** | `/api/v1/regulatory/{id}/status` | `[ ]` | `[x]` | **Missing Route**: Suryansh Week 4 specifies an endpoint to retrieve the regulatory Redis timer status. |
| **WS** | `/api/v1/ws/supervisor` | `[x]` | `[x]` | Aligned. WebSocket connection for real-time dashboard events. |

---

## 2. Endpoint Catalog & Details

### Authentication Route

#### `POST /api/v1/auth/login`
* **File Location**: [auth.py](file:///d:/UCCD/api/routes/auth.py#L61)
* **Description**: Verifies credentials for mock roles and issues JWT access tokens.
* **Request Body**:
  ```json
  {
    "email": "supervisor@example.com",
    "password": "password"
  }
  ```
* **Current Response**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "role": "SUPERVISOR",
    "expires_at": "2026-05-22T20:30:00+00:00"
  }
  ```
* **Roadmap Discrepancy**: Suryansh W2 / Pritesh W2 roadmaps specify that the return payload should also include `user_id` and `name`.

---

### Complaint Routes

#### `POST /api/v1/complaints`
* **File Location**: [complaints.py](file:///d:/UCCD/api/routes/complaints.py#L23)
* **Description**: Ingests a new complaint, creates a database entry, broadcasts a WebSocket alert, and asynchronously invokes the LangGraph orchestrator.
* **Request Body**:
  ```json
  {
    "customer_id": "cust-102",
    "channel": "email",
    "raw_text": "I was double charged on my visa card...",
    "language_code": "en",
    "bot_slots": {}
  }
  ```
* **Response**: A full `ComplaintResponse` object with `id`, `status` (`"queued"`), `created_at`, and empty classification fields.

#### `GET /api/v1/complaints`
* **File Location**: [complaints.py](file:///d:/UCCD/api/routes/complaints.py#L76)
* **Description**: Paginated query list of complaints.
* **Query Parameters**:
  * `status`: (Optional) string filter
  * `channel`: (Optional) string filter
  * `page`: integer (Default: `1`)
  * `limit`: integer (Default: `20`)
* **Response**:
  ```json
  {
    "total": 12,
    "page": 1,
    "limit": 20,
    "complaints": [...]
  }
  ```
* **Roadmap Discrepancy**: 
  1. Hemant's frontend roadmap queries `GET /api/v1/complaints?status=open&assigned_to={agent_id}` to populate agent queues. No `assigned_to` parameter exists in the codebase.
  2. Suryansh's roadmap requires a `tier` filter (SLA tier).
  3. Hemant's Week 4 roadmap queries `GET /api/v1/complaints?regulatory_flag=true&status=open` to show regulatory dashboards.
  4. Hemant's Week 6 search query uses `GET /api/v1/complaints?search={query}&status={x}&type={y}` to perform text searches, but the backend doesn't support text searches.

#### `GET /api/v1/complaints/{complaint_id}`
* **File Location**: [complaints.py](file:///d:/UCCD/api/routes/complaints.py#L119)
* **Description**: Returns all columns of a specific complaint by ID.
* **Response**: Full `ComplaintResponse` schema object.

#### `PUT /api/v1/complaints/{complaint_id}/status`
* **File Location**: [complaints.py](file:///d:/UCCD/api/routes/complaints.py#L141)
* **Description**: Changes the status of a complaint, validating the state changes.
* **Request Body**:
  ```json
  {
    "new_status": "in_progress"
  }
  ```
* **State Transition Rules**: 
  * `queued` -> `new`, `escalated`
  * `new` -> `in_progress`, `escalated`
  * `in_progress` -> `resolved`, `escalated`

#### `GET /api/v1/complaints/{complaint_id}/sla`
* **File Location**: [complaints.py](file:///d:/UCCD/api/routes/complaints.py#L126)
* **Description**: Connects to Redis to retrieve remaining seconds, SLA compliance status, and deadlines.
* **Response**:
  ```json
  {
    "time_remaining_seconds": 84200,
    "percentage_elapsed": 2.54,
    "deadline": "2026-05-23T08:30:00Z",
    "tier": "HIGH"
  }
  ```

#### `GET /api/v1/complaints/{complaint_id}/draft`
* **File Location**: [complaints.py](file:///d:/UCCD/api/routes/complaints.py#L166)
* **Description**: Leverages Groq (`llama-3.1-8b-instant`) to create a tone-matched response draft for the agent to review and edit.
* **Query Parameters**:
  * `tone`: string (default: `"apologetic"`; options: `"assertive"`, `"formal"`, etc.)
* **Response**:
  ```json
  {
    "complaint_id": "...",
    "tone": "apologetic",
    "draft": "Dear Customer, we sincerely apologize for the dual charge on your card..."
  }
  ```

#### `POST /api/v1/complaints/{complaint_id}/respond`
* **File Location**: [complaints.py](file:///d:/UCCD/api/routes/complaints.py#L201)
* **Description**: Agent submits the final reply. The system updates the status to `"resolved"`, logs resolution notes, terminates the Redis SLA timer, and triggers closed-loop communications (such as sending a Telegram notification if applicable).
* **Request Body**:
  ```json
  {
    "response_text": "We have credited back the excess charges to your account..."
  }
  ```

#### `GET /api/v1/complaints/{complaint_id}/history`
* **File Location**: [history.py](file:///d:/UCCD/api/routes/history.py#L8)
* **Description**: Returns chronological events for a ticket's audit trail (e.g., received, categorized by AI, assigned, escalated, and resolved).
* **Response**:
  ```json
  {
    "complaint_id": "...",
    "timeline": [
      {
        "timestamp": "2026-05-22T08:30:00Z",
        "status": "queued",
        "action": "Ticket Ingested",
        "actor": "System / Channel Gateway",
        "description": "Complaint successfully received..."
      },
      ...
    ]
  }
  ```

---

### Dashboard & Analytics Routes

#### `GET /api/v1/complaints/escalations`
* **File Location**: [complaints.py](file:///d:/UCCD/api/routes/complaints.py#L98)
* **Description**: Fetches all unresolved complaints that have been escalated or have a breach probability exceeding 70%.
* **Roadmap Discrepancy**: The frontend expects this route at `GET /api/v1/escalations` (Suryansh W3 / Hemant W3).

#### `GET /api/v1/dashboard/kpis`
* **File Location**: [dashboard.py](file:///d:/UCCD/api/routes/dashboard.py#L10)
* **Description**: Aggregates complaint volumes (total, queued, in progress, escalated, breached).
* **Roadmap Discrepancy**: The frontend expects this route at `GET /api/v1/kpis` (Pritesh W3 / Hemant W3).

#### `GET /api/v1/analytics/trends`
* **File Location**: [analytics.py](file:///d:/UCCD/api/routes/analytics.py#L10)
* **Description**: Calculates daily volumes, category distribution, average severity score, and SLA compliance percentages over a timeframe window.
* **Query Parameters**:
  * `window`: integer number of days (currently defaults to `7`, constrained between `1` and `90`)
* **Roadmap Discrepancy**: 
  * Hemant's Volume Chart requires a `window=12h` query parameter to display the hourly trend over the last 12 hours.
  * Hemant's Insights Screen requests `window=30d`.
  * Passing a string like `"12h"` or `"30d"` crashes the current implementation because it is strongly typed to expect an integer `window: int`.

---

### Agent & Simulation Routes

#### `GET /api/v1/agents/load`
* **File Location**: [agents.py](file:///d:/UCCD/api/routes/agents.py#L9)
* **Description**: Returns active queue metrics grouped by department and agent email.
* **Roadmap Discrepancy**: 
  * Currently calculated purely using database counts.
  * Pritesh/Suryansh's Week 4 roadmap specifies that this route must return values processed via `compute_agent_load(agent_id)`, which utilizes Redis memory lists (`queue:{agent_id}`, `complexity:{agent_id}`, and shift fatigue statistics).

#### `POST /api/v1/simulation/run`
* **File Location**: [simulation.py](file:///d:/UCCD/api/routes/simulation.py#L16)
* **Description**: Runs sandbox scenarios (e.g. projecting the outcome of adding agents, adjusting volume, or altering policies like auto-refunds).
* **Request Body**:
  ```json
  {
    "staff_adjustment": 3,
    "volume_spike": 0.50,
    "sla_hours_override": null,
    "policy_mode": "auto_refund"
  }
  ```

---

### AI translation & Helper Routes

#### `GET /api/v1/ai/translate-preview`
* **File Location**: [ai.py](file:///d:/UCCD/api/routes/ai.py#L10)
* **Description**: Provides translation previews from English to customer languages on demand.
* **Query Parameters**:
  * `text`: The text string to translate.
  * `target_lang`: The language code to translate into (e.g., `hi-IN`).

---

### WebSocket Routes

#### `WS /api/v1/ws/supervisor`
* **File Location**: [websocket.py](file:///d:/UCCD/api/websocket.py#L35)
* **Description**: Connects client supervisors to real-time event broadcasts (such as ticket creation, status changes, and SLA alerts).

---

## 3. Discrepancy & Gap Analysis

Based on the roadmaps, here are the critical gaps that need to be addressed:

> [!WARNING]
> ### 1. Query Parameter Types & Naming Mismatches
> * **Analytics Trends Window**: `GET /api/v1/analytics/trends` expects an integer but is queried by Hemant's dashboard with strings like `?window=12h` and `?window=30d`. The backend must parse these units (e.g., `h` for hours, `d` for days) and group records accordingly (hourly vs. daily).
> * **Route Aliasing**:
>   * Expected `/api/v1/kpis` but implemented as `/api/v1/dashboard/kpis`.
>   * Expected `/api/v1/escalations` but implemented as `/api/v1/complaints/escalations`.

> [!IMPORTANT]
> ### 2. Missing Query Filters on `GET /api/v1/complaints`
> The frontend requires these parameters for queue filtering, which are missing from the backend schema:
> * `assigned_to={agent_id}`: Filter tickets assigned to a specific agent.
> * `regulatory_flag={true|false}`: Filter regulatory compliance tickets.
> * `tier={HIGH|MEDIUM|NORMAL|REGULATORY}`: Filter by SLA tier.
> * `search={query}`: Search through customer text fields.

> [!IMPORTANT]
> ### 3. Real Redis Integration for Agent Load
> * `GET /api/v1/agents/load` currently bypasses Redis. It should fetch queue data from Redis (`queue:{agent_id}`) and compute agent load using Pritesh's formula instead of simple SQL aggregations.

> [!NOTE]
> ### 4. Missing Endpoints
> * **Regulatory Timer Status**: `GET /api/v1/regulatory/{complaint_id}/status` needs to be implemented to fetch remaining regulatory countdown times.

---

## 4. Required Backend Tasks to Align with Roadmaps

To fully align the code with the roadmaps, developers should complete the following actions:

- [ ] **Auth Route**: Update the return model of `POST /api/v1/auth/login` to include `user_id` and `name`.
- [ ] **Complaints Route filters**: Add `assigned_to`, `tier`, `regulatory_flag`, and `search` query parameters to `GET /api/v1/complaints`. Add textual search logic (ILIKE or pgvector semantic search) for the `search` param.
- [ ] **Route Redirects/Aliasing**:
  - Add `/api/v1/kpis` that routes to `/api/v1/dashboard/kpis` (or keep both).
  - Add `/api/v1/escalations` that routes to `/api/v1/complaints/escalations`.
- [ ] **Analytics Trends Parsing**: Modify the `window` parameter in `GET /api/v1/analytics/trends` to accept strings. Write a utility function to parse intervals (`12h` -> 12 hours hourly grouping, `30d` -> 30 days daily grouping).
- [ ] **Agent Load Redis logic**: Connect `GET /api/v1/agents/load` to the Redis-backed load calculator services rather than the PostgreSQL database metrics.
- [ ] **Regulatory Status**: Implement `GET /api/v1/regulatory/{complaint_id}/status` fetching remaining regulatory seconds, percentage, and deadlines from Redis.
