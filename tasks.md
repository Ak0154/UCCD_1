# UCCD Remaining Task List

This task list is rebuilt from `Roadmaps/PROGRESS.md`.

Legend:
- `[x]` completed and no longer an active task
- `[~]` partially implemented and needs follow-up
- `[ ]` not implemented

Status note: Module 1 infrastructure, Neon DB setup, Alembic, schema, Makefile, `.env.example`, Docker API/Redis/Kafka services, and the base FastAPI/agent project structure are treated as complete. The tasks below focus on the remaining roadmap gaps only.

---

## Module 1: Infrastructure, Database & Dev Setup

### Status

- [x] Docker Compose includes API, Redis, Kafka, and Zookeeper.
- [x] PostgreSQL is intentionally external through Neon DB using `POSTGRES_URL`.
- [x] `db/schema.sql` exists with `users`, `complaints`, vector extension, and vector index.
- [x] Alembic is configured with existing migrations.
- [x] `Makefile` exists with development commands.
- [x] `.env.example` includes Postgres/Neon, Redis, Kafka, JWT, Groq, Telegram, demo user, and Sarvam variables.

### No Active Module 1 Tasks

Do not add a local PostgreSQL container unless the project direction changes. Neon DB is the intended database target.

---

## Module 2: Authentication & RBAC

### TSK-2.1: Central Settings Module

**Status**: `[x]`

**Goal**: Add a central typed configuration module for environment variables.

**Expected input**:
- `api/db/session.py`
- `api/routes/auth.py`
- `.env.example`
- Current environment variable usage across `api/`, `services/`, and `agents/`

**Expected output**:
- New `api/config.py` or equivalent settings module using Pydantic settings.
- Existing modules read config from one place instead of scattered `os.getenv` calls where practical.
- Neon DB, Redis, Kafka, JWT, Groq, Sarvam, Telegram, and API host settings represented.

### TSK-2.2: DB-Backed Login

**Status**: `[x]`

**Goal**: Replace env-only demo login with DB-backed users.

**Expected input**:
- `api/models/user.py`
- `api/routes/auth.py`
- Alembic migrations

**Expected output**:
- Login queries the `users` table.
- Inactive users are rejected.
- Demo users can be seeded into Neon DB through a script or migration-safe seed command.
- Env demo users are removed or kept only as an explicit fallback for local demo mode.

### TSK-2.3: Password Hashing Utilities

**Status**: `[x]`

**Goal**: Add secure password hashing and verification.

**Expected input**:
- `api/models/user.py`
- `requirements.txt`

**Expected output**:
- New `api/auth.py` or `api/security.py` with password hash and verify helpers.
- Bcrypt/passlib dependency added if not already present.
- Seeded/demo users store hashed passwords, never plain text.

### TSK-2.4: Enhanced JWT Payload

**Status**: `[x]`

**Goal**: Include complete user identity in JWTs and login responses.

**Expected input**:
- `api/routes/auth.py`
- `api/models/user.py`

**Expected output**:
- `POST /api/v1/auth/login` returns `access_token`, `token_type`, `role`, `user_id`, `name`, and expiry metadata.
- JWT payload includes `sub`, `user_id`, `name`, `role`, `iat`, and `exp`.

### TSK-2.5: Route Authorization Dependencies

**Status**: `[x]`

**Goal**: Protect sensitive API routes by role.

**Expected input**:
- `api/routes/*.py`
- JWT helper module from TSK-2.3/TSK-2.4

**Expected output**:
- [x] `get_current_user` dependency.
- [x] `require_role(...)` dependency.
- [x] Complaint status and respond routes require a valid bearer token.
- [x] Role checks applied to dashboard, analytics, agents, simulation, regulatory, history, and ai routes.
- Supervisor-only routes are protected where appropriate.
- Invalid credentials return 401; insufficient role returns 403.

---

## Module 3: Kafka Queue Layer

### TSK-3.1: Kafka Producer Utility

**Status**: `[x]`

**Goal**: Publish newly created complaints to Kafka.

**Expected input**:
- `api/routes/complaints.py`
- `docker-compose.yml`
- `.env.example`

