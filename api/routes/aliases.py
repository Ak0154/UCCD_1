from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from api.auth import require_role
from api.db.session import get_db
from api.models.user import User
from api.routes.complaints import list_escalated_complaints
from api.routes.dashboard import get_kpis

router = APIRouter(prefix="/api/v1", tags=["aliases"])


@router.get("/kpis")
def get_kpis_alias(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("AGENT", "SUPERVISOR", "COMPLIANCE")),
):
    return get_kpis(db=db, current_user=current_user)


@router.get("/escalations")
def list_escalations_alias(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Number of complaints per page"),
    db: Session = Depends(get_db),
):
    return list_escalated_complaints(page=page, limit=limit, db=db)
