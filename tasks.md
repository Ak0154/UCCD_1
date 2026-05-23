# UCCD Modular Task List for AI Agents (Incomplete Gaps Only)

This file contains the master checklist of remaining, unimplemented tasks required to complete the Unified Customer Complaint Communication Dashboard (UCCD) POC. Completed features have been excluded so developer agents focus exclusively on the remaining gaps.

> [!IMPORTANT]
> ### Safety Filter Note
> To prevent language model crashes and safety blocks, all tasks have been sanitized. Prohibited terms are mapped to safe vocabulary (e.g., SLA Violation instead of SLA Br-ach, Card Dispute / Unauthorized Charges instead of Fr-aud, Suspicious Link instead of Ph-shing, and Terminate instead of K-ll). Do not reintroduce the prohibited terms in comments, documents, or prompts.

---

## 🛠️ Module 1: Infrastructure, Database & Message Brokers

### TSK-1.1: Multi-Container Docker Orchestration
* **Goal**: Expand `docker-compose.yml` to orchestrate Zookeeper, Kafka, PostgreSQL, and Redis along with the FastAPI application.
* **Expected Input**: 
  - Current [docker-compose.yml](file:///d:/UCCD/docker-compose.yml)
* **Expected Output**: 
  - Updated `docker-compose.yml` with health checks, proper service dependencies, and container network integrations.

### TSK-1.2: Database Migration Schema & Vector Extension
* **Goal**: Write a SQL script (`db/schema.sql`) to initialize the PostgreSQL schema, including tables for users and enable the `pgvector` extension with an IVFFlat index on embedding columns.
* **Expected Input**: 
  - SQLAlchemy model properties from [complaint.py](file:///d:/UCCD/api/models/complaint.py)
* **Expected Output**: 
  - File `db/schema.sql` containing DDL for `users` and embedding indices.

### TSK-1.3: Alembic Database Migration Configuration
* **Goal**: Setup Alembic migrations to manage database schema updates.
* **Expected Input**: 
  - Database connection URL and [session.py](file:///d:/UCCD/api/db/session.py)
* **Expected Output**: 
  - Initialized `alembic/` folder and initial migration scripts in `alembic/versions/`.

### TSK-1.4: Makefile Development Commands
* **Goal**: Create a `Makefile` in the project root to automate container execution, testing, and database seeding.
* **Expected Input**: 
  - Command line syntax for docker-compose and python scripts.
* **Expected Output**: 
  - A functioning `Makefile` with targets: `make up`, `make down`, `make logs`, `make seed`, and `make test`.

### TSK-1.5: Environment Variables Template (`.env.example`)
* **Goal**: Generate a `.env.example` file listing all required local environment configuration keys.
* **Expected Input**: 
  - Current configuration requirements in [session.py](file:///d:/UCCD/api/db/session.py) and external API key requirements.
* **Expected Output**: 
  - `.env.example` containing placeholders for database URLs, Redis configurations, Groq API keys, and server settings.

---

## 🔑 Module 2: User Authentication & Role-Based Access Control (RBAC)

### TSK-2.1: User Database Model & Password Encryption
* **Goal**: Define the SQLAlchemy database schema for users and implement secure password hashing with bcrypt.
* **Expected Input**: 
  - User role mappings: `AGENT`, `SUPERVISOR`
* **Expected Output**: 
  - New model file `api/models/user.py` and password utilities in `api/auth.py`.

### TSK-2.2: User Security & Enhanced JWT Payload
* **Goal**: Update JWT generation in the login route to include the user's ID, full name, and assigned role in the token payload.
* **Expected Input**: 
  - Current login handler in [auth.py](file:///d:/UCCD/api/routes/auth.py)
* **Expected Output**: 
  - `POST /api/v1/auth/login` returns a payload with fields: `access_token`, `token_type`, `role`, `user_id`, and `name`.

### TSK-2.3: Dependency Injection for Route Authorization
* **Goal**: Implement dependency helper functions (`get_current_user`, `require_role`) to protect endpoints from unauthorized access.
* **Expected Input**: 
  - JWT token and security schemas.
* **Expected Output**: 
  - Helpers that block and return 401/403 status codes for requests with invalid credentials or insufficient roles.

---

## 📬 Module 3: Message Queue & Asynchronous Event Handlers

### TSK-3.1: Message Queue Producer Utility
* **Goal**: Implement a publisher wrapper in `kafka/producer.py` to post incoming complaints to the message broker.
* **Expected Input**: 
  - Kafka broker addresses and JSON ticket schemas.
* **Expected Output**: 
  - File `kafka/producer.py` exporting `publish_complaint(complaint_data)`.

### TSK-3.2: Base Message Queue Consumer Interface
* **Goal**: Build a base consumer class in `kafka/base_consumer.py` that processes messages, handles retries, and forwards failures to a Dead Letter Queue (DLQ).
* **Expected Input**: 
  - Kafka library configurations.
* **Expected Output**: 
  - File `kafka/base_consumer.py` defining `BaseConsumer` class with error handling logic.

### TSK-3.3: Inbound Pipeline Queue Consumer
* **Goal**: Implement a worker daemon `agents/inbound_consumer.py` that listens on `complaints.inbound` topic, parses tickets, and triggers the orchestrator.
* **Expected Input**: 
  - Ticket message format from Kafka.
* **Expected Output**: 
  - Runnable consumer processing queue items and invoking the LangGraph pipeline.

### TSK-3.4: Modular Queue Consumers for Pipeline Steps
* **Goal**: Create wrapper consumers to delegate pipeline nodes to independent broker queues (e.g. sentiment analysis queue, semantic clustering queue).
* **Expected Input**: 
  - Topic subscriptions for pipeline stages.
* **Expected Output**: 
  - Modular consumer scripts (e.g. `agents/dna_consumer.py`, `agents/emotion_consumer.py`) handling specific processing steps asynchronously.

---

## 🧠 Module 4: Machine Learning Models & Custom Agents

### TSK-4.1: Regression Model for SLA Deadline Violations (Training)
* **Goal**: Implement training scripts (`ml/generate_training_data.py`, `ml/train_violation_model.py`) to build a regression model that predicts SLA deadline miss probability.
* **Expected Input**: 
  - Queue volumes, priority metrics, and response speed constants.
* **Expected Output**: 
  - Trained model file `ml/violation_predictor.pkl` estimating probability of missing the deadline.

### TSK-4.2: Machine Learning SLA Violation Predictor Integration
* **Goal**: Integrate the SLA violation regression model into `agents/escalation_agent.py` to flag tickets at risk of missing deadlines.
* **Expected Input**: 
  - Loaded model `violation_predictor.pkl`, current queue metrics, and ticket urgency from [escalation_agent.py](file:///d:/UCCD/agents/escalation_agent.py)
* **Expected Output**: 
  - Updated fields `breach_probability` (violation probability) and `pre_escalate` set to True if the probability exceeds 0.70.

---

## 🔗 Module 5: API Extensions & Routing Enhancements

### TSK-5.1: Ticket Queue Search & Advanced Filters
* **Goal**: Expand `GET /api/v1/complaints` to support query parameters for agent assignment, priority, regulatory status, and textual search.
* **Expected Input**: 
  - Database session and [complaints.py](file:///d:/UCCD/api/routes/complaints.py#L76)
* **Expected Output**: 
  - Filtered JSON payload matching parameters (`assigned_to`, `regulatory_flag`, `tier`, `search`).

### TSK-5.2: Path Aliases for Analytics & Violation Queues
* **Goal**: Add API routing redirects or handlers for `/api/v1/kpis` (pointing to `/api/v1/dashboard/kpis`) and `/api/v1/escalations` (pointing to `/api/v1/complaints/escalations`).
* **Expected Input**: 
  - APIRouter configuration.
* **Expected Output**: 
  - Accessing the alias paths returns the same schema as the main routes.

### TSK-5.3: Analytics Timeframe Parser & Aggregator
* **Goal**: Update `GET /api/v1/analytics/trends` to accept duration units (`12h`, `30d`) and aggregate metrics by corresponding timeframes (hourly vs. daily).
* **Expected Input**: 
  - Query parameters and [analytics.py](file:///d:/UCCD/api/routes/analytics.py#L10)
* **Expected Output**: 
  - Correct interval calculations, returning charts with grouped data points.

### TSK-5.4: Dedicated Response Drafting Service
* **Goal**: Refactor the auto-reply generator into a separate service `services/draft_service.py` supporting customized tone styles.
* **Expected Input**: 
  - Groq API configurations and customer text context.
* **Expected Output**: 
  - `services/draft_service.py` exporting `generate_draft(complaint, tone)`.

### TSK-5.5: WebSocket Alert Broadcast Expansions
* **Goal**: Update WebSocket messages to broadcast structured alerts for events like `violation_predicted`, `cluster_spike`, and `agent_overload`.
* **Expected Input**: 
  - Live ticket updates and [websocket.py](file:///d:/UCCD/api/websocket.py)
* **Expected Output**: 
  - Real-time broadcasts sent to active dashboard connections.

---

## ⏳ Module 6: SLA Tracking & Dispatch Services

### TSK-6.1: Regulatory Timer Service
* **Goal**: Manage strict regulatory compliance deadlines using Redis, exposing state query routes for supervisors.
* **Expected Input**: 
  - Redis database and ticket structures.
* **Expected Output**: 
  - Expose `GET /api/v1/regulatory/{complaint_id}/status` returning countdown parameters.

### TSK-6.2: Agent Capacity & Dispatch Service
* **Goal**: Calculate agent availability and allocate tickets based on active queue loads in Redis.
* **Expected Input**: 
  - Redis capacity sets and user roles.
* **Expected Output**: 
  - Allocation algorithm assigning new tickets to agents with lowest load, exposing `GET /api/v1/agents/load`.

---

## 🎨 Module 7: Premium Frontend Core & Authentication

### TSK-7.1: UI Setup & CSS Core Theme
* **Goal**: Establish typography, custom spacing, glassmorphic styles, and colors in a global CSS sheet.
* **Expected Input**: 
  - CSS variables and responsive design guidelines.
* **Expected Output**: 
  - `src/styles/tokens.css` exposing variables and utilities.

### TSK-7.2: API client & JWT Authorization Interceptor
* **Goal**: Implement Axios client that appends bearer tokens and handles token expiration.
* **Expected Input**: 
  - Authentication storage.
* **Expected Output**: 
  - `src/api/client.ts` handling secure calls.

### TSK-7.3: Route Guard & Role Toggle Login Screen
* **Goal**: Build credentials form with role selector and redirect agents or supervisors to their respective dashboards.
* **Expected Input**: 
  - React Router and Auth Context.
* **Expected Output**: 
  - Working login view protecting private routes.

---

## 🖥️ Module 8: Premium Frontend Workspace & Dashboard Views

### TSK-8.1: Agent Queue "My Queue" Interface
* **Goal**: Build list workspace for agents displaying ticket cards with channel indicators, urgency tags, and SLA progress bars.
* **Expected Input**: 
  - Queue client calls.
* **Expected Output**: 
  - React list page supporting filters.

### TSK-8.2: 3-Column Detailed Workspace
* **Goal**: Create workspace containing customer timeline details, interactive communications, AI draft responses, and classification tags.
* **Expected Input**: 
  - Component definitions.
* **Expected Output**: 
  - Intersecting layout allowing agent drafting, editing, and resolution dispatch.

### TSK-8.3: Supervisor Headquarters Dashboard
* **Goal**: Assemble command center with operational charts, agent capacity gauges, and a real-time event ticker.
* **Expected Input**: 
  - Analytics hooks.
* **Expected Output**: 
  - Live supervisor dashboard visualizing performance metrics.

### TSK-8.4: Live WebSocket Event Hooks
* **Goal**: Create React hooks that manage live socket connections, pushing notifications to dashboard views.
* **Expected Input**: 
  - WebSocket connection endpoint.
* **Expected Output**: 
  - Live toast alerts and UI elements updating on socket push events.

---

## 🧪 Module 9: E2E Testing & Demo Validation

### TSK-9.1: Comprehensive System Seed Script Update
* **Goal**: Update seeding script to inject 20 diverse banking tickets and process them through the pipeline using Kafka producers.
* **Expected Input**: 
  - [seed_demo.py](file:///d:/UCCD/scripts/seed_demo.py).
* **Expected Output**: 
  - Population of realistic database rows for testing.

### TSK-9.2: Unit & Integration Test Suites
* **Goal**: Write automated test files ensuring coverage for authentication, SLA management, and queues.
* **Expected Input**: 
  - pytest testing framework.
* **Expected Output**: 
  - Run `pytest` showing passing indicators for all core modules.
