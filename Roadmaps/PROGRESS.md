# UCCD — Progress Checklist vs Roadmaps

Checklist derived from each person’s roadmap HTML in `Roadmaps/` and verified against the repo (`api/`, `agents/`, `services/`, `scripts/`, `docker-compose.yml`).  
Legend: `[x]` done in codebase · `[ ]` not done / stub / missing

_Last updated: repo snapshot at time of writing._

---

## Abhineet — AI Engineer + Backend (FastAPI)

Source: [Roadmap_Abhineet.html](Roadmap_Abhineet.html)

### Week 1 — FastAPI + ORM + core routes

- [x] Project layout: `api/main.py`, `api/models/`, `api/routes/`, `api/schemas/`, `api/db/`
- [x] `api/models/complaint.py` — SQLAlchemy `Complaint` model (rich columns incl. AI fields)
- [x] `api/schemas/complaint.py` — Pydantic `ComplaintCreate`, `ComplaintResponse`, `ComplaintListResponse`, `StatusUpdate`
- [x] `api/routes/complaints.py` — `POST /api/v1/complaints`, `GET /api/v1/complaints` (filters + pagination), `GET /api/v1/complaints/{id}`
- [x] Real DB persistence (not mock-only) for complaints
- [x] `GET /api/v1/complaints/escalations` (roadmap listed as `GET /api/v1/escalations` — implemented under complaints prefix)

### Week 2 — NLP classifier

- [x] `agents/nlp_classifier.py` — multi-field JSON classification (uses **Groq** + `GROQ_ACCESS_TOKEN`, not Claude/Anthropic as in roadmap)
- [x] `type_confidence` populated by classifier — `classify_complaint()` returns it (`agents/nlp_classifier.py:54`), `run_nlp()` extracts it (`agents/orchestrator.py:26`), `merge_and_save()` stores it in DB (`agents/orchestrator.py:41`)
- [ ] Kafka `NLPConsumer` / consume `complaints.inbound` (roadmap); pipeline runs from FastAPI `BackgroundTasks` instead

### Week 3 — LangGraph orchestrator

- [x] `agents/state.py` — `ComplaintState` TypedDict
- [x] `agents/orchestrator.py` — LangGraph: parallel nodes from `START`, `merge_and_save` → DB + `set_sla_timer` when `sla_tier` set
- [x] `agents/root_cause_agent.py` — minimal logic (cluster size threshold)
- [x] `run_emotion`, `run_dna`, `run_severity`, `run_escalation` — all implemented (Groq + heuristic logic; not stubs)
- [ ] Publish to Kafka on create + async pipeline only via queue (roadmap); pipeline runs inline (Groq API calls are blocking, not queued)

### Week 4 — Draft response + WebSocket

