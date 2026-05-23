# UCCD — Progress Checklist vs Roadmaps

Checklist derived from each person’s roadmap HTML in `Roadmaps/` and verified against the repo (`api/`, `agents/`, `services/`, `scripts/`, `docker-compose.yml`).  
Legend: `[x]` completed in codebase · `[ ]` pending / draft / incomplete

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

- [ ] `services/draft_service.py` — separate file pending (draft logic inline in `api/routes/complaints.py` {line 166})
- [x] `GET /api/v1/ai/draft/{complaint_id}` — `GET /api/v1/ai/draft/{complaint_id}` in `api/routes/ai.py:30` — delegates to complaints route handler
- [x] `POST /api/v1/complaints/{id}/respond` — final response + edit delta + resolve (`api/routes/complaints.py:201`); also stored in `respond_and_resolve_complaint()`
- [x] `api/websocket.py` — `ConnectionManager`, `ws://.../api/v1/ws/supervisor`, `broadcast_event()`
- [ ] WebSocket message types exactly as roadmap (`sla_exceed_predicted`, `sla_exceed_occurred`, `cluster_spike`, `agent_overload`); `sla_exceed_occurred` is implemented on TTL expiry (`sla_alert` type in `sla_service.py:178`); `new_complaint`, `complaint_status_changed`, `sla_alert` (50/75/90%) also present — `sla_exceed_predicted`, `cluster_spike`, `agent_overload` still pending


### Week 5 — Remaining API surface

- [x] `PUT /api/v1/complaints/{id}/status` with transition validation (roadmap rules differ slightly; repo has explicit `VALID_TRANSITIONS`)
- [x] `GET /api/v1/agents/load` (`api/routes/agents.py`) — active load by department + agent
- [x] `GET /api/v1/analytics/trends`(`?window=…`) — daily volume + category dist + avg severity + SLA compliance
- [x] `POST /api/v1/simulation/run` — policy simulation (staffing, volume, policy mode)
- [x] `GET /api/v1/complaints/{id}/history` — audit timeline events for complaint
- [x] `GET /api/v1/ai/translate-preview` — Groq-based multi-language translation (`api/routes/ai.py:10`)
- [x] CORS `allow_origins` includes `http://localhost:3000` AND `http://localhost:5173` (`api/main.py:31`)
- [ ] `scripts/seed_demo.py` — as per Abhineet Week 6 / Pritesh Week 6 roadmap
