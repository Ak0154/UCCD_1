from dotenv import load_dotenv
import os
import json
from agents.state import ComplaintState
from api.db.session import get_db
from api.models.complaint import Complaint
from sqlalchemy import not_
from agents.utils import safe_parse_json, groq_chat_completion

load_dotenv()

def run_dna(state: ComplaintState) -> dict:
    text = state["raw_text"]
    
    # Query database for recent active complaints that have cluster_ids
    db = next(get_db())
    try:
        recent_clustered = db.query(Complaint).filter(
            Complaint.status != "resolved",
            Complaint.cluster_id.isnot(None)
        ).order_by(Complaint.created_at.desc()).limit(15).all()
    finally:
        db.close()
    
    # Build list of unique active clusters with a sample complaint text
    active_clusters = {}
    for c in recent_clustered:
        if c.cluster_id not in active_clusters:
            # truncate raw text for Groq prompt context limit
            sample = c.raw_text[:150] + "..." if len(c.raw_text) > 150 else c.raw_text
            active_clusters[c.cluster_id] = sample
            
    # Format clusters for prompt
    cluster_list_str = ""
    if active_clusters:
        for cid, sample in active_clusters.items():
            cluster_list_str += f"- {cid}: Sample: \"{sample}\"\n"
    else:
        cluster_list_str = "None (No active clusters currently)."

    system_prompt = """You are a bank database clustering agent. Your goal is to group incoming complaints semantically to detect outages or systemic issues.
Return ONLY a valid JSON object, with no other text, markdown formatting, or explanations."""

    user_prompt = f"""We have a set of active clusters representing ongoing issues. Check if this new complaint belongs to one of the existing active clusters.

Active Clusters:
{cluster_list_str}

New Complaint Text:
"{text}"

Instructions:
1. Determine if the new complaint is semantically about the same specific issue as one of the active clusters.
2. If it matches an active cluster, return that cluster's ID (e.g., "CLUSTER_UPI_DEBIT_FAIL").
3. If it does NOT match any active cluster, generate a new specific, descriptive snake_case cluster ID prefixed with "CLUSTER_" (e.g., "CLUSTER_ATM_DISPENSE_ERROR" or "CLUSTER_LOAN_DISBURSAL_DELAY"). Make sure it is clear, concise, and relates to the bank's products/services.

Return exactly this structure:
{{
  "cluster_id": "The matched or newly generated cluster ID",
  "is_new_cluster": true/false
}}"""

    chat_completion = groq_chat_completion(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        model="llama-3.1-8b-instant",
        max_tokens=150,
    )
    
    response_text = chat_completion.choices[0].message.content
    fallback_id = "CLUSTER_GENERAL"
    
    if response_text is None:
        return {"cluster_id": fallback_id}
        
    data = safe_parse_json(response_text)
    if not data:
        return {"cluster_id": fallback_id}
        
    try:
        cluster_id = data.get("cluster_id", fallback_id)
        # Standardize cluster_id format
        cluster_id = cluster_id.upper().strip().replace(" ", "_")
        if not cluster_id.startswith("CLUSTER_"):
            cluster_id = "CLUSTER_" + cluster_id
        return {"cluster_id": cluster_id}
    except Exception:
        return {"cluster_id": fallback_id}

if __name__ == "__main__":
    test_state = {
        "raw_text": "I tried to withdraw 5000 INR from the ATM at MG Road but the cash did not dispense. My account was still debited!"
    }
    print(run_dna(test_state))
