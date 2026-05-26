from fastapi import APIRouter, Depends, HTTPException
from datetime import timedelta
from sqlalchemy.orm import Session
from api.db.session import get_db
from api.models.complaint import Complaint
from api.routes.complaints import find_complaint
from api.auth import get_current_user
from api.models.user import User

router = APIRouter(prefix="/api/v1/complaints", tags=["complaints"])

@router.get("/{complaint_id}/history")
def get_complaint_history(
    complaint_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Constructs a dynamic audit history trail for the complaint.
    Returns chronologically ordered timeline events.
    """
    complaint = find_complaint(complaint_id, db)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    events = []

    # 1. Ingestion Event
    events.append({
        "timestamp": complaint.created_at.isoformat(),
        "status": "queued",
        "action": "Ticket Ingested",
        "actor": "System / Channel Gateway",
        "description": f"Complaint successfully received from customer via {complaint.channel}."
    })

    # 2. AI Triage Engine Event (assumed 2 seconds after creation)
    triage_time = complaint.created_at + timedelta(seconds=2)
    triage_desc = f"NLP classifier set type to '{complaint.complaint_type or 'General'}' "
    if complaint.severity_score is not None:
        triage_desc += f"with severity score of {complaint.severity_score:.2f}."
    else:
        triage_desc += "with unclassified severity."

    events.append({
        "timestamp": triage_time.isoformat(),
        "status": "new",
        "action": "AI Triage Completed",
        "actor": "UCCD AI Pipeline",
        "description": triage_desc
    })

    # 3. Allocation event (if assigned_to is set)
    if complaint.assigned_to:
        events.append({
            "timestamp": complaint.updated_at.isoformat(),
            "status": "in_progress",
            "action": "Case Allocated",
            "actor": "Supervisor",
            "description": f"Ticket assigned to support agent: {complaint.assigned_to}."
        })

    # 4. Escalation warning event (if pre_escalate is True)
    if complaint.pre_escalate:
        events.append({
            "timestamp": complaint.updated_at.isoformat(),
            "status": complaint.status,
            "action": "Pre-Escalation Flag Triggered",
            "actor": "Predictive Escalation Agent",
            "description": complaint.escalation_reason or "Estimated SLA breach probability exceeded 70% threshold."
        })

    # 5. Resolution Event (if resolved)
    if complaint.status == "resolved" and complaint.resolved_at:
        events.append({
            "timestamp": complaint.resolved_at.isoformat(),
            "status": "resolved",
            "action": "Ticket Resolved & Closed",
            "actor": complaint.assigned_to or "Support Agent",
            "description": f"Agent submitted resolution. Notes: {complaint.resolution_notes}"
        })

    return {
        "complaint_id": complaint_id,
        "timeline": events
    }
