# UCCD - Progress Checklist vs Roadmaps

Checklist derived from each person's roadmap HTML in `Roadmaps/` and verified against the current repo (`api/`, `agents/`, `services/`, `scripts/`, `frontend/`, `db/`, `alembic/`, `docker-compose.yml`, `Makefile`).

Legend: `[x]` done in codebase, `[~]` partially done / exists but incomplete, `[ ]` not done / missing.

Last updated: 2026-05-25 from local repo snapshot.

---

## Abhineet - AI Engineer + Backend (FastAPI)

Source: [Roadmap_Abhineet.html](Roadmap_Abhineet.html)

### Week 1 - FastAPI + ORM + core routes

- [x] Project layout: `api/main.py`, `api/models/`, `api/routes/`, `api/schemas/`, `api/db/`
- [x] `api/models/complaint.py` - SQLAlchemy `Complaint` model with rich AI fields
- [x] `api/schemas/complaint.py` - complaint create/response/list/status schemas
- [x] `api/routes/complaints.py` - create, list, get-by-id routes
- [x] Real DB persistence through SQLAlchemy
- [x] Escalation queue route exists as `GET /api/v1/complaints/escalations`
- [ ] Roadmap alias `GET /api/v1/escalations` is not implemented

### Week 2 - NLP classifier

- [x] `agents/nlp_classifier.py` - Groq-backed multi-field JSON classification
- [x] Classifier populates `complaint_type`, `product_code`, `intent`, `regulatory_obligation`, `type_confidence`
- [ ] Kafka `NLPConsumer` / `complaints.inbound` consumer is not implemented

### Week 3 - LangGraph orchestrator

- [x] `agents/state.py` - `ComplaintState` TypedDict
- [x] `agents/orchestrator.py` - LangGraph pipeline wired end-to-end
- [x] Translation step added before NLP via `services/translation_service.py`
- [x] `run_emotion`, `run_dna`, `run_severity`, `run_escalation`, `run_root_cause` are implemented
- [x] `merge_and_save` writes AI output to DB and starts Redis SLA timers when possible
- [~] Pipeline runs from FastAPI background tasks and seed script; Kafka-based orchestration is still missing
- [x] Parallel LangGraph pipeline shape implemented: emotion||severity → dna||escalation run in parallel after nlp

### Week 4 - Draft response + WebSocket

- [x] `GET /api/v1/ai/draft/{complaint_id}` exists and delegates to complaint draft generation
- [x] `GET /api/v1/complaints/{complaint_id}/draft` exists
- [x] `POST /api/v1/complaints/{id}/respond` resolves ticket, stores response notes, clears SLA, and can reply to Telegram
- [x] `api/websocket.py` exists with supervisor WebSocket support
- [x] Draft generation is centralized in `services/draft_service.py`; complaint and AI routes reuse it
- [x] WebSocket broadcasts implemented for structured events: `violation_predicted`, `cluster_spike`, `agent_overload`

### Week 5 - Remaining API surface

- [x] `PUT /api/v1/complaints/{id}/status` with transition validation
- [x] `GET /api/v1/agents/load`
- [x] `GET /api/v1/analytics/trends`
- [x] `POST /api/v1/simulation/run`
- [x] `GET /api/v1/complaints/{id}/history`
- [x] `GET /api/v1/ai/translate-preview`
- [x] CORS allows `http://localhost:5173` and `http://localhost:3000`
- [x] Complaint list filters support `status`, `channel`, `assigned_to`, `regulatory_flag`, `priority_tier`, `sla_tier`, and text search
- [x] Analytics duration parser supports `12h`, `30d` string windows with corresponding aggregation buckets
- [x] Aliases `GET /api/v1/kpis` and `GET /api/v1/escalations` are implemented

### Week 6 - Integration / polish

- [x] `scripts/seed_demo.py` exists and inserts 20 Union Bank-style demo complaints
- [x] Seed script calls `run_pipeline()` for each complaint
- [x] Request logging middleware added to `api/main.py`
- [x] Full per-agent node timing/logging implemented via agents/timing.py decorator
- [x] `GET /api/v1/complaints/{id}/history` timestamp math bug fixed with `timedelta(seconds=2)`

---

## Akash - ML Engineer + Infra (Kafka, DB, ML agents)

Source: [Roadmap_Akash.html](Roadmap_Akash.html)

