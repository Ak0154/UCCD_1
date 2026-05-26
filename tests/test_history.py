from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from api.main import app
from api.models.complaint import Complaint
from api.routes.history import get_complaint_history

client = TestClient(app)


def create_mock_complaint(status="queued", assigned_to=None, pre_escalate=False, resolution_notes=None):
    """Create a mock Complaint with predictable attributes."""
    now = datetime.now(timezone.utc)
    complaint = MagicMock(spec=Complaint)
    complaint.id = "test-complaint-001"
    complaint.status = status
    complaint.created_at = now - timedelta(hours=2)
    complaint.updated_at = now - timedelta(hours=1)
    complaint.channel = "email"
    complaint.complaint_type = "fraud"
    complaint.severity_score = 0.85
    complaint.assigned_to = assigned_to
    complaint.pre_escalate = pre_escalate
    complaint.escalation_reason = "High risk"
    complaint.resolved_at = now if status == "resolved" else None
    complaint.resolution_notes = resolution_notes
    return complaint


def test_history_queued_complaint():
    """TSK-5.6: Focused test for GET /api/v1/complaints/{id}/history endpoint."""
    complaint = create_mock_complaint(status="queued")

    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = complaint

    result = get_complaint_history("test-complaint-001", db=mock_db)
    assert result["complaint_id"] == "test-complaint-001"
    assert len(result["timeline"]) >= 2

    ingestion_event = result["timeline"][0]
    assert ingestion_event["status"] == "queued"
    assert ingestion_event["action"] == "Ticket Ingested"

    triage_event = result["timeline"][1]
    assert triage_event["action"] == "AI Triage Completed"
    assert triage_event["status"] == "new"
    assert "fraud" in triage_event["description"]
    assert "0.85" in triage_event["description"]

    # Verify timeline timestamps are valid ISO format
    for event in result["timeline"]:
        dt = datetime.fromisoformat(event["timestamp"])
        assert isinstance(dt, datetime)

    # Verify triage timestamp is exactly 2 seconds after creation
    triage_dt = datetime.fromisoformat(triage_event["timestamp"])
    ingestion_dt = datetime.fromisoformat(ingestion_event["timestamp"])
    assert triage_dt - ingestion_dt == timedelta(seconds=2)


def test_history_resolved_complaint():
    """Verify resolved complaints include resolution and escalation events."""
    complaint = create_mock_complaint(
        status="resolved",
        assigned_to="agent@example.com",
        pre_escalate=True,
        resolution_notes="Refund processed",
    )

    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = complaint

    result = get_complaint_history("test-complaint-001", db=mock_db)
    assert result["complaint_id"] == "test-complaint-001"
    assert len(result["timeline"]) >= 4

    actions = [e["action"] for e in result["timeline"]]
    assert "Ticket Ingested" in actions
    assert "AI Triage Completed" in actions
    assert "Case Allocated" in actions
    assert "Pre-Escalation Flag Triggered" in actions
    assert "Ticket Resolved & Closed" in actions


def test_history_missing_complaint_returns_404():
    """TSK-5.6: Missing complaint should return 404."""
    from api.auth import get_current_user
    from api.db.session import get_db

    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = None

    def override_get_db():
        yield mock_db

    app.dependency_overrides[get_current_user] = lambda: MagicMock()
    app.dependency_overrides[get_db] = override_get_db
    try:
        response = client.get("/api/v1/complaints/nonexistent-id/history")
        assert response.status_code == 404
        assert response.json()["detail"] == "Complaint not found"
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_db, None)