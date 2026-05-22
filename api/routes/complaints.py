from fastapi import APIRouter,Query,HTTPException,Depends,BackgroundTasks
from uuid import uuid4
from datetime import datetime, timedelta, timezone
from api.schemas.complaint import ComplaintCreate, ComplaintResponse, ComplaintListResponse, StatusUpdate
from agents.nlp_classifier import classify_complaint
from api.db.session import get_db
from sqlalchemy.orm import Session 
from sqlalchemy import or_
from api.models.complaint import Complaint
from agents.orchestrator import run_pipeline
from services.sla_service import get_sla_status
from api.websocket import broadcast_event
from pydantic import BaseModel
from groq import Groq
import os
import requests

class RespondResolveRequest(BaseModel):
    response_text: str

router = APIRouter(prefix="/api/v1/complaints", tags=["complaints"])

@router.post("",response_model=ComplaintResponse,status_code=201,)
def create_complaint(complaint: ComplaintCreate,background_tasks: BackgroundTasks,db: Session=Depends(get_db)):
    new_complaint = {
        "id": uuid4(),
        **complaint.model_dump(),
        "status": "queued",
        "sla_tier": None,
        "sla_deadline": None,
        "sla_breached": False,
        "complaint_type": None,
        "type_confidence": None,
        "product_code": None,
        "intent": None,
        "severity_score": None,
        "regulatory_obligation": None,
        "breach_probability": None,
        "assigned_to": None,
        "ai_draft": None,
        "cluster_id": None,
        "root_cause": None,
        "created_at": datetime.now(timezone.utc),
        "resolved_at": None,
    }
    db_complaint = Complaint(**new_complaint)
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)

    background_tasks.add_task(
        broadcast_event,
        {
            "type": "complaint_created",
            "ts": datetime.now(timezone.utc).isoformat(),
            "complaint_id": str(db_complaint.id),
            "status": db_complaint.status,
            "channel": db_complaint.channel,
            "customer_id": db_complaint.customer_id,
        },
    )

    background_tasks.add_task(
        run_pipeline,
        complaint_id=str(db_complaint.id),
        raw_text=complaint.raw_text,
        channel=complaint.channel,
        customer_id=complaint.customer_id,
        bot_slots=complaint.bot_slots,
        language_code=complaint.language_code
    )


    return db_complaint

@router.get("",response_model=ComplaintListResponse)
def list_complaints(
    status: str = Query(None, description="Filter by complaint status"),
    channel: str = Query(None, description="Filter by complaint channel"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Number of complaints per page"),
    db: Session = Depends(get_db)
):
    filtered_complaints = db.query(Complaint)
    if status:
        filtered_complaints = filtered_complaints.filter(Complaint.status == status)
    if channel:
        filtered_complaints = filtered_complaints.filter(Complaint.channel == channel)

    start = (page - 1) * limit
    return {
        "total": filtered_complaints.count(),
        "page": page,
        "limit": limit,
        "complaints": filtered_complaints.offset(start).limit(limit).all(),
    }

@router.get("/escalations",response_model=ComplaintListResponse)
def list_escalated_complaints(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Number of complaints per page"),
    db: Session = Depends(get_db)
):
    filtered_complaints = db.query(Complaint).filter(
    or_(
        Complaint.status == "escalated",
        (Complaint.breach_probability > 0.70) & (Complaint.status != "resolved")
    )
).order_by(Complaint.breach_probability.desc()) 

    start = (page - 1) * limit
    return {
        "total": filtered_complaints.count(),
        "page": page,
        "limit": limit,
        "complaints": filtered_complaints.offset(start).limit(limit).all(),
    }

@router.get("/{complaint_id}",response_model=ComplaintResponse)
def get_complaint(complaint_id: str, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint

@router.get("/{complaint_id}/sla")
def get_complaint_sla(complaint_id: str):
    status = get_sla_status(complaint_id)
    if status is None:
        raise HTTPException(status_code=404, detail="SLA not set for this complaint")
    return status

VALID_TRANSITIONS = {
    "queued": ["new", "escalated"],
    "new": ["in_progress", "escalated"],
    "in_progress": ["resolved", "escalated"],
    "resolved": [],
    "escalated": []
    }

@router.put("/{complaint_id}/status",response_model=ComplaintResponse)
def update_complaint_status(complaint_id:str, body: StatusUpdate, db: Session = Depends(get_db)):
    
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if body.new_status not in VALID_TRANSITIONS.get(complaint.status, []):
        raise HTTPException(status_code=422, detail=f"Invalid status transition from {complaint.status} to {body.new_status}")

    old_status = complaint.status
    complaint.status = body.new_status
    db.commit()
    db.refresh(complaint)
    broadcast_event(
        {
            "type": "complaint_status_changed",
            "ts": datetime.now(timezone.utc).isoformat(),
            "complaint_id": str(complaint.id),
            "from": old_status,
            "to": complaint.status,
        }
    )
    return complaint

@router.get("/{complaint_id}/draft")
def generate_response_draft(complaint_id: str, tone: str = Query("apologetic"), db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    prompt = f"""You are a bank customer relations officer at Union Bank of India.
Generate a professional, personalized response to this complaint:
"{complaint.raw_text}"

Tone constraints:
- Use a "{tone}" tone.
- Keep the response professional, clear, and reassuring.
- Address the core customer intent: "{complaint.intent or 'resolving their query'}".
- State that we are addressing the issue and provide a timeline or action steps.
- The language of the response should match the language of the complaint if possible (e.g. English, Hindi, etc.).
- Do not include any markdown styling, placeholder texts like '[Your Name]', or greeting system text. Just return the raw response message.
"""
    try:
        completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            max_tokens=250
        )
        draft_text = completion.choices[0].message.content.strip()
    except Exception as e:
        draft_text = f"Dear Customer, we apologize for the inconvenience. We have received your complaint regarding {complaint.complaint_type or 'banking services'} and are investigating it. We will resolve it shortly."

    complaint.ai_draft = draft_text
    db.commit()
    db.refresh(complaint)
    
    return {"complaint_id": complaint_id, "tone": tone, "draft": draft_text}

@router.post("/{complaint_id}/respond")
def respond_and_resolve_complaint(complaint_id: str, body: RespondResolveRequest, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    old_status = complaint.status
    complaint.status = "resolved"
    complaint.resolution_notes = body.response_text
    complaint.resolved_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(complaint)
    
    # Send WebSocket broadcast
    broadcast_event({
        "type": "complaint_status_changed",
        "ts": datetime.now(timezone.utc).isoformat(),
        "complaint_id": str(complaint.id),
        "from": old_status,
        "to": "resolved"
    })
    
    # Close SLA if present in Redis
    try:
        from services.sla_service import clear_sla
        clear_sla(str(complaint.id))
    except Exception:
        pass

    # Closed-loop reply if channel is Telegram and source_ref (chat_id) is present
    telegram_sent = False
    if complaint.channel.lower() == "telegram" and complaint.source_ref:
        bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
        if bot_token:
            url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            payload = {
                "chat_id": complaint.source_ref,
                "text": f"Your ticket {complaint.id} has been resolved.\n\nResolution Notes:\n{body.response_text}"
            }
            try:
                r = requests.post(url, json=payload, timeout=5)
                if r.status_code == 200:
                    telegram_sent = True
                else:
                    print(f"Failed to send Telegram message: {r.text}")
            except Exception as e:
                print(f"Exception sending Telegram reply: {e}")
                
    return {
        "status": "success",
        "message": "Complaint resolved successfully",
        "complaint_id": complaint_id,
        "telegram_sent": telegram_sent
    }