**Expected output**:
- New `kafka/producer.py` with `publish_complaint(complaint_data)`.
- Producer reads broker config from settings/env.
- Complaint create route can publish to `complaints.inbound`.
- If Kafka is unavailable, API behavior is explicit: fail fast in strict mode or fall back to background pipeline in demo mode.

### TSK-3.2: Base Consumer With Retry + DLQ

**Status**: `[x]`

**Goal**: Create a reusable consumer base for queue workers.

**Expected input**:
- Kafka broker configuration
- Desired topics from roadmap: `complaints.inbound`, `complaints.dlq`, `complaints.translated`

**Expected output**:
- New `kafka/base_consumer.py`.
- Common JSON decoding, retry handling, logging, and dead-letter publishing.
- Clean shutdown behavior for worker processes.

### TSK-3.3: Topic Bootstrap Script

**Status**: `[x]`

**Goal**: Make topic creation explicit and repeatable.

**Expected input**:
- `docker-compose.yml`
- Kafka topic names

**Expected output**:
- Script or Make target to create required topics.
- Topics include `complaints.inbound`, `complaints.dlq`, and `complaints.translated`.
- Documented command in root README once README exists.

### TSK-3.4: Inbound Pipeline Consumer

**Status**: `[x]`

**Goal**: Process inbound complaint messages from Kafka and run the existing LangGraph pipeline.

**Expected input**:
- `agents/orchestrator.py`
- `kafka/base_consumer.py`
- `kafka/producer.py`

**Expected output**:
- New `agents/inbound_consumer.py`.
- Consumes `complaints.inbound`.
- Calls `run_pipeline(...)` with complaint id, text, channel, customer id, language, and bot slots.
- Writes failures to DLQ.

### TSK-3.5: Optional Pipeline Step Consumers

**Status**: `[x]`

**Goal**: Add wrapper consumers for individual AI stages only if the team wants distributed processing.

**Expected input**:
- `agents/emotion_agent.py`
- `agents/dna_agent.py`
- `agents/severity_agent.py`
- `agents/escalation_agent.py`
- `services/translation_service.py`

**Expected output**:
- Optional worker files such as `agents/translation_consumer.py`, `agents/emotion_consumer.py`, `agents/dna_consumer.py`, `agents/severity_consumer.py`, and `agents/escalation_consumer.py`.
- Each worker has clear input/output topic contracts.
- **NOT IMPLEMENTED**: The orchestrator (`agents/inbound_consumer.py`) remains the single pipeline executor for sequential processing. Distributed consumers are documented as optional future work.

---

## Module 4: AI Pipeline, SLA Risk Model & Observability

### TSK-4.1: Decide Sequential vs Parallel LangGraph Shape

**Status**: `[x]`

**Goal**: Align the pipeline implementation with the intended architecture.

**Expected input**:
- `agents/orchestrator.py`
- `implementation_plan.md`

**Expected output**:
- [x] Parallel LangGraph pipeline shape implemented: emotion||severity → dna||escalation run in parallel after nlp.
- Pipeline behavior is deterministic and documented.

### TSK-4.2: Per-Agent Timing Logs

**Status**: `[x]`

**Goal**: Track execution time and result status for each pipeline node.

**Expected input**:
- `agents/orchestrator.py`
- Existing logging setup

**Expected output**:
- Timing logs for translation, NLP, emotion, DNA, severity, escalation, root cause, and DB merge.
- Failed nodes include complaint id and enough context to debug without exposing secrets.
- Optional persisted timing metadata if needed for demo analytics.

### TSK-4.3: Local SLA Risk Training Pipeline

**Status**: `[x]`

**Goal**: Add scripts for a trained local model that predicts SLA deadline risk.

**Expected input**:
- Existing complaint fields
- Queue size and priority features
- `agents/escalation_agent.py`

**Expected output**:
- [x] New `ml/generate_training_data.py`.
- [x] New `ml/train_violation_model.py`.
- [x] Generated model artifact `ml/violation_predictor.pkl`.
- [x] Reproducible training instructions.

### TSK-4.4: Integrate Trained SLA Risk Model

**Status**: `[x]`

**Goal**: Replace or augment the current heuristic/Groq risk score with the trained model.

**Expected input**:
- `agents/escalation_agent.py`
- Model artifact from TSK-4.3

