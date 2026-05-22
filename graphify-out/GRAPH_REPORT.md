# Graph Report - .  (2026-05-12)

## Corpus Check
- 77 files · ~57,033 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 222 nodes · 310 edges · 21 communities (19 shown, 2 thin omitted)
- Extraction: 82% EXTRACTED · 17% INFERRED · 0% AMBIGUOUS · INFERRED: 54 edges (avg confidence: 0.88)
- Token cost: 15,200 input · 7,800 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Architecture & Frontend Layers|Architecture & Frontend Layers]]
- [[_COMMUNITY_Infrastructure & Deployment|Infrastructure & Deployment]]
- [[_COMMUNITY_AI Triage Intelligence|AI Triage Intelligence]]
- [[_COMMUNITY_Agent Pipeline Execution|Agent Pipeline Execution]]
- [[_COMMUNITY_Omnichannel Ingestion|Omnichannel Ingestion]]
- [[_COMMUNITY_Complaint API & WebSocket|Complaint API & WebSocket]]
- [[_COMMUNITY_Dashboard & Intelligence|Dashboard & Intelligence]]
- [[_COMMUNITY_Auth & API Models|Auth & API Models]]
- [[_COMMUNITY_NLP & Kafka Integration|NLP & Kafka Integration]]
- [[_COMMUNITY_Team Roadmaps|Team Roadmaps]]
- [[_COMMUNITY_Complaint State Schema|Complaint State Schema]]
- [[_COMMUNITY_System Data Flow Diagram|System Data Flow Diagram]]

## God Nodes (most connected - your core abstractions)
1. `Layer 2: AI Triage Engine (Multi-Agent)` - 13 edges
2. `Normalisation and Event Bus` - 13 edges
3. `Layer 1: Omnichannel Ingestion` - 9 edges
4. `Layer 3: 360 Degree Complaint Core` - 9 edges
5. `Layer 4: Gen-AI Response and Intelligence` - 9 edges
6. `FastAPI main.py` - 8 edges
7. `Layer 5: Dashboard Surfaces` - 7 edges
8. `LangGraph Workflow` - 7 edges
9. `Resolution Graph Module` - 7 edges
10. `Knowledge Store Module` - 7 edges

## Surprising Connections (you probably didn't know these)
- `get_complaint_sla()` --calls--> `get_sla_status()`  [INFERRED]
  api/routes/complaints.py → services/sla_service.py
- `LangGraph Workflow` --implements--> `AI Agent Swarm Architecture`  [INFERRED]
  flowchart.md → Documentation/idea.md
- `similarity_search/ (FAISS)` --implements--> `Complaint DNA (Dedup + Cluster)`  [INFERRED]
  flowchart.md → Documentation/web.md
- `escalation_agent.py` --implements--> `Predictive Escalation (Novel)`  [INFERRED]
  flowchart.md → Documentation/web.md
- `db/models.py (SQLAlchemy ORM)` --implements--> `360 Degree Complaint Record`  [INFERRED]
  flowchart.md → Documentation/web.md

## Hyperedges (group relationships)
- **Omnichannel Ingestion Pipeline (All Connectors to Event Bus)** — module_email_connector, module_social_connector, module_voice_connector, module_chatbot_connector, module_portal_connector, module_regulator_connector, module_normalisation_event_bus [EXTRACTED 1.00]
- **ML Processing Pipeline (Kafka to LangGraph)** — flowchart_kafka_base_consumer, flowchart_bhashini, flowchart_complaint_classifier, flowchart_similarity_search, flowchart_summarizer, flowchart_langgraph_workflow [EXTRACTED 1.00]
- **Agent Orchestration Layer (LangGraph + Router + Agents)** — flowchart_langgraph_workflow, flowchart_complaint_router, flowchart_escalation_agent, flowchart_status_tracker, flowchart_db_connection [EXTRACTED 1.00]
- **Layer 2 Core AI Triage Classification Pipeline** — nlp_classifier, emotion_engine, complaint_dna, severity_scorer [EXTRACTED 0.95]
- **Shared Neo4j Knowledge Graph Ecosystem** — root_cause_agent, resolution_graph, knowledge_store [EXTRACTED 0.95]
- **Omnichannel UCE Ingestion Pipeline** — regulator_connector, social_connector, voice_connector [EXTRACTED 0.95]
- **Regulatory Deadline Management Ecosystem** — regulatory_regulatory_compliance_module, sla_engine_sla_engine_module, regulatory_view_regulatory_view_dashboard [EXTRACTED 0.95]
- **AI-Assisted Agent Experience Pipeline** — draft_response_draft_response_module, agent_workspace_agent_workspace_dashboard, cognitive_load_cognitive_load_manager [INFERRED 0.85]
- **Strategic Forecasting and Analytics Ecosystem** — trend_analyst_trend_analyst_module, insights_board_insights_board_dashboard, simulation_simulation_sandbox [INFERRED 0.85]

## Communities (21 total, 2 thin omitted)

