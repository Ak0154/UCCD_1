from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.db.session import get_db
from api.models.complaint import Complaint
from services.regulatory_service import get_regulatory_status, set_regulatory_timer
from api.auth import require_role
from api.models.user import User

router = APIRouter(prefix="/api/v1/regulatory", tags=["regulatory"])


@router.get("/{complaint_id}/status")
def regulatory_status(
    complaint_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("SUPERVISOR", "COMPLIANCE")),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    status = get_regulatory_status(complaint_id)
    if status is None:
        return {
            "complaint_id": complaint_id,
            "active": False,
            "regulatory_obligation": complaint.regulatory_obligation,
        }

    return {**status, "active": True, "regulatory_obligation": complaint.regulatory_obligation}


@router.post("/{complaint_id}/start")
def start_regulatory_timer(
    complaint_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("SUPERVISOR", "COMPLIANCE")),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if not complaint.regulatory_obligation:
        raise HTTPException(status_code=422, detail="Complaint has no regulatory obligation")

    result = set_regulatory_timer(complaint_id, complaint.regulatory_obligation)
    return {"status": "started", **result}