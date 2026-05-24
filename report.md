# Codebase Audit Report — UCCD Project

Audited all accessible files under `D:\UCCD` on 2026-05-24.  
Findings are grouped by severity: **Critical**, **High**, **Medium**, **Low**.

---

## 🔴 Critical

### 1 — `orchestrator.py` · `run_pipeline()` calls async `pipeline.invoke()` synchronously (will crash)
**File:** `agents/orchestrator.py`, line 182  
**Details:** `run_translation` was converted to `async def` and now uses `await svc.translate(...)`. LangGraph auto-detects async nodes — registering an `async def` node means `pipeline.invoke(initial_state)` now requires an `await` and must be called as `await pipeline.ainvoke(initial_state)`. The current synchronous call `return pipeline.invoke(initial_state)` will throw a `RuntimeError` / `asyncio.CoroutineNotAwaitWarning` at runtime. The fix is to make `run_pipeline` async and call `pipeline.ainvoke()`, and update every caller (currently `complaints.py` line 65, which uses `background_tasks.add_task(run_pipeline, ...)`) to provide a proper event-loop bridge when running in a sync `BackgroundTasks` thread.

---

### 2 — `telegram_bot.py` · `start_telegram_bot()` called from async `lifespan()` without awaiting (will crash at startup)
**File:** `services/telegram_bot.py`, line 12 / `api/main.py`, line 25  
**Details:** `start_telegram_bot()` is a synchronous blocking function that spawns daemon threads, but `Telegram Bot` blocks on startup if the network is not immediately reachable. In `main.py` line 25, `start_telegram_bot()` is called synchronously inside the async `lifespan()` context manager — this is fine because it's not an async function, but it blocks the event loop startup while the function completes. If `start_telegram_bot` had any network I/O it would be disastrous; as written it just spawns a thread, so it's currently safe but structurally fragile.

---

### 3 — `translate_preview()` / `run_translation` can raise `KeyError` on failed translation
**File:** `api/routes/ai.py`, lines 32-34 + `agents/orchestrator.py`, lines 31-35  
**Details:** Both callers directly index `result["translated_text"]`, `result["detected_language"]`, `result["translation_status"]` without guarding against the service returning an incomplete dict. When `SarvamTranslationService.translate()` hits a 4xx error (auth failure, bad model name), `_call_sarvam` raises an `HTTPError` via `raise_for_status()`. The outer `try/except` in `translate()` correctly handles 5xx and fallback paths, but for 4xx responses the `except` block does **not** return a "failed" status dict — it directly falls through to the `stg in (DRAFT, REPORT)` or final `logger.error` path, so the return dict is always complete. This is not a crash bug, but it is incorrect behavior: a 4xx translation error returns `{"translated_text": text, ...}` which silently masks the failure. More critically, in `translate_preview`/`run_translation` the `await svc.translate(...)` call itself is **not** wrapped in a `try/except`, so any unhandled exception from the HTTP layer will propagate as an unhandled 500 from the route rather than a meaningful error response.

---

### 4 — `broadcast_event()` uses `asyncio.get_running_loop()` / `asyncio.run()` with potential `RuntimeError` double-call
**File:** `api/websocket.py`, lines 25-33  
**Details:** `broadcast_event()` is called from synchronous contexts (routes, schedulers, background threads) and uses `try: loop = asyncio.get_running_loop(); loop.create_task(...)` / `except RuntimeError: asyncio.run(...)`. In `check_all_sla` (called by the scheduler every 60s), `fire_sla_alert()` → `broadcast_event()` is called where an APScheduler job may run inside a thread pool. If a previous coroutine hasn't completed, `asyncio.run()` will throw `RuntimeError: event loop already running`, which propagates up unhandled in `check_all_sla`. Suggested fix: use a dedicated queue + worker coroutine pattern, or `asyncio.get_event_loop().run_until_complete()` with proper loop detection.

---

