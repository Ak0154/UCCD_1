from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from typing import Union
import re
from api.db.session import get_db
from api.models.complaint import Complaint
from api.auth import require_role
from api.models.user import User

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


def _parse_window(raw: Union[int, str]) -> tuple[int, str]:
    """Parse a window parameter into (num_buckets, bucket_granularity).

    Integer values are treated as days with daily granularity.
    String values like '12h', '7d', '30d', '4w' set both count and granularity.
    Supported suffixes: h (hour), d (day), w (week).
    """
    if isinstance(raw, int):
        return raw, "day"

    raw = str(raw).strip().lower()
    match = re.fullmatch(r"(\d+)\s*(h|d|w)", raw)
    if not match:
        try:
            return int(raw), "day"
        except ValueError:
            return 7, "day"

    value = int(match.group(1))
    suffix = match.group(2)

    if suffix == "h":
        return value, "hour"
    elif suffix == "w":
        return value * 7, "day"
    else:
        return value, "day"


@router.get("/trends")
def get_trends(
    window: Union[int, str] = Query(7, description="Window for trends: integer days or string like '12h', '7d', '4w'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("SUPERVISOR", "COMPLIANCE")),
):
    """
    Returns analytics trends data.
    - daily_volume: Complaint volume over the window period
    - category_distribution: Count of complaints per type
    - severity_average: Average severity score
    - breach_summary: Total count of breached versus met SLAs
    """
    num_buckets, granularity = _parse_window(window)

    now = datetime.now(timezone.utc)
    if granularity == "hour":
        bucket_td = timedelta(hours=1)
        start_date = now - timedelta(hours=num_buckets)
    else:
        bucket_td = timedelta(days=1)
        start_date = now - timedelta(days=num_buckets)

    # 1. Volume bucketing
    trunc_field = 'hour' if granularity == "hour" else 'day'
    daily_results = db.query(
        func.date_trunc(trunc_field, Complaint.created_at).label('bucket'),
        func.count(Complaint.id).label('count')
    ).filter(
        Complaint.created_at >= start_date
    ).group_by(
        'bucket'
    ).order_by(
        'bucket'
    ).all()

    if granularity == "hour":
        fmt = "%Y-%m-%dT%H:00"
        range_entries = num_buckets
    else:
        fmt = "%Y-%m-%d"
        range_entries = num_buckets

    daily_volume = []
    date_map = {r[0].strftime(fmt) if isinstance(r[0], datetime) else str(r[0]): r[1] for r in daily_results}

    for i in range(range_entries):
        d = (start_date + bucket_td * i).strftime(fmt)
        daily_volume.append({
            "date" if granularity == "day" else "hour": d,
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
    breached_count = db.query(Complaint).filter(Complaint.sla_breached.is_(True)).count()
    total_count = db.query(Complaint).count()
    met_count = total_count - breached_count

    return {
        "window": str(window),
        "granularity": granularity,
        "daily_volume": daily_volume,
        "category_distribution": categories,
        "average_severity": round(float(avg_severity), 3),
        "sla_compliance": {
            "met": met_count,
            "breached": breached_count,
            "compliance_rate": round((met_count / total_count * 100) if total_count > 0 else 100.0, 2)
        }
    }
