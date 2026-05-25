import asyncio
import os
import logging
import requests
from dotenv import load_dotenv
from langgraph.graph import StateGraph, START, END
from agents.state import ComplaintState
from agents.nlp_classifier import classify_complaint
from agents.emotion_agent import run_emotion
from agents.dna_agent import run_dna
from agents.severity_agent import run_severity
from agents.escalation_agent import run_escalation
from agents.root_cause_agent import run_root_cause
from agents.timing import time_node

run_emotion_timed = time_node("emotion")(run_emotion)
run_dna_timed = time_node("dna")(run_dna)
run_severity_timed = time_node("severity")(run_severity)
run_escalation_timed = time_node("escalation")(run_escalation)
run_root_cause_timed = time_node("root_cause")(run_root_cause)

from agents.utils import groq_chat_completion
from api.db.session import get_db
from api.models.complaint import Complaint
from datetime import datetime, timezone, timedelta
from services.sla_service import set_sla_timer
from services.regulatory_service import set_regulatory_timer
from services.translation_service import SarvamTranslationService, TranslationStage

load_dotenv()

logger = logging.getLogger(__name__)

IST = timezone(timedelta(hours=5, minutes=30))

@time_node("translation")
async def run_translation(
    state: ComplaintState,
    translation_service: SarvamTranslationService = None,
) -> dict:
    svc = translation_service or SarvamTranslationService()
    try:
        result = await svc.translate(
            text=state["raw_text"],
            stage=TranslationStage.INBOUND
        )
    except Exception as e:
        logger.error(f"Translation failed in pipeline: {e}")
        return {
            "translated_text": state["raw_text"],
            "detected_language": None,
            "translation_status": "failed"
        }
    return {
        "translated_text": result["translated_text"],
        "detected_language": result["detected_language"],
        "translation_status": result["translation_status"]
    }

@time_node("nlp")
def run_nlp(state: ComplaintState) -> dict:
    text = state.get("translated_text") or state["raw_text"]
    result = classify_complaint(text)
    return {
        "complaint_type": result.get("complaint_type"),
        "product_code": result.get("product_code"),
        "intent": result.get("intent"),
        "regulatory_obligation": result.get("regulatory_obligation"),
        "type_confidence": result.get("type_confidence")
    }

