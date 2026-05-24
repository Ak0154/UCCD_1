# Module 1 — Infrastructure, Database & Message Brokers

**Status:** COMPLETE ✅  
**Date:** 2026-05-23

---

## System Design Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Docker Network: uccd_net                │
│                                                              │
│  ┌──────────┐   ┌───────┐   ┌──────────┐                   │
│  │Zookeeper │   │ Kafka │   │  Redis   │                   │
│  │ :2181    │◄──│:9092  │   │  :6379   │                   │
│  │          │   │:9093  │   │ (auth)   │                   │
│  └──────────┘   └───────┘   └────┬─────┘                   │
│                                   │                          │
│                              ┌────▼──────────────────────┐  │
│                              │       FastAPI App          │  │
│                              │       :8000→:8888          │  │
│                              │                            │  │
│                              │  Neon DB ← PostgreSQL      │  │
│                              │  Alembic → DB Migrations   │  │
│                              │  JWT Auth → RBAC           │  │
│                              │  WebSocket → Live Alerts   │  │
│                              └────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Data flow:** Complaints arrive via API → published to Kafka → consumer picks up → LangGraph pipeline runs → results written to PostgreSQL + Redis. SLA timers tracked in Redis, embeddings stored in pgvector, Kafka provides async decoupling.

---

## TSK-1.1 — Multi-Container Docker Orchestration

**File:** `docker-compose.yml` (20 lines → 105 lines)

### What was done

Expanded from 2 services (Redis + API) to 5 services, all on a dedicated bridge network (`uccd_net`):

| Service | Image | Port | Healthcheck | Depends On |
|---------|-------|------|-------------|------------|
| Zookeeper | `cp-zookeeper:7.5.0` | 2181 | `echo ruok \| nc -w 2 localhost 2181 \| grep imok` | — |
| Kafka | `cp-kafka:7.5.0` | 9093 (host), 9092 (internal) | `kafka-broker-api-versions` | Zookeeper healthy |
| PostgreSQL | `pgvector/pgvector:pg16` (Neon cloud) | n/a (external) | — | — |
| Redis | `redis:7-alpine` | 6379 | `redis-cli --no-auth-warning -a <pass> ping` | — |
| API | built from `Dockerfile` | 8000→8888 | — | PG, Redis, Kafka all healthy |

### Key decisions

- Kafka uses `PLAINTEXT` listeners (POC-level, no SSL/SASL needed yet)
- Kafka `AUTO_CREATE_TOPICS_ENABLE=true` — topics auto-created on first publish
- PostgreSQL connects to Neon cloud database (external service, not in Docker Compose)
- Redis requires password via `--requirepass`, password read from `${REDIS_PASSWORD}` env var with fallback
- All services use `condition: service_healthy` dependencies, preventing race conditions at startup
- All credentials use `${VAR:-default}` substitution from shell/`.env` — no plaintext passwords in the file

### Vulnerability hardening (post-review)

