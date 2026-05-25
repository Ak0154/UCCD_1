from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, Dict
from sqlalchemy.orm import Session
from api.db.session import get_db
from api.models.complaint import Complaint
from api.auth import require_role
from api.models.user import User

router = APIRouter(prefix="/api/v1/simulation", tags=["simulation"])

class SimulationRequest(BaseModel):
    staff_adjustment: int = 0  # e.g., +3 agents
    volume_spike: float = 0.0  # e.g., 0.50 for +50% volume spike
    sla_hours_override: Optional[Dict[str, int]] = None  # e.g. {"HIGH": 12}
    policy_mode: str = "standard"  # "standard", "auto_refund", "bypass_kyc"

@router.post("/run")
def run_simulation(
    body: SimulationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("SUPERVISOR")),
):
    """
    Simulates operational performance parameters (SLA compliance, average resolution times,
    agent stress indices, cost impacts) under various staffing and volume load combinations.
    """
    # 1. Fetch current queue statistics
    total_complaints = db.query(Complaint).count()
    active_complaints = db.query(Complaint).filter(Complaint.status != "resolved").count()
    breached_complaints = db.query(Complaint).filter(Complaint.sla_breached == True).count()
    
    base_compliance = ((total_complaints - breached_complaints) / total_complaints * 100) if total_complaints > 0 else 92.5
    base_res_time = 36.5 # hours baseline

    # 2. Compute staffing adjustments
    # Adding agents decreases resolution times and increases compliance
    # Removing agents increases resolution times, breaches, and stress
    staff_factor = 1.0 - (body.staff_adjustment * 0.08)  # 8% speedup per agent
    if staff_factor < 0.3:
        staff_factor = 0.3 # floor
    elif staff_factor > 2.0:
        staff_factor = 2.0 # ceiling

    # 3. Compute volume adjustments
    volume_factor = 1.0 + body.volume_spike

    # 4. Compute policy factor
    policy_efficiency = 1.0
    policy_cost_delta = 0.0
    
    if body.policy_mode == "auto_refund":
        policy_efficiency = 0.85 # 15% reduction in handling time due to auto-refunds
        policy_cost_delta = active_complaints * 15.0 # costs $15 per active complaint in refunds
    elif body.policy_mode == "bypass_kyc":
        policy_efficiency = 0.90 # 10% faster KYC resolutions
        policy_cost_delta = active_complaints * 5.0

    # 5. Project metrics
    projected_res_time = base_res_time * staff_factor * volume_factor * policy_efficiency
    
    # SLA Compliance impacts
    sla_impact = (body.staff_adjustment * 2.5) - (body.volume_spike * 15.0)
    if body.policy_mode == "auto_refund":
        sla_impact += 5.0 # faster responses improve compliance
        
    projected_compliance = base_compliance + sla_impact
    projected_compliance = min(max(projected_compliance, 45.0), 99.8)

    # 6. Calculate Stress index (1 to 10 scale)
    # Stress is proportional to volume and inversely proportional to staff
    active_ratio = (active_complaints * volume_factor) / max(1, 10 + body.staff_adjustment)
    stress_score = min(max(int(active_ratio * 2.0), 1), 10)
    
    stress_labels = {
        1: "Minimal", 2: "Low", 3: "Low",
        4: "Moderate", 5: "Moderate", 6: "High",
        7: "High", 8: "Very High", 9: "Severe", 10: "Critical"
    }
    stress_label = stress_labels.get(stress_score, "Moderate")

    # 7. Generate actionable recommendations
    recommendation = "Current operational configuration is stable."
    if projected_compliance < 80.0:
        recommendation = f"Danger: SLA compliance is projected to fall to {projected_compliance:.1f}%. Add at least {abs(int(body.volume_spike * 8))} agents or enable Auto-Refunds to buffer load."
    elif body.volume_spike > 0.30 and body.staff_adjustment <= 0:
        recommendation = "High volume spike warning. Recommend adding at least 2 temporary agents to prevent queue blockages."
    elif body.staff_adjustment > 3 and projected_compliance > 95.0:
        recommendation = "Agent staffing exceeds optimal capacity. You may safely reassign 1-2 agents to other departments without breaching SLAs."

    return {
        "status": "success",
        "parameters": {
            "staff_adjustment": body.staff_adjustment,
            "volume_spike": body.volume_spike,
            "policy_mode": body.policy_mode
        },
        "baseline": {
            "sla_compliance_rate": round(base_compliance, 1),
            "avg_resolution_time_hrs": round(base_res_time, 1),
            "agent_stress_index": "Moderate"
        },
        "projected": {
            "sla_compliance_rate": round(projected_compliance, 1),
            "avg_resolution_time_hrs": round(projected_res_time, 1),
            "agent_stress_level": stress_label,
            "cost_delta_usd": round(policy_cost_delta, 2)
        },
        "recommendation": recommendation
    }
