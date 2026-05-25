# UCCD — Unified Complaint & Case Dashboard

A real-time, AI-powered complaint management platform built for banking and financial services.

## Architecture

| Layer | Component | Technology |
|---|---|---|
| **Layer 1** | Omnichannel Ingestion | Email, Social, Voice, Chatbot, Portal, Regulator → Kafka |
| **Layer 2** | AI Triage Engine | 7 agents: NLP, Emotion, DNA, Severity, Escalation, Root Cause, Resolution |
| **Layer 3** | Complaint Core | 360° records, knowledge store, regulatory, SLA engine |
| **Layer 4** | Intelligence & Dashboard | Agent workspace, insights, simulation, supervisor HQ |

## Tech Stack

- **Backend**: Python (FastAPI), SQLAlchemy, Alembic
- **Frontend**: React (TypeScript), Vite, Tailwind CSS
- **Queue**: Apache Kafka
- **Cache / Timers**: Redis
- **Database**: PostgreSQL (hosted on [Neon DB](https://neon.tech))
- **AI**: LangGraph orchestrator, Groq (LLaMA), Sarvam (translation)
- **Containerization**: Docker (API, Redis, Kafka, Zookeeper)

## Prerequisites

- Docker & Docker Compose
- Python 3.11+
- Node.js 18+
- A [Neon DB](https://neon.tech) PostgreSQL instance
- Groq API key (for LLM features)
- Sarvam API key (for translation, optional)

## Setup

### 1. Environment Variables

```bash
cp .env.example .env
```

Fill in the required values:

| Variable | Description |
|---|---|
| `POSTGRES_URL` | Neon DB connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `GROQ_API_KEY` | Groq API key for LLM calls |
| `SARVAM_ACCESS_TOKEN` | Sarvam translation API token (optional) |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token (optional) |

### 2. Database

The database is **external** (Neon DB). No local PostgreSQL container is included.

```bash
# Apply migrations
alembic upgrade head

# Create database tables directly (if migrations are not used)
python scripts/create_tables.py
```

### 3. Start Infrastructure Services

```bash
docker compose up -d redis kafka zookeeper
```

### 4. Create Kafka Topics

```bash
python scripts/create_kafka_topics.py
```

### 5. Start the API

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

API available at `http://localhost:8000`

### 6. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend available at `http://localhost:5173`

### 7. Seed Demo Data

```bash
# Seed demo users
python scripts/seed_users.py

# Seed demo complaints (runs AI pipeline directly in demo mode)
python scripts/seed_demo.py
```

## Demo Login

| Role | Email | Password |
|---|---|---|
| Agent | agent@example.com | demo123 |
| Supervisor | supervisor@example.com | demo123 |
| Compliance | compliance@example.com | demo123 |

## Demo Path

1. Login as an **Agent** to access the queue workspace
2. View AI-classified complaints in the queue (severity, type, SLA timers)
3. Open a complaint to see AI triage metadata, emotion arc, and draft response
4. Edit and send a response to resolve the ticket
5. Login as a **Supervisor** to see the Command Center with live KPIs, escalation queue, and agent load
6. Navigate to **Analytics** for volume trends, category distribution, and SLA compliance rates
7. Use the **Simulation** panel to test staffing/volume scenarios
8. Watch **WebSocket** live events for SLA alerts, escalations, and status changes

## API Documentation

Once the server is running:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health check: `http://localhost:8000/api/health`

## Testing

```bash
pytest tests/ -v
```

## Project Structure

```
├── api/                  # FastAPI application
│   ├── routes/           # API endpoints
│   ├── models/           # SQLAlchemy ORM models
│   ├── schemas/          # Pydantic models
│   └── db/               # Database session
├── agents/               # AI pipeline agents (LangGraph)
├── services/             # Business logic services
├── kafka/                # Kafka producers & consumers
├── ml/                   # Machine learning scripts
├── frontend/             # React TypeScript frontend
├── scripts/              # Utility and seed scripts
├── tests/                # Test suite
└── alembic/              # Database migrations
```