- [ ] `services/draft_service.py` — separate file missing (draft logic inline in `api/routes/complaints.py` {line 166})
- [x] `GET /api/v1/ai/draft/{complaint_id}` — `GET /api/v1/ai/draft/{complaint_id}` in `api/routes/ai.py:30` — delegates to complaints route handler
- [x] `POST /api/v1/complaints/{id}/respond` — final response + edit delta + resolve (`api/routes/complaints.py:201`); also stored in `respond_and_resolve_complaint()`
- [x] `api/websocket.py` — `ConnectionManager`, `ws://.../api/v1/ws/supervisor`, `broadcast_event()`
- [ ] WebSocket message types exactly as roadmap (`sla_exceed_predicted`, `sla_exceed_occurred`, `cluster_spike`, `agent_overload`); `sla_exceed_occurred` is implemented on TTL expiry (`sla_alert` type in `sla_service.py:178\`); `new_complaint`, `complaint_status_changed`, `sla_alert` (50/75/90%) also present — `sla_exceed_predicted`, `cluster_spike`, `agent_overload` still missing


### Week 5 — Remaining API surface

- [x] `PUT /api/v1/complaints/{id}/status` with transition validation (roadmap rules differ slightly; repo has explicit `VALID_TRANSITIONS`)
- [x] `GET /api/v1/agents/load` (`api/routes/agents.py`) — active load by department + agent
- [x] `GET /api/v1/analytics/trends`(`?window=…`) — daily volume + category dist + avg severity + SLA compliance
- [x] `POST /api/v1/simulation/run` — policy simulation (staffing, volume, policy mode)
- [x] `GET /api/v1/complaints/{id}/history` — audit timeline events for complaint
- [x] `GET /api/v1/ai/translate-preview` — Groq-based multi-language translation (`api/routes/ai.py:10`)
- [x] CORS `allow_origins` includes `http://localhost:3000` AND `http://localhost:5173` (`api/main.py:31`)

### Week 6 — Integration / polish

- [ ] `scripts/seed_demo.py` — 16 demo complaints exist (`scripts/seed_demo.py`, CUST_1001–CUST_1016); roadmap asks for 20; file is runnable and calls `run_pipeline()` per complaint
- [ ] Request logging middleware
- [ ] Full E2E timing/logging per agent node as specified

---

## Akash — ML Engineer + Infra (Kafka, DB, ML agents)

Source: [Roadmap_Akash.html](Roadmap_Akash.html)

### Week 1 — Kafka + PostgreSQL + pgvector

- [ ] `kafka/producer.py` — `publish_complaint`
- [ ] `kafka/base_consumer.py` — `BaseConsumer`, DLQ handling
- [ ] Topics: `complaints.inbound`, `complaints.dlq`, `complaints.translated`
- [ ] `docker-compose.yml` — Zookeeper + Kafka + Postgres + pgvector bootstrap
- [ ] `db/schema.sql` — full schema + `CREATE EXTENSION vector`
- [ ] IVFFlat index on `embedding`
- [ ] `db/connection.py` (roadmap); repo uses `api/db/session.py` for SQLAlchemy instead
- [ ] Alembic migrations from schema

### Weeks 2–5 — ML pipeline + consumers

- [ ] `services/translation_service.py` (implemented, no `agents/translation_consumer.py`) + `agents/translation_consumer.py` (missing Kafka consumer)
- [ ] `agents/dna_agent.py` — Groq-based clustering implemented; `DNAConsumer` Kafka consumer wrapper missing
- [ ] `agents/severity_agent.py` — Groq-based weighted scoring implemented; `SeverityConsumer` Kafka consumer wrapper missing
- [ ] `agents/emotion_agent.py` — Groq-based sentiment analysis implemented; `EmotionConsumer` Kafka consumer wrapper missing
- [ ] `agents/escalation_agent.py` — Groq + heuristic SLA warning prediction implemented; `EscalationConsumer` Kafka consumer wrapper missing
- [ ] `ml/generate_training_data.py`, `ml/train_sla_model.py`, `ml/sla_predictor.pkl` — all missing

### Week 6 — Integration

- [ ] All Kafka consumers running together + E2E with FastAPI + DB

---

## Hemant — Frontend Engineer

Source: [Roadmap_Hemant.html](Roadmap_Hemant.html)

### Setup

- [ ] `frontend/` Vite + React + TypeScript project
- [ ] `src/styles/tokens.css` — design tokens
- [ ] `src/api/client.ts` — Axios + Token interceptor
- [ ] `src/types/complaint.ts` — interfaces aligned with API
- [ ] React Router + protected routes + `Sidebar.tsx`

### Screens (8)

- [ ] **Screen 1** — Login (`LoginForm`, `RoleSelector`, `AuthContext`)
- [ ] **Screen 2** — My Queue (`ComplaintRow`, `SLATimer`, `FilterPills`, …)
- [ ] **Screen 3** — Complaint detail (`EmotionArcChart`, `ConversationHistory`, `AIDraftPanel`, `TriagePanel`, `NBAPanel`, …)
- [ ] **Screen 4** — Supervisor Command Centre (`KPIBar`, `EscalationQueue`, `AgentLoadBars`, `AIFeed`, `VolumeChart`)
- [ ] **Screen 5** — Regulatory dashboard
- [ ] **Screen 6** — Insights / trends (`TrendLineChart`, `HeatmapGrid`, `DriversTable`)
- [ ] **Screen 7** — Simulation sandbox
- [ ] **Screen 8** — Complaint search

### Real-time / Week 5

- [ ] `src/hooks/useWebSocket.ts` — reconnect, `lastMessage`
- [ ] Supervisor UI wired to WebSocket + toasts

---

## Pritesh / Suryansh — Auth · SLA · DevOps · QA

Sources: [Roadmap_Pritesh.html](Roadmap_Pritesh.html), [Roadmap_Suryansh.html](Roadmap_Suryansh.html) (same role split in roadmaps)

### Week 1 — Docker + Redis + API

- [x] `docker-compose.yml` — **Redis** + **api** service, `Dockerfile` build
- [ ] Full stack per roadmap: Zookeeper, Kafka, Postgres, Redis, api in one compose
- [ ] `Makefile` (`make up`, `make down`, `make logs`, `make seed`, `make test`)
- [ ] `src/config.py` — pydantic `BaseSettings` for env
- [ ] `.env.example` with `SARVAM_ACCESS_TOKEN` and full team vars

### Week 2 — Token + RBAC

- [x] `POST /api/v1/auth/login` — issues Token (`api/routes/auth.py`)
- [ ] `api/models/user.py` + users table + bcrypt-hashed credentials + seed users
- [ ] `api/auth.py` — `create_access_token`, `verify_token`, `get_current_user`, `require_role`
- [ ] OAuth2 bearer dependency on protected routes (login is public; complaints/dashboard open in current app)

### Week 3 — Redis SLA engine

- [x] `services/sla_service.py` — Redis keys, `set_sla_timer`, `get_sla_status`, `check_all_sla`, `fire_sla_alert`, `clear_sla`
- [x] APScheduler in `api/main.py` lifespan — job every **1 minute** (roadmap: 60s ✓)
- [ ] `supervisor_notification_service` (roadmap mentions alongside WS)
- [ ] On TTL expiry: roadmap says status `"overdue"`; repo sets `sla_breached=True` and may set `escalated` (verify product intent vs roadmap)

### Week 4 — Agent load + regulatory

- [ ] `services/agent_service.py` — queues, `compute_agent_load`, `get_best_agent`, `check_agent_loads`, `GET /api/v1/agents/load`
- [ ] `services/regulatory_service.py` — regulatory Redis timers + `check_regulatory_deadlines` + `get_regulatory_status`

### Week 5–6 — Tests + README + demo

- [ ] `tests/` — `test_auth.py`, `test_complaints.py`, `test_sla.py`, `test_agents.py`, `test_integration.py`
- [ ] `README.md` — clone, `make up`, demo flow
- [ ] Coordinate `scripts/seed_demo.py` with Abhineet roadmap (not present; `scripts/create_tables.py` exists only)

---

## Quick summary

| Owner | Roughly done | Main gaps |
|--------|----------------|------------|
| **Abhineet** | Core API, NLP/Groq, LangGraph full orchestrator (NLP → emotion → dna → severity → escalation → root-cause → DB), WS, dashboard KPIs, escalations, agents/load, analytics/trends, simulation, history, translate-preview, respond route, CORS (5173+3000), seed script (runable) | `services/draft_service.py` missing as separate file (draft inline), WS message types not matching roadmap (`sla_exceed_predicted`/`cluster_spike`/`agent_overload` absent), seed script 16 vs 20 target, Kafka missing, request-log middleware missing, per-node E2E timing missing |
| **Akash** | — | Entire Kafka (`kafka/` absent), Kafka-based ML agent consumers, db/schema.sql + pgvector, Alembic, `db/connection.py`, `ml/` training pipeline, kafka-based E2E |
| **Hemant** | — | Entire app-level `frontend/` (only landing page exists); no API client, types, screens, hooks, router |
| **Pritesh/Suryansh** | Redis SLA engine, Token login, APScheduler, Dockerfile | Full compose (Kafka/Postgres missing), `Makefile`, `src/config.py`, `api/models/user.py`, `api/auth.py`, RBAC/`require_role`, `services/agent_service.py`, `services/regulatory_service.py`, `tests/`, `README.md` |

---

## Note on `scripts/`

- [x] `scripts/create_tables.py` exists (not in original checklist; useful for local DB setup)
- [ ] `scripts/seed_demo.py` — as per Abhineet Week 6 / Pritesh Week 6 roadmap