### Week 1 - Kafka + PostgreSQL + pgvector

- [x] `docker-compose.yml` includes Zookeeper, Kafka, Redis, and API services
- [x] Database is intentionally externalized to Neon via `POSTGRES_URL`; no local PostgreSQL container is required
- [x] `db/schema.sql` exists with `users`, `complaints`, `CREATE EXTENSION vector`, and vector index
- [x] Vector index  HNSW implemented
- [x] Alembic is initialized with `alembic/`, `alembic.ini`, and migration files under `alembic/versions/`
- [x] `api/db/session.py` provides SQLAlchemy DB connection/session handling
- [x] `kafka/producer.py` - publishes complaints to `complaints.inbound` topic
- [x] `kafka/base_consumer.py` - base consumer with retry/DLQ support
- [x] `scripts/create_kafka_topics.py` - topic bootstrap script
- [x] `agents/inbound_consumer.py` - consumes inbound topic, runs pipeline, handles DLQ

### Weeks 2-5 - ML pipeline + consumers

- [x] `services/translation_service.py` implemented
- [x] `agents/dna_agent.py` implemented
- [x] `agents/severity_agent.py` implemented
- [x] `agents/emotion_agent.py` implemented
- [x] `agents/escalation_agent.py` implemented
- [ ] Kafka consumer wrappers missing: `translation_consumer.py`, `DNAConsumer`, `SeverityConsumer`, `EmotionConsumer`, `EscalationConsumer` (optional distributed processing)
- [x] `ml/generate_training_data.py`, `ml/train_violation_model.py` created; `ml/violation_predictor.pkl` generated
- [x] Escalation prediction uses trained model when available with heuristic fallback

### Week 6 - Integration

- [~] `agents/inbound_consumer.py` runs single consumer; full multi-consumer orchestration not implemented
- [~] End-to-end API + DB + AI pipeline exists without Kafka

---

## Hemant - Frontend Engineer

Source: [Roadmap_Hemant.html](Roadmap_Hemant.html)

### Setup

- [x] `frontend/` Vite + React + TypeScript project exists
- [x] Tailwind/theme styling exists in `frontend/src/index.css`
- [x] Reusable marketing/demo components exist under `frontend/src/components/uccd/`
- [x] Static API documentation data exists in `frontend/src/data/apiDocs.ts`
- [x] Design tokens extracted to `frontend/src/styles/tokens.css` and imported in `index.css`
- [x] `src/api/client.ts` exists with typed fetch client, bearer token handling, and 401 session clearing
- [x] `src/types/complaint.ts` exists with API-aligned frontend types
- [x] React Router + protected routes implemented
- [x] App shell/sidebar implemented in `src/layout/AppShell.tsx`

### Screens (8)

- [~] Current frontend now has an operational app foundation plus the preserved landing page at `/landing`
- [x] Screen 1 - Login (`LoginPage`, role presets, `AuthContext`)
- [~] Screen 2 - My Queue initial implementation exists; full filters and SLA countdown still pending
- [ ] Screen 3 - Complaint detail workspace (`EmotionArcChart`, `ConversationHistory`, `AIDraftPanel`, `TriagePanel`, `NBAPanel`)
- [~] Screen 4 - Supervisor Command Centre initial KPI/escalation/load implementation exists; live feed and charts pending
- [ ] Screen 5 - Regulatory dashboard
- [ ] Screen 6 - Insights / trends dashboard
- [ ] Screen 7 - Simulation sandbox
- [~] Screen 8 - Complaint search route exists and reuses queue search; dedicated search UX pending

### Real-time / Week 5

- [x] `src/hooks/useWebSocket.ts` implemented with reconnect behavior

- [ ] `src/hooks/useWebSocket.ts` missing
- [ ] Supervisor UI wired to WebSocket + toasts missing
- [x] `src/hooks/useInViewOnce.ts` exists for landing-page animations

---

## Pritesh / Suryansh - Auth, SLA, DevOps, QA

Sources: [Roadmap_Pritesh.html](Roadmap_Pritesh.html), [Roadmap_Suryansh.html](Roadmap_Suryansh.html)

### Week 1 - Docker + Redis + API