### 5 — `run_pipeline()` called via `BackgroundTasks.add_task()` after async node conversion is broken
**File:** `api/routes/complaints.py`, lines 64-72
**File:** `services/telegram_bot.py`, lines 150-160  
**Details:** Both callers schedule `run_pipeline` using `background_tasks.add_task(run_pipeline, ...)` (a synchronous FastAPI `BackgroundTasks` call) or by spawning a plain `threading.Thread(target=run_pipeline, ...)`. After `run_translation` was made async and `run_pipeline` must be made async (see issue 1), these callers will both crash because `BackgroundTasks` and `threading.Thread` cannot directly await async functions. `background_tasks.add_task()` silently ignores the result; `threading.Thread(target=run_pipeline, ...)` calls `run_pipeline()` without awaiting `pipeline.ainvoke()`, which will raise `RuntimeWarning: coroutine was never awaited`. The entire complaint ingestion pipeline will silently fail for both web and Telegram channels.

---

## 🟠 High

### 6 — `nlp_classifier.py` · `classify_complaint()` has no type annotations
**File:** `agents/nlp_classifier.py`, line 8  
**Details:** `def classify_complaint(text:str):` has no return type. Every other LangGraph node in `orchestrator.py` returns `dict`, so the type contract should be explicit: `def classify_complaint(text: str) -> dict:`. This matters downstream because `run_nlp` (line 37-46) passes its result through as state fields; without type hints, static analysis and IDE tooling cannot verify correctness.

---

### 7 — `emotion_agent.py` · original empty strings use `"Neutral"` but state TypedDict uses `Optional[str]` — inconsistent null semantics
**File:** `agents/emotion_agent.py`, line 45 / `agents/state.py`, line 18  
**Details:** `emotion_arc` is typed as `Optional[dict]` in `ComplaintState`, but the agent always returns a full `emotion_arc` dict (never `None`). Meanwhile, `severity_agent.py` line 80 accesses `emotion_arc.get("intensity", 5) if isinstance(emotion_arc, dict) else 5`, meaning once any other agent (or manual state construction) sets `emotion_arc = None`, the pipeline silently substitutes intensity 5 without logging it. The contract should be clarified: either `emotion_arc` is always a dict (remove `Optional`) or every consumer must handle `None`.

---

### 8 — `orchestrator.py` · `from agents.utils import groq_chat_completion` inside try block
**File:** `agents/orchestrator.py`, line 93  
**Details:** `from agents.utils import groq_chat_completion` is an inline import inside the `if not ai_draft:` block of `merge_and_save`. This means if the `agents` package is not importable at runtime (e.g., running just `orchestrator.py` as a script or circular import), the import will raise `ModuleNotFoundError` unpredictably at runtime rather than at module load time. Move this import to the top of the file. Same pattern also appears in `complaints.py` line 246: `from services.sla_service import clear_sla` is inline.

---

### 9 — `complaints.py` · `GET /api/1/complaints` and `GET /api/1/complaints/{complaint_id}` share same `prefix` but different paths — no API guard on `/respond` or `/status` endpoints
**File:** `api/routes/complaints.py`, lines 221-248  
**Details:** The `respond_and_resolve_complaint` endpoint (`POST /api/v1/complaints/{complaint_id}/respond`) has **no authentication dependency** — any unauthenticated caller can mark any complaint as resolved. Every other state-changing endpoint in `complaints.py` (`update_complaint_status`, `generate_response_draft`) also lacks `Depends(get_current_user)` (or equivalent), but the `/respond` endpoint is the most sensitive since it modifies `resolution_notes`, `status`, and `resolved_at`.

---

### 10 — `complaints.py` · `pipeline.invoke()` call contracts with `run_pipeline()` signature mismatch after async change
**File:** `api/routes/complaints.py`, line 65 / `agents/orchestrator.py`, line 182  
**Details:** After the async conversion, `pipeline.invoke()` on line 182 returns a coroutine. The caller at line 65 uses `background_tasks.add_task(run_pipeline, ...)`, which doesn't do `await`. This means the entire AI pipeline (translation → NLP → emotion → DNA → severity → escalation → root-cause → DB save) silently never runs for complaints submitted via the REST API. The `BackgroundTasks` scheduler in FastAPI does not support async callbacks without an explicit bridge.

