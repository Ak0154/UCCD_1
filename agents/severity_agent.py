import os
from datetime import datetime, timezone, timedelta
from agents.state import ComplaintState
from api.db.session import get_db
from api.models.complaint import Complaint
from agents.utils import safe_parse_json, groq_chat_completion

IST = timezone(timedelta(hours=5, minutes=30))

TIER_HOURS = {
    "REGULATORY": 5,
    "HIGH": 24,
    "MEDIUM": 48,
    "NORMAL": 72
}

def run_severity(state: ComplaintState) -> dict:
    text = state["raw_text"]
    complaint_id = state.get("complaint_id")
    
    # Query database to get transient flags: vip_customer, regulatory_flag
    vip_customer = False
    regulatory_flag = False
    
    if complaint_id:
        try:
            db = next(get_db())
            try:
                complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
                if complaint:
                    vip_customer = complaint.vip_customer
                    regulatory_flag = complaint.regulatory_flag
            finally:
                db.close()
        except Exception:
            pass

    # Call Groq to evaluate base severity
    prompt = f"""You are a bank risk officer analyzing a customer's complaint text.
Grade the severity of the complaint on a scale from 0.0 (Low risk, simple query) to 1.0 (Critical risk, system outage, major financial loss, security breach, fraud, legal threat).

Consider:
- Financial loss (e.g., unauthorized transactions, double debits)
- Security risks (e.g., phishing, card compromised)
- Technical outages (e.g., app/UPI completely down)
- Legal/Regulatory risk (e.g., threatening ombudsman, lawsuit)

Return ONLY a valid JSON object with the following key and value, with NO other text or markdown formatting:
{{
  "base_severity": 0.0 to 1.0
}}"""

    chat_completion = groq_chat_completion(
        messages=[
            {
                "role": "system",
                "content": prompt
            },
            {
                "role": "user",
                "content": text
            }
        ],
        model="llama-3.1-8b-instant",
        max_tokens=100,
    )
    
    response_text = chat_completion.choices[0].message.content
    base_severity = 0.3 # default fallback
    
    if response_text:
        data = safe_parse_json(response_text)
        if data:
            try:
                base_severity = float(data.get("base_severity", 0.3))
            except Exception:
                pass

    # Apply banking weights
    final_score = base_severity
    
    # 1. VIP Customer check (+0.2)
    if vip_customer:
        final_score += 0.2
        
    # 2. Regulatory check (+0.4)
    regulatory_obligation = state.get("regulatory_obligation", "none")
    if regulatory_obligation != "none" or regulatory_flag:
        final_score += 0.4
        
    # 3. Emotion Intensity check (+0.2)
    emotion_arc = state.get("emotion_arc", {})
    intensity = emotion_arc.get("intensity", 5)
    if intensity >= 8:
        final_score += 0.2
        
    # Clamp final score between 0.0 and 1.0
    final_score = min(max(final_score, 0.0), 1.0)
    
    # Map to SLA Tier
    if regulatory_obligation != "none" or regulatory_flag:
        sla_tier = "REGULATORY"
        priority_tier = 1
    elif final_score >= 0.75:
        sla_tier = "HIGH"
        priority_tier = 1
    elif final_score >= 0.40:
        sla_tier = "MEDIUM"
        priority_tier = 2
    else:
        sla_tier = "NORMAL"
        priority_tier = 3 if vip_customer else 4

    # Calculate SLA Deadline
    hours = TIER_HOURS.get(sla_tier, 72)
    sla_deadline = datetime.now(IST) + timedelta(hours=hours)

    return {
        "severity_score": final_score,
        "sla_tier": sla_tier,
        "priority_tier": priority_tier,
        "sla_deadline": sla_deadline
    }

if __name__ == "__main__":
    test_state = {
        "raw_text": "Someone stole my credit card and made unauthorized purchases of 50000 Rupees! Block it now!",
        "regulatory_obligation": "none",
        "emotion_arc": {"intensity": 9}
    }
    print(run_severity(test_state))
