import json
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import func, event
from sqlalchemy.orm import Session

from api.db.session import get_db
from api.models.complaint import Complaint
from api.auth import require_role
from api.models.user import User
from services.cache import r

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


def clear_dashboard_cache():
    """Invalidate all dashboard-related cache keys."""
    try:
        keys = r.keys("dashboard:*")
        if keys:
            for k in keys:
                r.delete(k)
    except Exception as e:
        print(f"Failed to clear dashboard cache: {e}")


# Register SQLAlchemy ORM event listeners to invalidate the cache automatically on write operations.
@event.listens_for(Complaint, "after_insert")
def on_complaint_insert(mapper, connection, target):
    clear_dashboard_cache()


@event.listens_for(Complaint, "after_update")
def on_complaint_update(mapper, connection, target):
    clear_dashboard_cache()


@event.listens_for(Complaint, "after_delete")
def on_complaint_delete(mapper, connection, target):
    clear_dashboard_cache()


@router.get("/kpis")
def get_kpis(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("AGENT", "SUPERVISOR", "COMPLIANCE")),
):
    # Scope KPI cache key by role and agent email to support private queues vs global stats
    if current_user.role == "AGENT":
        cache_key = f"dashboard:kpis:AGENT:{current_user.email}"
    else:
        cache_key = f"dashboard:kpis:{current_user.role}:all"

    try:
        cached = r.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass

    # Start base query
    query = db.query(Complaint)

    # Filter by assigned agent if the current user is an Agent
    if current_user.role == "AGENT":
        query = query.filter(Complaint.assigned_to == current_user.email)

    total = query.count()
    open_count = query.filter(Complaint.status != "resolved").count()
    escalated = query.filter(Complaint.status == "escalated").count()
    breached = query.filter(Complaint.sla_breached.is_(True)).count()
    queued = query.filter(Complaint.status == "queued").count()
    in_progress = query.filter(Complaint.status == "in_progress").count()

    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    resolved_today = query.filter(
        Complaint.status == "resolved",
        Complaint.resolved_at >= today,
    ).count()

    resolved = query.filter(Complaint.status == "resolved").count()
    resolution_rate = round((resolved / total * 100) if total > 0 else 100.0, 1)

    sla_at_risk = query.filter(
        Complaint.status != "resolved",
        Complaint.sla_deadline.isnot(None),
        Complaint.sla_deadline <= datetime.now(timezone.utc) + timedelta(hours=2),
        Complaint.sla_breached.is_(False),
    ).count()

    resolved_times_query = db.query(Complaint.resolved_at, Complaint.created_at).filter(
        Complaint.status == "resolved",
        Complaint.resolved_at.isnot(None),
        Complaint.resolved_at >= datetime.now(timezone.utc) - timedelta(days=30),
    )
    if current_user.role == "AGENT":
        resolved_times_query = resolved_times_query.filter(Complaint.assigned_to == current_user.email)
    resolved_times = resolved_times_query.all()

    avg_seconds = 0.0
    if resolved_times:
        deltas = [(r[0] - r[1]).total_seconds() for r in resolved_times if r[0] and r[1]]
        if deltas:
            avg_seconds = sum(deltas) / len(deltas)

    avg_hours = round(avg_seconds / 3600, 1)

    regulatory_flagged = query.filter(
        Complaint.regulatory_flag.is_(True),
        Complaint.status != "resolved",
    ).count()

    res = {
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

    try:
        r.setex(cache_key, 60, json.dumps(res))
    except Exception:
        pass
    return res


@router.get("/categories")
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("AGENT", "SUPERVISOR", "COMPLIANCE")),
):
    cache_key = "dashboard:categories"
    try:
        cached = r.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass

    results = db.query(
        Complaint.complaint_type,
        func.count(Complaint.id),
    ).group_by(Complaint.complaint_type).order_by(func.count(Complaint.id).desc()).all()

    res = {
        "categories": [
            {"name": cat or "unclassified", "count": count}
            for cat, count in results
        ]
    }

    try:
        r.setex(cache_key, 60, json.dumps(res))
    except Exception:
        pass
    return res


@router.get("/channels")
def get_channels(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("AGENT", "SUPERVISOR", "COMPLIANCE")),
):
    cache_key = "dashboard:channels"
    try:
        cached = r.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass

    results = db.query(
        Complaint.channel,
        func.count(Complaint.id),
    ).group_by(Complaint.channel).order_by(func.count(Complaint.id).desc()).all()

    total = sum(count for _, count in results)

    res = {
        "channels": [
            {"name": ch, "count": count, "percentage": round((count / total * 100) if total > 0 else 0, 1)}
            for ch, count in results
        ]
    }

    try:
        r.setex(cache_key, 60, json.dumps(res))
    except Exception:
        pass
    return res


@router.get("/recent")
def get_recent_complaints(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("AGENT", "SUPERVISOR", "COMPLIANCE")),
):
    from api.schemas.complaint import ComplaintResponse
    cache_key = f"dashboard:recent:{limit}"
    try:
        cached = r.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass

    complaints = db.query(Complaint).order_by(Complaint.created_at.desc()).limit(limit).all()
    res = {"complaints": [ComplaintResponse.model_validate(c).model_dump(mode="json") for c in complaints]}

    try:
        r.setex(cache_key, 60, json.dumps(res))
    except Exception:
        pass
    return res


@router.get("/my-queue")
def get_my_queue(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("AGENT", "SUPERVISOR", "COMPLIANCE")),
):
    from api.schemas.complaint import ComplaintResponse
    cache_key = f"dashboard:my-queue:{current_user.email}:{limit}"
    try:
        cached = r.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass

    complaints = db.query(Complaint).filter(
        Complaint.assigned_to == current_user.email,
        Complaint.status != "resolved",
    ).order_by(Complaint.sla_deadline.asc().nullslast()).limit(limit).all()
    res = {"complaints": [ComplaintResponse.model_validate(c).model_dump(mode="json") for c in complaints]}

    try:
        r.setex(cache_key, 60, json.dumps(res))
    except Exception:
        pass
    return res


@router.get("/clusters")
def get_clusters(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("AGENT", "SUPERVISOR", "COMPLIANCE")),
):
    from api.schemas.complaint import ComplaintResponse
    cache_key = "dashboard:clusters"
    try:
        cached = r.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass

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
            "complaints": [ComplaintResponse.model_validate(co).model_dump(mode="json") for co in comps],
        })

    result.sort(key=lambda x: x["count"], reverse=True)
    res = {"clusters": result}

    try:
        r.setex(cache_key, 60, json.dumps(res))
    except Exception:
        pass
    return res
