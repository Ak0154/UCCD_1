from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from api.db.session import get_db
from api.models.complaint import Complaint

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])

@router.get("/trends")
def get_trends(
    window: int = Query(7, ge=1, le=90, description="Window of days for trends"),
    db: Session = Depends(get_db)
):
    """
    Returns analytics trends data.
    - daily_volume: Complaint volume over the last N days
    - category_distribution: Count of complaints per type
    - severity_average: Average severity score
    - breach_summary: Total count of breached versus met SLAs
    """
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=window)

    # 1. Daily volume
    # Cast timestamp to date for grouping
    daily_results = db.query(
        func.date_trunc('day', Complaint.created_at).label('day'),
        func.count(Complaint.id).label('count')
    ).filter(
        Complaint.created_at >= start_date
    ).group_by(
        'day'
    ).order_by(
        'day'
    ).all()

    daily_volume = []
    # Fill in dates in the range to ensure a continuous line plot
    date_map = {r[0].strftime("%Y-%m-%d") if isinstance(r[0], datetime) else str(r[0]): r[1] for r in daily_results}
    
    for i in range(window):
        d = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
        daily_volume.append({
            "date": d,
            "count": date_map.get(d, 0)
        })

    # 2. Category distribution
    cat_results = db.query(
        Complaint.complaint_type,
        func.count(Complaint.id)
    ).group_by(
        Complaint.complaint_type
    ).all()

    categories = {cat if cat else "unclassified": count for cat, count in cat_results}

    # 3. Severity details
    avg_severity = db.query(func.avg(Complaint.severity_score)).scalar() or 0.0

    # 4. Breach statistics
    breached_count = db.query(Complaint).filter(Complaint.sla_breached == True).count()
    total_count = db.query(Complaint).count()
    met_count = total_count - breached_count

    return {
        "window_days": window,
        "daily_volume": daily_volume,
        "category_distribution": categories,
        "average_severity": round(float(avg_severity), 3),
        "sla_compliance": {
            "met": met_count,
            "breached": breached_count,
            "compliance_rate": round((met_count / total_count * 100) if total_count > 0 else 100.0, 2)
        }
    }
