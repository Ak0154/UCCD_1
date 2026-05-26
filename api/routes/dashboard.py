from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from api.db.session import get_db
from api.models.complaint import Complaint
from api.auth import require_role
from api.models.user import User

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/kpis")
def get_kpis(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("AGENT", "SUPERVISOR", "COMPLIANCE")),
):
    total = db.query(Complaint).count()
    open_count = db.query(Complaint).filter(Complaint.status != "resolved").count()
    escalated = db.query(Complaint).filter(Complaint.status == "escalated").count()
    breached = db.query(Complaint).filter(Complaint.sla_breached.is_(True)).count()
    queued = db.query(Complaint).filter(Complaint.status == "queued").count()
    in_progress = db.query(Complaint).filter(Complaint.status == "in_progress").count()

    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    resolved_today = db.query(Complaint).filter(
        Complaint.status == "resolved",
        Complaint.resolved_at >= today,
    ).count()

    resolved = db.query(Complaint).filter(Complaint.status == "resolved").count()
    resolution_rate = round((resolved / total * 100) if total > 0 else 100.0, 1)

    sla_at_risk = db.query(Complaint).filter(
        Complaint.status != "resolved",
        Complaint.sla_deadline.isnot(None),
        Complaint.sla_deadline <= datetime.now(timezone.utc) + timedelta(hours=2),
        Complaint.sla_breached.is_(False),
    ).count()

    resolved_times = db.query(Complaint.resolved_at, Complaint.created_at).filter(
        Complaint.status == "resolved",
        Complaint.resolved_at.isnot(None),
        Complaint.resolved_at >= datetime.now(timezone.utc) - timedelta(days=30),
    ).all()

    avg_seconds = 0.0
    if resolved_times:
        deltas = [(r[0] - r[1]).total_seconds() for r in resolved_times if r[0] and r[1]]
        if deltas:
            avg_seconds = sum(deltas) / len(deltas)

    avg_hours = round(avg_seconds / 3600, 1)

    regulatory_flagged = db.query(Complaint).filter(
        Complaint.regulatory_flag.is_(True),
        Complaint.status != "resolved",
    ).count()

    return {
        "total": total,
        "open": open_count,
        "queued": queued,
        "in_progress": in_progress,
        "escalated": escalated,
        "breached": breached,
        "resolved_today": resolved_today,
        "resolution_rate": resolution_rate,
        "sla_at_risk": sla_at_risk,
        "avg_resolution_hours": avg_hours,
        "regulatory_flagged": regulatory_flagged,
    }


@router.get("/categories")
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("AGENT", "SUPERVISOR", "COMPLIANCE")),
):
    results = db.query(
        Complaint.complaint_type,
        func.count(Complaint.id),
    ).group_by(Complaint.complaint_type).order_by(func.count(Complaint.id).desc()).all()

    return {
        "categories": [
            {"name": cat or "unclassified", "count": count}
            for cat, count in results
        ]
    }


@router.get("/channels")
def get_channels(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("AGENT", "SUPERVISOR", "COMPLIANCE")),
):
    results = db.query(
        Complaint.channel,
        func.count(Complaint.id),
    ).group_by(Complaint.channel).order_by(func.count(Complaint.id).desc()).all()

    total = sum(count for _, count in results)

    return {
        "channels": [
            {"name": ch, "count": count, "percentage": round((count / total * 100) if total > 0 else 0, 1)}
            for ch, count in results
        ]
    }


@router.get("/recent")
def get_recent_complaints(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("AGENT", "SUPERVISOR", "COMPLIANCE")),
):
    from api.schemas.complaint import ComplaintResponse
    complaints = db.query(Complaint).order_by(Complaint.created_at.desc()).limit(limit).all()
    return {"complaints": [ComplaintResponse.model_validate(c) for c in complaints]}


@router.get("/my-queue")
def get_my_queue(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("AGENT", "SUPERVISOR", "COMPLIANCE")),
):
    from api.schemas.complaint import ComplaintResponse
    complaints = db.query(Complaint).filter(
        Complaint.assigned_to == current_user.email,
        Complaint.status != "resolved",
    ).order_by(Complaint.sla_deadline.asc().nullslast()).limit(limit).all()
    return {"complaints": [ComplaintResponse.model_validate(c) for c in complaints]}


@router.get("/clusters")
def get_clusters(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("AGENT", "SUPERVISOR", "COMPLIANCE")),
):
    from api.schemas.complaint import ComplaintResponse

    clusters = db.query(Complaint).filter(
        Complaint.cluster_id.isnot(None)
    ).all()

    grouped: dict[str, list[Complaint]] = {}
    for c in clusters:
        key = c.cluster_id or "unknown"
        if key not in grouped:
            grouped[key] = []
        grouped[key].append(c)

    result = []
    for cluster_id, comps in grouped.items():
        types = list(set(co.complaint_type for co in comps if co.complaint_type))
        result.append({
            "cluster_id": cluster_id,
            "count": len(comps),
            "complaint_types": types,
            "complaints": [ComplaintResponse.model_validate(co) for co in comps],
        })

    result.sort(key=lambda x: x["count"], reverse=True)

    return {"clusters": result}