---

### 11 — `safe_parse_json` in `utils.py` · silent suppression of malformed pipeline data
**File:** `agents/utils.py`, lines 56-90  
**Details:** `safe_parse_json` uses a bare `except Exception: return {}` fallback via `ast.literal_eval`. If a LLM returns a Python dict with single quotes (e.g. `'type': 'fraud'`), `json.loads` fails and `ast.literal_eval` succeeds — converting it to a Python dict. However, if both approaches fail, or if the LLM returns a **list** instead of a dict (e.g., for multi-label classification), the function silently returns `{}`, causing missing fields to fall through to hardcoded defaults without any warning log. The caller functions have no indication the parsing failed. Log a warning on the fallback path.

---

### 12 — `_get_client()` in `translation_service.py` · creates new HTTP client on first call without explicit close
**File:** `services/translation_service.py`, lines 30-40  
**Details:** `_get_client` lazily initialises `httpx.AsyncClient` and never closes it (`close()` is never called anywhere in the file). This is a resource leak: the open TCP connection pool and any session cookies remain held for the lifetime of the `SarvamTranslationService` instance. If the service is instantiated per-request (as currently done in `ai.py`, `complaints.py`, `orchestrator.py`), clients accumulate over time. Add `aclose()` in a `close()` method or use a context-manager pattern, or share a single global client via `httpx.AsyncClient` singleton.

---

## 🟡 Medium

### 13 — `nlp_classifier.py` · `dotenv.load_dotenv()` called at module import time
**File:** `agents/nlp_classifier.py`, line 6  
**Details:** `load_dotenv()` is invoked at module level. If any module imports `agents.nlp_classifier` before the app sets the working directory to the project root, `.env` is not found silently. All `os.getenv()` calls then fall through to system environment variables. No error is raised, so the defect is invisible at startup. Only the first file that imports a `dotenv`-using module actually triggers the load; subsequent cases are silent no-ops. This is fine in a normal single-process FastAPI server, but in multi-process or Celery/worker setups the `.env` may not be loaded in worker processes.

---

### 14 — `complaints.py` · `Groq` client instantiated per-request in `generate_response_draft()`
**File:** `api/routes/complaints.py`, line 173  
**Details:** `client = Groq(api_key=os.getenv("GROQ_API_KEY"))` creates a brand-new HTTP client pool on every draft-generation request. Unlike `utils.get_groq_client()` (which caches `_groq_client` globally), this creates a new TCP pool every time. For a low-traffic demo server this is acceptable, but under load it will exhaust file descriptors. Prefer `utils.get_groq_client()` for consistency and connection reuse.

---

### 15 — `orchestrator.py` · `validate_imports` linter triggers on noqa
**File:** `agents/orchestrator.py`, line 4  
**Details:** The import statement has a spacing inconsistency: `from langgraph.graph import StateGraph, START , END`. The space before the comma after `START` is cosmetic but is a lint negligence — all other imports trim spaces around commas. No functional impact.

---

### 16 — `sla_service.py` · `alert_` keys assumed to exist with no default in `get_sla_status()`
**File:** `services/sla_service.py`, lines 129-131  
**Details:** `get_sla_status()` accesses `meta["alert_50"]`, `meta["alert_75"]`, `meta["alert_90"]` without defaults. These keys are written by `set_sla_timer()`, so under normal flow they always exist. However, if `sla_meta:{id}` was written by a manually constructed `hset()` call that omitted any key, `get_sla_status()` would raise a `KeyError`. The safer pattern is `meta.get("alert_50", "0")`.

---

### 17 — `sla_service.py` · `start_telegram_bot` post-launch print messages and missing `logging` import
**File:** `services/telegram_bot.py`, lines 18, 23, 28, 39, 70, 85, 98, 102, 106, 163  
**Details:** The entire file uses raw `print()` statements for logging (7 distinct locations). There is no `import logging` or `logger`. All output goes to `stdout` regardless of the configured log level. This means deployment logs from this service are never filterable by severity (INFO/WARNING/ERROR). Under the pre-existing logging refactor guidance, all print statements need to be converted to `logger.info/warning/error`.