**Expected output**:
- [x] `breach_probability` uses the trained model when available with heuristic fallback.
- [x] Fallback heuristic remains available for demo mode.
- [x] `pre_escalate` is set when probability exceeds the configured threshold.

---

## Module 5: API Extensions & Routing

### TSK-5.1: Complaint Search & Advanced Filters

**Status**: `[x]`

**Goal**: Expand `GET /api/v1/complaints` beyond `status` and `channel`.

**Expected input**:
- `api/routes/complaints.py`
- `api/models/complaint.py`

**Expected output**:
- Query params for `assigned_to`, `regulatory_flag`, `priority_tier`, `sla_tier`, and `search`.
- Text search covers useful fields such as customer id, raw text, complaint type, intent, and product code.
- Pagination still works after filters.

### TSK-5.2: Route Aliases

**Status**: `[x]`

**Goal**: Add judge/demo-friendly aliases for existing routes.

**Expected input**:
- `api/routes/dashboard.py`
- `api/routes/complaints.py`
- `api/main.py`

**Expected output**:
- `GET /api/v1/kpis` returns the same schema as `GET /api/v1/dashboard/kpis`.
- `GET /api/v1/escalations` returns the same schema as `GET /api/v1/complaints/escalations`.

### TSK-5.3: Analytics Duration Parser

**Status**: `[x]`

**Goal**: Support duration strings and matching aggregation buckets.

**Expected input**:
- `api/routes/analytics.py`

**Expected output**:
- [x] `GET /api/v1/analytics/trends?window=12h` returns hourly data.
- [x] `GET /api/v1/analytics/trends?window=30d` returns daily data with daily aggregation.
- Existing integer day window behavior remains backward compatible.

### TSK-5.4: Dedicated Draft Service

**Status**: `[x]`

**Goal**: Move inline response generation into a service.

**Expected input**:
- `api/routes/complaints.py`
- `api/routes/ai.py`
- `agents/utils.py`
- `services/translation_service.py`

**Expected output**:
- New `services/draft_service.py`.
- Exports `generate_draft(complaint, tone)`.
- Route handlers become thin and reuse the service.
- Tone matching remains supported.

### TSK-5.5: WebSocket Alert Expansion

**Status**: `[x]`

**Goal**: Broadcast structured dashboard events for high-value operational alerts.

**Expected input**:
- `api/websocket.py`
- `services/sla_service.py`
- `agents/escalation_agent.py`
- `api/routes/agents.py`

**Expected output**:
- [x] Structured events for `violation_predicted`, `cluster_spike`, and `agent_overload`.
- Existing complaint created/status/SLA alerts continue to work.
- Event schema is documented for frontend consumers.

### TSK-5.6: Fix Complaint History Timestamp Bug

**Status**: `[x]`

**Goal**: Fix likely runtime error in complaint history generation.

**Expected input**:
- `api/routes/history.py`

**Expected output**:
- [x] Replace invalid timestamp math with `timedelta(seconds=2)`.
- [x] Add a focused test for `GET /api/v1/complaints/{id}/history` in `tests/test_history.py`.

### TSK-5.7: Request Logging Middleware

**Status**: `[x]`

**Goal**: Add lightweight API request logging for demo and debugging.

**Expected input**:
- `api/main.py`

**Expected output**:
- [x] Middleware logs method, path, status code, duration, and request id.
- Sensitive headers and body content are not logged.

---

## Module 6: SLA, Regulatory & Agent Dispatch Services

### TSK-6.1: Regulatory Timer Service

**Status**: `[x]`

**Goal**: Track regulatory deadlines separately from normal SLA timers.

**Expected input**:
- `services/sla_service.py`
- `api/models/complaint.py`
- Redis configuration

**Expected output**:
- New `services/regulatory_service.py`.
- Redis-backed regulatory timers for eligible complaints.
- `GET /api/v1/regulatory/{complaint_id}/status`.
- Periodic regulatory deadline checks integrated into scheduler.

### TSK-6.2: Agent Dispatch Service

**Status**: `[x]`

**Goal**: Move agent capacity and assignment logic out of the route layer.

**Expected input**:
- `api/routes/agents.py`
- `api/models/complaint.py`
- Redis configuration

