import os
from agents.state import ComplaintState
from api.db.session import get_db
from api.models.complaint import Complaint
from agents.utils import groq_chat_completion

TIER_HOURS = {
    "REGULATORY": 5,
    "HIGH": 24,
    "MEDIUM": 48,
    "NORMAL": 72
}

def run_escalation(state: ComplaintState) -> dict:
    severity_score = state.get("severity_score", 0.5)
    sla_tier = state.get("sla_tier", "NORMAL")
    sla_hours = TIER_HOURS.get(sla_tier, 72)
    
    # Query database for current queue size
    try:
        db = next(get_db())
        try:
            queue_size = db.query(Complaint).filter(
                Complaint.status.in_(["queued", "in_progress"])
            ).count()
        finally:
            db.close()
    except Exception:
        queue_size = 5 # fallback if db check fails

    # Queue load factor (scaled between 0.0 and 1.0, capped at 20 complaints)
    queue_factor = min(queue_size / 20.0, 1.0)
    
    # SLA duration factor (shorter SLA means higher breach risk)
    sla_factor = 1.0 - (sla_hours / 72.0)
    
    # Calculate probability
    # Weights: 40% Severity, 40% Queue Load, 20% SLA Ugency
    breach_probability = (0.4 * severity_score) + (0.4 * queue_factor) + (0.2 * sla_factor)
    breach_probability = min(max(breach_probability, 0.0), 1.0)
    
    pre_escalate = False
    escalation_reason = None
    
    if breach_probability > 0.70:
        pre_escalate = True
        
        # Ask Groq Llama-3.1 to generate a concise, qualitative risk reason
        prompt = f"""You are a bank supervisor's risk monitoring assistant.
An incoming complaint has been flagged for PRE-ESCALATION (risk of breaching the SLA deadline).
Explain concisely (1-2 sentences) why this ticket is at risk.

Context:
- Complaint Raw Text snippet: "{state['raw_text'][:200]}"
- Calculated Severity Score: {severity_score:.2f}
- SLA Tier: {sla_tier} ({sla_hours} hours deadline)
- Current Active Queue Size: {queue_size} pending tickets
- Estimated Breach Probability: {breach_probability * 100:.0f}%

Your response must be a professional warning alert. Do not include markdown formatting or quotes.
Example response: High severity card fraud ticket under short 24-hour SLA. Immediate risk due to 18 active tickets in the queue."""

        try:
            chat_completion = groq_chat_completion(
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model="llama-3.1-8b-instant",
                max_tokens=100,
            )
            escalation_reason = chat_completion.choices[0].message.content.strip()
        except Exception as e:
            escalation_reason = f"High risk of SLA breach ({breach_probability*100:.0f}%) due to severity and queue volume."
            
    return {
        "breach_probability": breach_probability,
        "pre_escalate": pre_escalate,
        "escalation_reason": escalation_reason
    }

if __name__ == "__main__":
    test_state = {
        "raw_text": "I can't access my net banking account and need to pay my monthly loan installment immediately!",
        "severity_score": 0.85,
        "sla_tier": "HIGH"
    }
    print(run_escalation(test_state))