---

### 18 — `analytics.py` · `list_escalated_complaints` filtered with `= False` uses Python boolean, not SQL `false`
**File:** `api/routes/complaints.py`, line 108  
**Details:** The query `(Complaint.breach_probability > 0.70) & (Complaint.status != "resolved")` will work correctly since `breach_probability` is a Python/Postgres `Float`. However, SQLAlchemy may serialize Python `True`/`False` differently from a literal SQL `'false'` when using `complaint.sla_breached == True` (Python `True`). For explicit clarity, use `Complaint.sla_breached.is_(True)` instead of `== True`.

---

### 19 — `history.py` · `ComplaintResponse` schema is missing `attachments` and `voice_transcript` fields
**File:** `api/schemas/complaint.py`, lines 17-52 / `api/models/complaint.py`, lines 25-24  
**Details:** The `Complaint` model has two columns — `attachments` (JSONB) and `voice_transcript` (JSONB) — that are **not** present in the `ComplaintResponse` Pydantic schema (which has `from_attributes=True`). In Pydantic V2 with `ConfigDict(from_attributes=True)`, fields not declared in the schema are silently excluded from the response. Any consumer requesting a complaint object via the REST API will never receive `attachments` or `voice_transcript` data, even though it is stored in the database. These fields should be added to `ComplaintResponse`.

---