**Expected output**:
- [x] New `services/agent_service.py`.
- [x] `compute_agent_load` function implemented.
- [x] Existing `GET /api/v1/agents/load` delegates to the service.

### TSK-6.3: SLA Expiry Status Decision

**Status**: `[~]`

**Goal**: Decide whether expired tickets should use explicit `overdue` status or current `sla_breached=True` + escalation behavior.

**Expected input**:
- `services/sla_service.py`
- `api/models/complaint.py`
- Frontend/dashboard expectations

**Expected output**:
- Product decision documented.
- Code updated if explicit `overdue` is required.
- Dashboard KPI logic matches the chosen behavior.

---

## Module 7: Frontend Core App Foundation

### TSK-7.1: App Routing & Shell

**Status**: `[x]`

**Goal**: Convert the current landing/demo frontend into an operational app shell.

**Expected input**:
- `frontend/src/App.tsx`
- `frontend/src/components/uccd/`

**Expected output**:
- React Router configured.
- Protected route layout.
- Sidebar/app navigation.
- Existing landing page preserved only if still useful as a public route.

### TSK-7.2: API Client

**Status**: `[x]`

**Goal**: Add typed frontend API access.

**Expected input**:
- Backend routes in `api/routes/`
- `frontend/package.json`

**Expected output**:
- New `frontend/src/api/client.ts`.
- Authorization token handling.
- Base URL configured from Vite env.
- Error handling for expired/invalid tokens.

### TSK-7.3: Frontend Types

**Status**: `[x]`

**Goal**: Add TypeScript interfaces aligned with backend schemas.

**Expected input**:
- `api/schemas/complaint.py`
- Backend route response shapes

**Expected output**:
- New `frontend/src/types/complaint.ts`.
- Shared types for complaints, KPI payloads, trends, agent load, history, draft responses, and WebSocket events.

### TSK-7.4: Auth Context & Login Screen

**Status**: `[x]`

**Goal**: Build frontend auth flow.

**Expected input**:
- `api/routes/auth.py`
- Frontend API client

**Expected output**:
- Login screen with credentials and role-aware redirect.
- Auth context stores token and current user metadata.
- Logout clears session.
- Protected routes redirect unauthenticated users.

### TSK-7.5: Design Token Cleanup

**Status**: `[x]`

**Goal**: Decide whether to keep theme tokens in `index.css` or move them to `src/styles/tokens.css`.

**Expected input**:
- `frontend/src/index.css`

**Expected output**:
- [x] Created `frontend/src/styles/tokens.css` with extracted design tokens.
- [x] Imported tokens.css in `index.css`.

---

## Module 8: Frontend Operational Screens

### TSK-8.1: Agent Queue

**Status**: `[~]`

**Goal**: Build "My Queue" for agents.

**Expected input**:
- `GET /api/v1/complaints`
- `GET /api/v1/agents/load`
- Complaint types from `frontend/src/types/complaint.ts`

**Expected output**:
- [x] Initial queue page with ticket list, status filter, and search.
- [ ] Add full filter set for channel, assignment, priority, and regulatory flag.
- [ ] Add SLA progress/countdown display.

### TSK-8.2: Complaint Detail Workspace

**Status**: `[ ]`

**Goal**: Build the 3-column agent workspace.

**Expected input**:
- `GET /api/v1/complaints/{id}`
- `GET /api/v1/complaints/{id}/history`
- `GET /api/v1/ai/draft/{id}`
- `POST /api/v1/complaints/{id}/respond`

**Expected output**:
- Customer context column.
- Communication and editable AI draft column.
- AI triage column with severity, emotion arc, cluster, regulatory data, and next actions.
- Send response flow resolves the ticket.

### TSK-8.3: Supervisor Command Center

**Status**: `[~]`

**Goal**: Build live supervisor dashboard.

**Expected input**:
- `GET /api/v1/dashboard/kpis`
- `GET /api/v1/complaints/escalations`
- `GET /api/v1/agents/load`
- `GET /api/v1/analytics/trends`
- WebSocket supervisor endpoint

**Expected output**:
- [x] Initial KPI ribbon.
- [x] Initial escalation/risk queue.
- [x] Initial agent capacity bars.
- [ ] Live event feed.
- [ ] Volume/severity trend visuals.