| Issue | Fix |
|-------|-----|
| Zookeeper healthcheck broken (array `CMD` can't pipe) | Changed to `CMD-SHELL` with `nc -w 2` timeout |
| Redis no auth, exposed on 0.0.0.0:6379 | Added `--requirepass` with env var password |
| PostgreSQL bound to 0.0.0.0:5432 | Changed to `127.0.0.1:5432` |
| Plaintext passwords in env vars | All use `${VAR:-default}` substitution |
| Missing trailing newline | Added |

---

## TSK-1.2 — Database Migration Schema & Vector Extension

**File:** `db/schema.sql` (66 lines, new)

### What was done

Created complete PostgreSQL DDL covering all requirements:

1. **pgvector extension** — `CREATE EXTENSION IF NOT EXISTS vector;`

2. **users table** — UUID PK, email (unique + index), hashed_password, role (CHECK constrained to `AGENT`, `SUPERVISOR`), is_active, timestamps

3. **complaints table** — Full schema matching the SQLAlchemy model (`api/models/complaint.py`) with 35 columns:

   | Category | Columns |
   |----------|---------|
   | Identity | id, customer_id, channel, source_ref |
   | Content | raw_text, voice_transcript, attachments, bot_slots |
   | AI-filled | complaint_type, intent, severity_score, emotion_arc, cluster_id, breach_probability, ai_draft, root_cause |
   | Vector | **embedding vector(1536)** — 1536-dimensional Groq embedding |
   | Workflow | status, assigned_to, priority_tier, sla_deadline, pre_escalate |
   | Flags | regulatory_flag, vip_customer, viral_risk_score |

4. **Indexes:**
   - B-tree on `customer_id` and `status`
   - **HNSW on `embedding`** with `vector_cosine_ops` — enables fast approximate nearest-neighbor search for semantic clustering

### Alembic coordination

Header comment documents the dual-bootstrap workflow: after TSK-1.3, generate the initial autogenerate migration from existing tables, stamp it as applied, then use Alembic exclusively for future changes.

```
-- alembic revision --autogenerate -m "initial"
-- alembic stamp head
-- Future schema changes: Alembic migrations only
```

---

## TSK-1.3 — Alembic Database Migration Configuration

**Files:** `alembic.ini`, `alembic/env.py`, `alembic/versions/7fef1b86c011_initial.py`, `api/models/user.py`

### Steps performed

1. **Ran `alembic init alembic`** → generated scaffolding (ini, env.py, versions/, script.py.mako)

2. **Configured `alembic/env.py`:**
   - Loads `.env` via `dotenv`
   - Reads `POSTGRES_URL` from environment, injects it as `sqlalchemy.url` at runtime
   - Imports `Base` from `api.db.session` and all models (`Complaint`, `User`) for `--autogenerate` support
   - Sets `target_metadata = Base.metadata`

3. **Configured `alembic.ini`:**
   - `prepend_sys_path = .` — ensures project root is on path
   - `sqlalchemy.url` set to a placeholder (`env.py` overrides at runtime)

4. **Created `api/models/user.py`:**
   - SQLAlchemy model matching the `users` table in `schema.sql`
   - Fields: id (UUID), email (unique, indexed), full_name, hashed_password, role, is_active, timestamps

5. **Generated initial migration:**
   - `alembic revision --autogenerate -m "initial"` → `alembic/versions/7fef1b86c011_initial.py`
   - Creates `users` table with unique email index
   - Complaints table not included (already exists in connected Neon DB) — correct for existing DBs

### Migration workflow

```
Schema change → edit model → alembic revision --autogenerate -m "name" → alembic upgrade head
```

### Vulnerability hardening

| Issue | Fix |
|-------|-----|
| Hardcoded `uccd:uccd_pass` in alembic.ini | Replaced with placeholder comment; runtime injection from env |



## TSK-1.4 — Makefile Development Commands

**File:** `Makefile` (31 lines, new)  
**Also:** `tests/__init__.py` (placeholder package)

### Targets

| Target | Command | Purpose |
|--------|---------|---------|
| `make up` | `docker compose up -d` | Start all 5 services in background |
| `make down` | `docker compose down` | Stop all services |
| `make logs` | `docker compose logs -f` | Tail live logs from all containers |
| `make build` | `docker compose build` | Rebuild the API image |
| `make seed` | `docker compose run --rm api python scripts/seed_demo.py` | Inject 16 demo complaints + run AI pipeline |
| `make test` | `docker compose run --rm api pytest tests/ -v` | Run test suite inside container |
| `make migrate` | `docker compose run --rm api alembic upgrade head` | Apply pending DB migrations |
| `make shell` | `docker compose run --rm api bash` | Open shell inside API container |
| `make clean` | `docker compose down -v` + pycache cleanup | Tear down volumes and clear caches |

---

## TSK-1.5 — Environment Variables Template

**File:** `.env.example` (39 lines, new)

### Variables covered

Every `os.getenv()` call across the entire codebase is represented:

| Category | Variables |
|----------|-----------|
| PostgreSQL (Neon cloud) | `POSTGRES_URL`, `POSTGRES_PASSWORD`, `POSTGRES_SSLMODE` |
| Redis | `REDIS_URL` (with auth), `REDIS_PASSWORD` |
| Kafka | `KAFKA_BOOTSTRAP_SERVERS` |
| JWT Auth | `SECRET_KEY`, `JWT_ALG`, `JWT_EXPIRES_MINUTES` |
| Groq AI | `GROQ_API_KEY` |
| Telegram Bot | `TELEGRAM_BOT_TOKEN`, `API_HOST` |
| Demo Users | `DEMO_SUPERVISOR_EMAIL/PASSWORD`, `DEMO_AGENT_EMAIL/PASSWORD`, `DEMO_COMPLIANCE_EMAIL/PASSWORD` |

### Design decisions

- Default `POSTGRES_URL` uses a Neon-style connection string with `sslmode=require`, with inline comments explaining the local Docker alternative
- Redis URL includes authentication credentials matching the compose-set password
- Demo passwords set to `change-me` (not `password`) with a security warning for production use

---

## Files Changed Summary

| File | Action | Lines |
|------|--------|-------|
| `docker-compose.yml` | Modified | 20 → 105 |
| `db/schema.sql` | Created | 66 |
| `alembic.ini` | Created + edited | 116 |
| `alembic/env.py` | Created + edited | 82 |
| `alembic/versions/7fef1b86c011_initial.py` | Generated | 42 |
| `alembic/script.py.mako` | Generated | 26 |
| `alembic/README` | Generated | 1 |
| `api/models/user.py` | Created | 22 |
| `Makefile` | Created | 31 |
| `.env.example` | Created | 39 |
| `tests/__init__.py` | Created | 0 |