- [x] `docker-compose.yml` includes Redis + API service
- [x] `docker-compose.yml` includes Zookeeper + Kafka
- [x] Compose intentionally excludes PostgreSQL because the project uses Neon DB through `POSTGRES_URL`
- [x] `Makefile` exists with `up`, `down`, `logs`, `seed`, `test`, `build`, `migrate`, `shell`, `clean`
- [x] `.env.example` includes Postgres, Redis, Kafka, JWT, Groq, Telegram, demo user, and Sarvam variables
- [x] `api/config.py` centralizes env settings for Neon DB, Redis, Kafka, JWT, Groq, Sarvam, Telegram, and API host

### Week 2 - Token + RBAC

- [x] `api/models/user.py` exists with users table model and hashed password field
- [x] `POST /api/v1/auth/login` queries DB users and issues JWT token
- [x] `scripts/seed_users.py` + `make seed-users` create/update demo users in Neon DB
- [x] JWT payload includes `sub`, `user_id`, `name`, `role`, `iat`, and `exp`
- [x] `api/auth.py` exists with token helpers, password hashing, `get_current_user`, and `require_role`
- [x] bcrypt/passlib password utilities implemented (`bcrypt==4.0.1`)
- [x] Role checks applied to dashboard, analytics, agents, simulation, regulatory, history, and ai routes

### Week 3 - Redis SLA engine

- [x] `services/sla_service.py` implements Redis SLA keys, timer setup, status lookup, periodic checks, alert firing, and clearing
- [x] APScheduler runs `check_all_sla` every 1 minute in `api/main.py`
- [~] Supervisor notification is via WebSocket helper; no separate `supervisor_notification_service`
- [~] Expiry behavior sets `sla_breached=True` and may escalate; roadmap expected an explicit `overdue` status

### Week 4 - Agent load + regulatory

- [x] `GET /api/v1/agents/load` exists in `api/routes/agents.py`
- [x] `services/agent_service.py` extracts agent load computation
- [x] `services/regulatory_service.py` implements Redis regulatory timers, status lookup, periodic checks, alert firing, and clearing
- [x] APScheduler runs `check_all_regulatory` every 5 minutes in `api/main.py`
- [x] Regulatory Redis timers and `GET /api/v1/regulatory/{complaint_id}/status` implemented

### Week 5-6 - Tests + README + demo

- [x] Backend test suite with 6 test files: test_auth.py, test_complaints.py, test_sla.py, test_agents.py, test_history.py, test_integration.py
- [x] Root `README.md` created with setup, demo path, and checklist
- [x] Frontend `README.md` exists
- [x] `scripts/create_tables.py` exists
- [x] `scripts/seed_demo.py` exists with 20 complaints
- [x] Frontend build verified (`npm run build` passes)

---

## Quick Summary

| Owner | Done | Partial | Main gaps |
| --- | --- | --- | --- |
| Abhineet | Core FastAPI routes, DB persistence, Groq/LangGraph pipeline (parallel), AI draft service/route, respond route, WebSocket alerts, analytics duration parser, simulation, history, translate preview, seed script (20 complaints), complaint filters, KPI/escalation aliases, Kafka producer, base consumer, topic script, timing logs, request logging middleware | Kafka orchestration absent | Kafka consumers, detail workspace |
| Akash | Compose has Kafka/Zookeeper, Neon DB config, pgvector schema, Alembic, ML agent modules, kafka producer/consumer, topic script, trained ML model pipeline | HNSW instead of IVFFlat | Full consumer orchestration |
| Hemant | Vite React TS project, polished landing/demo UI, API client, shared types, auth context/login, protected routes, app shell, initial queue/supervisor/search views, WebSocket hook | Styling lives in `index.css`; queue/supervisor/search are initial versions | Detail workspace, full queue filters/SLA timer, supervisor live feed/charts |
| Pritesh/Suryansh | Redis SLA engine, DB-backed JWT login, scheduler, Makefile, env example, user model, auth helpers, Neon DB env setup, agent service, route protection, backend test suite, root README | Expiry sets sla_breached vs overdue status | Regulatory dashboard, Insights dashboard, Simulation sandbox |

---

## Notes

- All 15 targeted tasks completed.
- scikit-learn added to requirements.txt for ML model.
- Frontend build produces 1.4MB JS bundle (chunk size warning >500KB).
- The frontend now has an authenticated operational foundation; the next frontend gap is the complaint detail workspace and richer live dashboard behavior.