### 20 — `slack_analytics.py` · `alert_` keys assumed to exist in `get_sla_status()`
**File:** `services/sla_service.py`, lines 129-131  
**Details:** (This is the same as #16 — `get_sla_status` assumes `meta["alert_50"]`, `meta["alert_75"]`, `meta["alert_90"]` always exist in the hset hash. If any key is missing a `KeyError` is raised at runtime which is not caught by the caller. Add `.get()` defaults.)

---

### 21 — `telegram_bot.py` · `api_host` and `TELEGRAM_BOT_TOKEN` read with no validation after first None check
**File:** `services/telegram_bot.py`, lines 113-115  
**Details:** After `token = os.getenv("TELEGRAM_BOT_TOKEN")` is set to `None` at line 23 (disabled bot), the code later at line 113 uses `f"https://api.telegram.org/bot{token}"` inside `save_fallback_db()`. Because `start_telegram_bot()` returns early on line 19 when the token is absent, `save_fallback_db` is never called. However, if `save_fallback_db` is later called directly or if `token` is empty string, the Telegram API will respond with `403 Forbidden`, which will be caught and ethered. The guard is redundant but not harmful.

---

## 🔵 Low

### 22 — `state.py` · `ComplaintState` uses `total=False` with many `Optional` fields — hard to debug missing keys at type-check time
**File:** `agents/state.py`, line 4  
**Details:** `class ComplaintState(TypedDict, total=False)` means *all* fields are implicitly `Optional`, and the explicit `Optional[str]` annotations on each field are redundant. A `TypedDict` with `total=False` should only annotate the fields with their concrete types and mark fields that truly can be missing; every key here is treated as optional regardless of the annotation. For more precise type checking, either change to `total=True` and mark only genuinely-absent fields with `NotRequired`, or keep `total=False` but stop annotating `Optional` (which conveys nothing extra). Also `line 18: emotion_arc : Optional[dict]` — all other `dict` fields use plain `dict`, this is inconsistent.

---

### 23 — `complaints.py` · `bot_slots: Optional[dict] = None` default for mutable type
**File:** `api/schemas/complaint.py`, line 14  
**Details:** `bot_slots: Optional[dict] = None` uses `None` as default so it's safe per se. However, the `ComplaintCreate` model at line 28 uses `**complaint.model_dump()` to expand into `Complaint()` constructor, so `bot_slots=None` passes `None` to the SQLAlchemy model which expects `JSONB`. SQLAlchemy will store SQL `NULL`, which is fine for a nullable column, but FastAPI serialises `None` in JSON as `null` rather than `{}` — consistent, just worth noting.

---

### 24 — `complaints.py` · `complaints/` prefix conflict: two routers using the same path prefix
**File:** `api/routes/complaints.py`, line 22 / `api/routes/history.py`, line 6  
**Details:** Both routers use `prefix="/api/v1/complaints"`. FastAPI does allow overlapping prefixes across different `include_router()` calls, but as the router list grows this increases the risk of path collisions. Notably `GET /api/v1/complaints` (list) and `GET /api/v1/complaints/{complaint_id}/history` are distinguishable, but any future route added to either router could silently shadow another endpoint. Better to namespace the history router under a distinct sub-path (e.g., `prefix="/api/v1/complaints/history"`).

---

### 25 — `telegram_bot.py` · `chat_id` typed as `int` from JSON but persisted in DB as `str`
**File:** `services/telegram_bot.py`, line 49 / `api/models/complaint.py`, line 15  
**Details:** Telegram API returns `chat.id` as a JSON number, so Python deserialises it as `int`. The code converts it to `str` before saving to the database (`source_ref=str(chat_id)`, line 81). In `complaints.py` line 122 & 256, `complaint.source_ref` is then a `str`, and in WhatsApp/Telegram notification code at line 256 the check `complaint.source_ref` is truthy for both `None` and empty string, but a non-empty `str("0")` is also truthy. No immediate bug, but the inconsistent type between JSON `int` → DB `str` → code `str` warrants a clarifying comment to prevent a future developer from passing the raw JSON `chat_id` (int) back to Telegram API as `chat_id`.

---

### 26 — `auth.py` · `DEMO_SUPERVISOR_PASSWORD` set to `"Test@123"` in `.env` — weak credentials in `_demo_users()`
**File:** `api/routes/auth.py`, lines 31-43 / `.env`, lines 16-20  
**Details:** The `_demo_users()` dict at lines 30-43 derives passwords from `os.getenv("DEMO_SUPERVISOR_PASSWORD", "password")`. The default fallback is `"password"` and the `.env` sets all three passwords to `"Test@123"`, which appears in the repo `.env` (not `.env.example`). Any developer with access to the repo can see the actual credentials. Since the `src` is committed to VCS, this is a security exposure. At minimum guard this with a `secrets_manager vault =` check. Best practice: do not store any live credentials in files committed to source control.

---

### 27 — `agents/nlp_classifier.py` · `dotenv.load_dotenv()` invoked multiple times in different modules without centralised loading
**File:** `agents/nlp_classifier.py`, line 6 / `agents/emotion_agent.py`, line 7 / `agents\dna_agent.py`, line 10 / `agents\severity_agent.py`, line 10 / `agents\escalation_agent.py`, line 9  
**Details:** All five agent files call `from dotenv import load_dotenv` and invoke `load_dotenv()` at module level independently. While `dotenv.load_dotenv()` is idempotent and only loads `.env` once, calling it at the top of 5 separate modules is an architectural smell. If `.env` isn't in `sys.path` relative to a worker's import root (as can happen in Docker or ASGI worker-process spawning), the first module loaded may initialise `os.environ` correctly; later processes or sub-modules may start with empty env vars. Fix: call `load_dotenv()` once in `api/main.py` or in a central `api/__init__.py` and remove from all agent files.

---

### 28 — `db/session.py` · `autocommit=False, autoflush=False` — silent `update()` changes not auto-flushed
**File:** `api/db/session.py`, line 17  
**Details:** `sessionmaker(autocommit=False, autoflush=False, bind=engine)` disables autoflush. In SQLAlchemy, autoflush automatically issues pending INSERT/UPDATE/DELETE statements before executing a SELECT. With `autoflush=False`, any `db.query(Complaint)` called after modifying the session (but before `db.commit()`) will return stale results. Already used correctly everywhere (all updates are followed by `db.commit()`), but is a footgun for future maintainers adding queries between mutations and commits.

---

### 29 — `orchestrator.py` · `load_dotenv()` in `nlp_classifier.py` is just called but `orchestrator.py` itself doesn't call `load_dotenv()`
**File:** `agents/orchestrator.py`  
**Details:** `orchestrator.py` does not call `load_dotenv()`. It depends on `dotenv` being called from whatever module first imports it. In a normal FastAPI startup, `orchestrator.py` is imported by `complaints.py`, which in turn will trigger `nlp_classifier.py`'s `load_dotenv()` eventually. But if `orchestrator.py` is imported as a standalone script (e.g., `python agents/orchestrator.py`), no `.env` will be loaded and `os.getenv("SARVAM_ACCESS_TOKEN")` in the service will be `None`. Add `load_dotenv()` at script-level.

---

### 30 — `analytics.py` · `date_trunc` uses database-specific function
**File:** `api/routes/analytics.py`, line 28  
**Details:** `func.date_trunc('day', Complaint.created_at)` is a PostgreSQL-specific function. If the project ever adds support for a different database engine (e.g., SQLite for local/dev, or MySQL), this query will throw `ArgumentError: Could not locate column 'day'`. Guard with dialect detection or use a SQLAlchemy-agnostic approach for day-truncating.

---

### 31 — `complaints.py` · `pipeline.invoke(initial_state)` in `run_pipeline` — missing await after event loop rework
**File:** `agents/orchestrator.py`, line 182  
**Details:** `run_pipeline()` is synchronous and calls `pipeline.invoke()`. After the `run_translation` async conversion, `pipeline.invoke()` will return a coroutine that must be `await`ed. The fix is to make `run_pipeline` async, or call `asyncio.run(pipeline.ainvoke(initial_state))` — the latter being safer for the sync callers in `BackgroundTasks` and `threading.Thread`. Since `BackgroundTasks` and `threading.Thread` are both *synchronous* contexts, `asyncio.run()` is the correct bridge there.

---

### 32 — `orchestrator.py` line 4 · space in `START , END` import
**File:** `agents/orchestrator.py`, line 4  
**Details:** Python syntax allows `START , END` (with the leading space before the comma), but it is invalid per PEP 8 and may cause confusion in code review. Every other import in the project uses compact comma notation (`import X, Y`). Fix: `from langgraph.graph import StateGraph, START, END`.

---

### 33 — `translation_service.py` · `payload` dict uses `**route` order — `source_lang` can override `target_lang` awkwardly
**File:** `services/translation_service.py`, lines 117-120  
**Details:** `payload = {"input": text, **route}` — if `route` is generated from `_route()`, it includes both `source_lang` and `target_lang`. If `translate()` was called with `source_lang="en-IN"` and `target_lang="hi-IN"`, both are set in `route`. However, the spread `**route` will always set `source_lang` to whatever `_route()` placed in it. The explicit overrides on lines 112-115 come after, so they do overwrite. This is fine now but is fragile — a maintainer who adds a third parameter to `_route()` could accidentally shadow a callback parameter. Safer: build payload as `payload = {"input": text, "source_lang": ..., "target_lang": ..., "model": route["model"], ...}`.

---

### 34 — `telegram_bot.py` · `GROQ_API_KEY` imported only in `complaints.py` but Telegram bot doesn't fail gracefully if missing
**File:** `services/telegram_bot.py`, line 114  
**Details:** `save_fallback_db()` has no `try/except` around `Groq`-related calls because it doesn't use Groq. However, `initialize_redis()` will print a `Failed to connect` message to `stdout` at startup if `REDIS_URL` is not reachable (line 67, 78) and silently falls back to `MockRedis`. The fallback is intentional, but the print statement means operators see "Failed to connect" and think the entire app failed, when the app continued with in-memory storage. Replace the print with an appropriate logger call.

---

## ⬛ Low / Informational

### 35 — `nlp_classifier.py` · `safe_parse_json` at line 45 — fallback dict silently applied on parse failure
**File:** `agents/nlp_classifier.py`, lines 42-55  
**Details:** If the LLM returns unparseable text, `fallback` is silently applied with `"complaint_type": "other"`, `"type_confidence": 0.0`, and `None` for other fields. Downstream, `orchestrator.py` `run_nlp` returns `None` for `product_code`, `intent`, and `regulatory_obligation` — these `None`s will propagate to `orchestrator.py` state without any flag, making post-hoc analysis harder. Not a crash, but reduces observability. Log a `logger.warning` when the fallback is triggered.

---

### 36 — `docker-compose.yml` · `API_HOST=http://localhost:8000` hardcoded, but `docker-compose.yml` exposes port 8888
**File:** `docker-compose.yml`, line 61 / `services/telegram_bot.py`, line 76  
**Details:** The `api` service publishes port `8888:8000`, so the host-facing URL is `http://localhost:8888`. The `.env.example` sets `API_HOST=http://localhost:8000`, and `telegram_bot.py` defaults to `os.getenv("API_HOST", "http://localhost:8000")`. When running inside Docker Compose, `API_HOST` is set to `http://localhost:8000` which is wrong — inside the container this should point to the container IP or service name (which it does via `.env`), but the `.env.default` misleads local development between Docker and host-mode operation.

---

### 37 — `alembic.ini` · `sqlalchemy.url` hard-coded as `postgresql://user:pass@localhost:5432/dbname` (placeholder in committed file)
**File:** `alembic.ini`, line 65  
**Details:** This is the fallback connection string intended to be overridden at runtime by `POSTGRES_URL` (set in `alembic/env.py` line 17). If a developer runs `alembic upgrade head` without `POSTGRES_URL` set, it connects to the placeholder URL and fails with an obscure `psycopg2.OperationalError: connection to server on socket ... failed`. A startup `raise` in `env.py` would be clearer than silently falling into a broken placeholder. The current code does **not** raise — it silently sets the placeholder URL.

---

### 38 — `seed_demo.py` · `Base.metadata.create_all()` called directly — bypasses Alembic for schema creation
**File:** `scripts/seed_demo.py`, line 132  
**Details:** `Base.metadata.create_all(bind=engine)` creates all tables as defined in the SQLAlchemy ORM models, bypassing Alembic migrations. If any column definition differs between `complaint.py` model and the latest alembic migration, `seed_demo.py` silently uses the *model* definition while production uses the *alembic* definition. This divergence is a common source of "works locally but not in production" bugs. Use `alembic upgrade head` before seeding instead.

---

### 39 — `sla_service.py` · `set_sla_timer()` / `get_sla_status()` / `check_all_sla()` — `sla_tier` parameter not validated against `TIER_HOURS`
**File:** `services/sla_service.py`, lines 95-110, 155-193  
**Details:** `set_sla_tier` accepts any arbitrary `sla_tier` string. If `sla_tier="VIP_SPECIAL"` is passed, `TIER_HOURS.get(sla_tier, 72)` silently defaults to 72, but `get_sla_status()` and the alert threshold logic (`percentage_elapsed`, SLA breach calculation) will use a deadline calculated against 72 hours while the UI may display `"VIP_SPECIAL"` — creating an inconsistent SLA expectation. Add validation: `if sla_tier not in TIER_HOURS: raise ValueError(...)`.

---

### 40 — `sla_service.py` · `clear_sla()` + subsequent `get_sla_status()` call inside `check_all_sla` can double-fire `BREACHED`
**File:** `services/sla_service.py`, lines 176-192  
**Details:** When `ttl == -2`, `fire_sla_alert(complaint_id, "BREACHED")` is called, then `clear_sla()` deletes all `sla:*` keys. But `fire_sla_alert` itself is `async` and `clear_sla()` is `sync`. The alert is fired via `loop.create_task()` on the running loop. If `loop.create_task()` raises (because there is no running loop at scheduler time), the call to `clear_sla()` still proceeds. If the `xs` call in `check_all_sla()` then iterates another complaint, the same complaint ID could be hit again if the Redis TTL hasn't expired. This is a race that can produce duplicate "BREACHED" WebSocket events for the same complaint.

---

## Summary Table

| # | File | Severity | Category |
|---|------|----------|----------|
| 1 | `agents/orchestrator.py` | 🔴 Critical | Async/Sync crash |
| 2 | `services/telegram_bot.py` + `api/main.py` | 🔴 Critical | Startup blocking |
| 3 | `api/routes/ai.py`, `agents/orchestrator.py` | 🔴 Critical | KeyError on error path |
| 4 | `api/websocket.py` | 🔴 Critical | Event loop race |
| 5 | `api/routes/complaints.py`, `services/telegram_bot.py` | 🔴 Critical | Async pipeline silent failure |
| 6 | `agents/nlp_classifier.py` | 🟠 High | Missing type hints |
| 7 | `agents/emotion_agent.py`, `agents/state.py` | 🟠 High | Null semantics inconsistency |
| 8 | `agents/orchestrator.py`, `api/routes/complaints.py` | 🟠 High | Inline imports |
| 9 | `api/routes/complaints.py` | 🟠 High | Missing auth on state-changing endpoint |
| 10 | `api/routes/complaints.py` | 🟠 High | Pipeline not awaited |
| 11 | `agents/utils.py` | 🟠 High | Silent JSON parse failure |
| 12 | `services/translation_service.py` | 🟠 High | HTTP client resource leak |
| 13 | `agents/nlp_classifier.py` (+4 agents) | 🟡 Medium | `load_dotenv` at module level |
| 14 | `api/routes/complaints.py` | 🟡 Medium | Per-request Groq client |
| 15 | `agents/orchestrator.py` | 🟡 Medium | spacing in import |
| 16 | `services/sla_service.py` | 🟡 Medium | No default in `meta[]` access |
| 17 | `services/telegram_bot.py` | 🟡 Medium | All `print()` instead of logging |
| 18 | `api/routes/complaints.py` | 🟡 Medium | `== True` vs `.is_(True)` |
| 19 | `api/schemas/complaint.py` / `api/models/complaint.py` | 🟡 Medium | Missing fields in response schema |
| 20 | `services/sla_service.py` | 🟡 Medium | Duplicate issue — unguarded `meta[]` |
| 21 | `services/telegram_bot.py` | 🟡 Medium | Redundant second env check |
| 22 | `agents/state.py` | ⬛ Low | `total=False` + redundant Optional|
| 23 | `api/schemas/complaint.py` | ⬛ Low | `Optional[dict]` default: None is safe here |
| 24 | `api/routes/complaints.py` + `api/routes/history.py` | ⬛ Low | Shared prefix risk |
| 25 | `services/telegram_bot.py` | ⬛ Low | `chat_id` int→str inconsistency |
| 26 | `api/routes/auth.py` + `.env` | ⬛ Low | Hardcoded production credentials committed |
| 27 | `agents/` (all agent files) | ⬛ Low | 5x `load_dotenv()` calls |
| 28 | `api/db/session.py` | ⬛ Low | `autoflush=False` footgun |
| 29 | `agents/orchestrator.py` | ⬛ Low | No local `load_dotenv()` |
| 30 | `api/routes/analytics.py` | ⬛ Low | DB-specific `date_trunc` |
| 31 | `agents/orchestrator.py` | ⟢ Info | `in` + `START , END` spacing |
| 32 | `services/translation_service.py` | ⬛ Low | `payload` spread order fragility |
| 33 | `alembic.ini` | ⬛ Low | Placeholder DB URL in committed config |
| 34 | `docker-compose.yml` | ⬛ Low | Port mismatch in example `.env` |
| 35 | `agents/nlp_classifier.py` | ⬛ Low | Silent LLM parse fallback |
| 36 | `scripts/seed_demo.py` | ⬛ Low | ORM create bypasses Alembic |
| 37 | `services/sla_service.py` | ⬛ Low | No SLA tier validation |
| 38 | `services/sla_service.py` | ⬛ Low | Race: double BREACHED alert |

---

*Report generated by static scan of all `.py`, `.yml`, `.ini`, and `.env` files in the repository.*