@time_node("merge_and_save")
def merge_and_save(state: ComplaintState) -> dict:
    db = next(get_db())
    try:
        complaint_id_str = str(state["complaint_id"])
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id_str).first()
        if complaint is None:
            return {}
            
        complaint.complaint_type = state.get("complaint_type")
        complaint.product_code = state.get("product_code")
        complaint.intent = state.get("intent")
        complaint.regulatory_obligation = state.get("regulatory_obligation")
        complaint.type_confidence = state.get("type_confidence")
        
        complaint.emotion_arc = state.get("emotion_arc")
        complaint.severity_score = state.get("severity_score")
        complaint.sla_tier = state.get("sla_tier")
        complaint.priority_tier = state.get("priority_tier", 4)
        complaint.sla_deadline = state.get("sla_deadline")
        
        complaint.breach_probability = state.get("breach_probability")
        complaint.viral_risk_score = state.get("viral_risk_score")
        complaint.cluster_id = state.get("cluster_id")

        complaint.pre_escalate = state.get("pre_escalate", False)
        complaint.escalation_reason = state.get("escalation_reason")

        complaint.root_cause = state.get("root_cause")

        complaint.detected_language = state.get("detected_language")
        complaint.translated_text = state.get("translated_text")
        complaint.translation_status = state.get("translation_status", "pending")

        complaint.updated_at = datetime.now(IST)

        db.commit()

        # Send live updates to Telegram customer on pipeline completion
        if complaint.channel.lower() == "telegram" and complaint.source_ref:
            try:
                token = os.getenv("TELEGRAM_BOT_TOKEN")
                if token:
                    # Generate AI response draft first if not generated
                    ai_draft = complaint.ai_draft
                    if not ai_draft:
                        prompt = f"""You are a bank customer relations officer at Union Bank of India.
Generate a professional, personalized response to this complaint:
"{complaint.raw_text}"
Tone constraints:
- Use an "apologetic" tone.
- Keep the response professional, clear, and reassuring.
- Address the core customer intent.
- Do not include any markdown styling or greeting system text. Just return the raw response message."""
                        completion = groq_chat_completion(
                            messages=[{"role": "user", "content": prompt}],
                            model="llama-3.1-8b-instant",
                            max_tokens=250
                        )
                        ai_draft = completion.choices[0].message.content.strip()
                        complaint.ai_draft = ai_draft
                        db.commit()
                    
                    # Format message
                    tier_hours = {"REGULATORY": 5, "HIGH": 24, "MEDIUM": 48, "NORMAL": 72}
                    sla_hours = tier_hours.get(complaint.sla_tier, 72)
                    msg = f"🎫 *Ticket Triage Assessment ready!*\n\n" \
                          f"*Ticket ID:* `{complaint.id}`\n" \
                          f"*Category:* {complaint.complaint_type or 'General'}\n" \
                          f"*SLA Deadline:* {sla_hours} hours\n" \
                          f"*Severity Level:* {complaint.severity_score:.2f}\n\n" \
                          f"🤖 *AI Assistant's Response Draft:*\n{ai_draft}"
                    
                    url = f"https://api.telegram.org/bot{token}/sendMessage"
                    requests.post(url, json={
                        "chat_id": complaint.source_ref,
                        "text": msg,
                        "parse_mode": "Markdown"
                    })
            except Exception as tg_err:
                logger.warning(f"Failed to send pipeline completion update to Telegram: {tg_err}")

        if complaint.sla_tier:
            try:
                set_sla_timer(str(complaint.id), complaint.sla_tier)
            except Exception as e:
                # Handle cases where redis is not running or fails, to let the flow complete
                logger.warning(f"Failed to set SLA timer in Redis: {e}")

        if complaint.regulatory_obligation:
            try:
                set_regulatory_timer(str(complaint.id), complaint.regulatory_obligation)
            except Exception as e:
                logger.warning(f"Failed to set regulatory timer in Redis: {e}")
    finally:
        db.close()
            
    return {}

# Define the LangGraph State Machine
# Dependency-aware parallel pipeline:
#
#   translation → nlp ──┬── emotion ──────────────────────┐
#                       │                                  │
#                       └── severity ──┬── dna ── root_cause ── merge_and_save
#                                      │
#                                      └── escalation ───────────┘
#
# Independent branches (emotion || severity, dna || escalation) execute in parallel.

graph = StateGraph(ComplaintState)

graph.add_node("translation", run_translation)
graph.add_node("nlp", run_nlp)
graph.add_node("emotion", run_emotion_timed)
graph.add_node("dna", run_dna_timed)
graph.add_node("severity", run_severity_timed)
graph.add_node("escalation", run_escalation_timed)
graph.add_node("root_cause", run_root_cause_timed)
graph.add_node("merge_and_save", merge_and_save)

graph.add_edge(START, "translation")
graph.add_edge("translation", "nlp")

# Fan-out: nlp feeds emotion and severity in parallel
graph.add_edge("nlp", "emotion")
graph.add_edge("nlp", "severity")

# Fan-out: severity feeds dna and escalation in parallel
graph.add_edge("severity", "dna")
graph.add_edge("severity", "escalation")

# root_cause waits for dna (needs cluster_id)
graph.add_edge("dna", "root_cause")

# Fan-in: merge_and_save gathers emotion, escalation, root_cause
graph.add_edge("emotion", "merge_and_save")
graph.add_edge("escalation", "merge_and_save")
graph.add_edge("root_cause", "merge_and_save")
graph.add_edge("merge_and_save", END)

pipeline = graph.compile()

def run_pipeline(
    complaint_id: str,
    raw_text: str,
    channel: str,
    customer_id: str,
    bot_slots: dict = None,
    language_code: str = None
) -> ComplaintState:
    initial_state : ComplaintState = {
        "complaint_id": complaint_id,
        "raw_text": raw_text,
        "channel": channel,
        "customer_id": customer_id,
        "bot_slots": bot_slots or {},
        "language_code": language_code
    }
    return asyncio.run(pipeline.ainvoke(initial_state))
