from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from api.db.session import get_db
from api.models.complaint import Complaint

router = APIRouter(prefix="/api/v1/agents", tags=["agents"])

@router.get("/load")
def get_agents_load(db: Session = Depends(get_db)):
    """
    Retrieves current active queue load.
    Active loads are complaints that are not 'resolved'.
    Returns department distribution (complaint_type) and agent distribution (assigned_to).
    """
    # 1. Active load grouped by department (complaint_type)
    dept_results = db.query(
        Complaint.complaint_type,
        func.count(Complaint.id)
    ).filter(
        Complaint.status != "resolved"
    ).group_by(
        Complaint.complaint_type
    ).all()

    # Map department results to dictionary, default null type to 'unclassified'
    departments = {}
    for dept, count in dept_results:
        dept_name = dept if dept else "unclassified"
        departments[dept_name] = count

    # Ensure keys exist for mock data references
    for expected_dept in ["fraud", "billing", "kyc", "loans", "cards", "service", "technical"]:
        if expected_dept not in departments:
            departments[expected_dept] = 0

    # 2. Active load grouped by agent (assigned_to email)
    agent_results = db.query(
        Complaint.assigned_to,
        func.count(Complaint.id)
    ).filter(
        Complaint.status != "resolved"
    ).group_by(
        Complaint.assigned_to
    ).all()

    agents = {}
    for agent, count in agent_results:
        agent_name = agent if agent else "unassigned"
        agents[agent_name] = count

    # Ensure our demo agents are represented in the capacity list
    for expected_agent in ["agent@example.com", "supervisor@example.com", "compliance@example.com"]:
        if expected_agent not in agents:
            agents[expected_agent] = 0

    return {
        "status": "success",
        "total_active_load": sum(departments.values()),
        "departments": departments,
        "agents": agents
    }
