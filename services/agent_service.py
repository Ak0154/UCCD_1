import logging
from typing import Optional
from sqlalchemy.orm import Session
from api.models.complaint import Complaint

logger = logging.getLogger(__name__)

MAX_TICKETS_PER_AGENT = 15


def compute_agent_load(db: Session) -> dict[str, int]:
    """Compute active ticket count per agent (assigned and not resolved)."""
    from sqlalchemy import func
    results = (
        db.query(Complaint.assigned_to, func.count(Complaint.id))
        .filter(Complaint.status != "resolved")
        .filter(Complaint.assigned_to.isnot(None))
        .group_by(Complaint.assigned_to)
        .all()
    )
    return {agent or "unassigned": count for agent, count in results}


def get_best_agent(
    db: Session,
    complaint_type: Optional[str] = None,
    exclude_agent: Optional[str] = None,
) -> Optional[str]:
    """Return the email of the eligible agent with the lowest active load.

    If no agents are below capacity, return the least-loaded agent.
    Agents at or above MAX_TICKETS_PER_AGENT are deprioritised.
    """
    loads = compute_agent_load(db)
    if not loads:
        return None

    eligible: list[tuple[str, int]] = []
    for agent, count in loads.items():
        if agent == "unassigned":
            continue
        if exclude_agent and agent == exclude_agent:
            continue
        eligible.append((agent, count))

    if not eligible:
        return None

    eligible.sort(key=lambda item: item[1])

    under_capacity = [(a, c) for a, c in eligible if c < MAX_TICKETS_PER_AGENT]
    if under_capacity:
        return under_capacity[0][0]

    return eligible[0][0]


def check_agent_loads(db: Session) -> list[dict]:
    """Return agents whose load exceeds MAX_TICKETS_PER_AGENT for alerting."""
    loads = compute_agent_load(db)
    overloaded = []
    for agent, count in loads.items():
        if agent == "unassigned":
            continue
        if count > MAX_TICKETS_PER_AGENT:
            overloaded.append({"agent": agent, "active_tickets": count, "capacity": MAX_TICKETS_PER_AGENT})
    return overloaded