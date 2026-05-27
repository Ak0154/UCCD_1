# UCCD Remaining Tasks

This file contains the remaining tasks to be completed based on analysis of tasks.md and PROGRESS.md.

Legend:
- [ ] Not started
- [~] Partially implemented
- [x] Completed

## Module 8: Frontend Operational Screens

### TSK-8.2: Complaint Detail Workspace
**Status**: [ ]
**Goal**: Build the 3-column agent workspace
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

### TSK-8.4: Regulatory Dashboard
**Status**: [ ]
**Goal**: Build supervisor/compliance view for regulatory cases
**Expected input**:
- Regulatory service from TSK-6.1
- Complaint filters from TSK-5.1
**Expected output**:
- Regulatory queue.
- Deadline status per complaint.
- Filters by deadline risk, status, channel, and category.

### TSK-8.6: Simulation Sandbox
**Status**: [ ]
**Goal**: Build UI for simulation endpoint
**Expected input**:
- `POST /api/v1/simulation/run`
**Expected output**:
- Inputs for staff adjustment, volume spike, SLA override, and policy mode.
- Baseline vs projected metrics.
- Recommendation display.

### TSK-8.5: Insights & Trends Dashboard
**Status**: [~]
**Goal**: Build analytics view using trends API
**Expected input**:
- `GET /api/v1/analytics/trends`
- Analytics duration parser from TSK-5.3
**Expected output**:
- Trend chart.
- Category distribution.
- SLA/risk summary.
- Driver table or equivalent ranked insights.
**Current state**: Has trend chart, category breakdown, sentiment, and forecast charts; needs explicit SLA/risk summary and driver table.

### TSK-8.3: Supervisor Command Center
**Status**: [~]
**Goal**: Build live supervisor dashboard
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

### TSK-8.1: Agent Queue
**Status**: [~]
**Goal**: Build "My Queue" for agents
**Expected input**:
- `GET /api/v1/complaints`
- `GET /api/v1/agents/load`
- Complaint types from `frontend/src/types/complaint.ts`
**Expected output**:
- [x] Initial queue page with ticket list, status filter, and search.
- [ ] Add full filter set for channel, assignment, priority, and regulatory flag.
- [ ] Add SLA progress/countdown display.

### TSK-8.7: Complaint Search
**Status**: [~]
**Goal**: Build search page over the complaint queue
**Expected input**:
- Advanced filters from TSK-5.1
**Expected output**:
- [x] Initial search route reuses queue search.
- [ ] Add dedicated sortable/filterable results.
- [ ] Link results into complaint detail workspace.

### TSK-6.3: SLA Expiry Status Decision
**Status**: [~]
**Goal**: Decide whether expired tickets should use explicit `overdue` status or current `sla_breached=True` + escalation behavior
**Expected input**:
- `services/sla_service.py`
- `api/models/complaint.py`
- Frontend/dashboard expectations
**Expected output**:
- Product decision documented.
- Code updated if explicit `overdue` is required.
- Dashboard KPI logic matches the chosen behavior.