### TSK-8.4: Regulatory Dashboard

**Status**: `[ ]`

**Goal**: Build supervisor/compliance view for regulatory cases.

**Expected input**:
- Regulatory service from TSK-6.1
- Complaint filters from TSK-5.1

**Expected output**:
- Regulatory queue.
- Deadline status per complaint.
- Filters by deadline risk, status, channel, and category.

### TSK-8.5: Insights & Trends Dashboard

**Status**: `[ ]`

**Goal**: Build analytics view using trends API.

**Expected input**:
- `GET /api/v1/analytics/trends`
- Analytics duration parser from TSK-5.3

**Expected output**:
- Trend chart.
- Category distribution.
- SLA/risk summary.
- Driver table or equivalent ranked insights.

### TSK-8.6: Simulation Sandbox

**Status**: `[ ]`

**Goal**: Build UI for simulation endpoint.

**Expected input**:
- `POST /api/v1/simulation/run`

**Expected output**:
- Inputs for staff adjustment, volume spike, SLA override, and policy mode.
- Baseline vs projected metrics.
- Recommendation display.

### TSK-8.7: Complaint Search

**Status**: `[~]`

**Goal**: Build search page over the complaint queue.

**Expected input**:
- Advanced filters from TSK-5.1

**Expected output**:
- [x] Initial search route reuses queue search.
- [ ] Add dedicated sortable/filterable results.
- [ ] Link results into complaint detail workspace.

### TSK-8.8: WebSocket Hook & Toasts

**Status**: `[x]`

**Goal**: Add frontend live-update infrastructure.

**Expected input**:
- `api/websocket.py`
- WebSocket event schema from TSK-5.5

**Expected output**:
- [x] New `frontend/src/hooks/useWebSocket.ts`.
- [x] Reconnect behavior.
- [x] `lastMessage` / event stream support.
- Supervisor dashboard updates and toast notifications.

---

## Module 9: Demo Data, Tests & Documentation

### TSK-9.1: Seed Script Update

**Status**: `[x]`

**Goal**: Expand demo seed data and align it with final ingestion architecture.

**Expected input**:
- `scripts/seed_demo.py`
- Kafka producer from TSK-3.1 if queue flow is enabled

**Expected output**:
- [x] 20 diverse Union Bank-style complaints seeded.
- [x] Demo records cover UPI, ATM, cards, loans, KYC, app downtime, pension, service quality, and regulatory cases.

### TSK-9.2: Backend Test Suite

**Status**: `[ ]`

**Goal**: Add focused tests for core backend behavior.

**Expected input**:
- `api/routes/`
- `agents/`
- `services/`

**Expected output**:
- [x] `tests/test_auth.py`
- [x] `tests/test_complaints.py`
- [x] `tests/test_sla.py`
- [x] `tests/test_agents.py`
- [x] `tests/test_history.py`
- [x] `tests/test_integration.py`
- `pytest` runs without needing real external AI calls by using mocks.

### TSK-9.3: Frontend Build Verification

**Status**: `[x]`

**Goal**: Keep frontend changes build-safe as operational screens are added.

**Expected input**:
- `frontend/package.json`

**Expected output**:
- [x] `npm run build` passes.
- Add lightweight component or route tests if the project adds a frontend test runner.

### TSK-9.4: Root README

**Status**: `[x]`

**Goal**: Add project-level setup and demo instructions.

**Expected input**:
- `Makefile`
- `.env.example`
- `docker-compose.yml`
- `scripts/seed_demo.py`
- Frontend README

**Expected output**:
- [x] Root `README.md`.
- [x] Setup steps for Neon DB, Redis/Kafka/API, Groq, Sarvam, Telegram optional flow, seed data, backend run, frontend run, and demo path.
- Mention that PostgreSQL is Neon-hosted, not local Docker.

### TSK-9.5: Final Demo Checklist

**Status**: `[x]`

**Goal**: Define the judge-facing end-to-end demo path.

**Expected input**:
- Completed backend routes
- Completed frontend screens
- Seed data
- WebSocket events

**Expected output**:
- [x] A short checklist in `README.md`.
- [x] Steps show complaint ingestion, AI triage, SLA/risk indicators, agent response, supervisor live updates, analytics, and simulation.