### Community 0 - "Architecture & Frontend Layers"
Cohesion: 0.11
Nodes (33): Layer 2: AI Triage Engine (Multi-Agent), Layer 3: 360 Degree Complaint Core, Layer 4: Gen-AI Response and Intelligence, Layer 5: Dashboard Surfaces, Architecture Overview, ComplaintDetail.tsx, SupervisorHQ.tsx, Frontend Experience Guide by Layer (+25 more)

### Community 1 - "Infrastructure & Deployment"
Cohesion: 0.09
Nodes (31): API Service Container, Redis Service (Cache), alembic/ (DB Migrations), audit_log.py, axios/api.ts, complaint_router.py, db/connection.py, db/models.py (SQLAlchemy ORM) (+23 more)

### Community 2 - "AI Triage Intelligence"
Cohesion: 0.11
Nodes (27): Amplification Risk Score - Social Influence Metric, Complaint DNA Module, Complaint DNA - Module 2.3 Summary, Complaint DNA Fingerprint - Semantic Vector Identity, Emotion Arc - Temporal Sentiment Trajectory, Emotion Engine Module, Emotion Engine - Module 2.2 Summary, Knowledge Store Module (+19 more)

### Community 3 - "Agent Pipeline Execution"
Cohesion: 0.12
Nodes (10): classify_complaint(), merge_and_save(), run_nlp(), run_root_cause(), get_db(), check_all_sla(), clear_sla(), fire_sla_alert() (+2 more)

### Community 4 - "Omnichannel Ingestion"
Cohesion: 0.18
Nodes (20): Layer 1: Omnichannel Ingestion, Chat/Bot Connector Technical Detail, Email Connector Technical Detail, Module 1.1 - Email (IMAP/SMTP), Module 1.2 - Social Media, Module 1.3 - Voice (STT + Diarization), Module 1.4 - Chat/Bot, Module 1.5 - Portal/App (+12 more)

### Community 5 - "Complaint API & WebSocket"
Cohesion: 0.12
Nodes (9): broadcast_event(), ConnectionManager, Allow sync contexts (routes, schedulers) to broadcast., supervisor_ws(), Base, Complaint, create_complaint(), get_complaint_sla() (+1 more)

### Community 6 - "Dashboard & Intelligence"
Cohesion: 0.14
Nodes (19): Agent Workspace Dashboard, Bayesian Skill Scoring for Agent Matching, Cognitive Load Manager, OR-Tools Constraint-Based Complaint Routing, Draft Response Module, RAG-Based Contextual Response Personalisation, Insights Board Dashboard, Append-Only Digitally Signed Audit Storage (+11 more)

### Community 7 - "Auth & API Models"
Cohesion: 0.23
Nodes (12): BaseModel, _demo_users(), _issue_token(), _jwt_secret(), login(), LoginRequest, LoginResponse, Minimal demo auth:     - Configure via env for quick frontend wiring.     - De (+4 more)

### Community 8 - "NLP & Kafka Integration"
Cohesion: 0.2
Nodes (12): translation/bhashini.py, complaint_classifier/, kafka/base_consumer.py, kafka/producer.py, Kafka Topic: complaint-intake, LangGraph Workflow, routers/agents.py, similarity_search/ (FAISS) (+4 more)

### Community 9 - "Team Roadmaps"
Cohesion: 0.31
Nodes (9): Roadmap Index, UCCD Progress Checklist, Abhineet Roadmap, Akash Roadmap, Hemant Roadmap, Hemnat Roadmap (Typo Variant), Master Team Roadmap, Pritesh Roadmap (+1 more)

## Ambiguous Edges - Review These
- `Hemant Roadmap` → `Hemnat Roadmap (Typo Variant)`  [AMBIGUOUS]
  Roadmaps/Roadmap_Hemnat.html · relation: conceptually_related_to

## Knowledge Gaps
- **37 isolated node(s):** `Allow sync contexts (routes, schedulers) to broadcast.`, `Minimal demo auth:     - Configure via env for quick frontend wiring.     - De`, `System Data Flow Diagram`, `Web Architecture Reference`, `Module 1.2 - Social Media` (+32 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Hemant Roadmap` and `Hemnat Roadmap (Typo Variant)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Normalisation and Event Bus` connect `Omnichannel Ingestion` to `Architecture & Frontend Layers`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `Layer 2: AI Triage Engine (Multi-Agent)` connect `Architecture & Frontend Layers` to `NLP & Kafka Integration`, `Omnichannel Ingestion`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `Layer 3: 360 Degree Complaint Core` connect `Architecture & Frontend Layers` to `Infrastructure & Deployment`, `Omnichannel Ingestion`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Layer 2: AI Triage Engine (Multi-Agent)` (e.g. with `AI Agent Swarm Architecture` and `Predictive Complaint Prevention`) actually correct?**
  _`Layer 2: AI Triage Engine (Multi-Agent)` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Allow sync contexts (routes, schedulers) to broadcast.`, `Minimal demo auth:     - Configure via env for quick frontend wiring.     - De`, `System Data Flow Diagram` to the rest of the system?**
  _37 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Architecture & Frontend Layers` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._