"""
Generate synthetic training data for the SLA violation prediction model.

Each row represents a complaint snapshot with features available at triage time:
- severity_score (0..1)
- priority_tier (1..5)
- sla_tier_hours (5, 24, 48, or 72)
- queue_size (number of active tickets at ingestion time)
- regulatory_flag (0 or 1)
- vip_customer (0 or 1)
- channel_is_digital (0 or 1)
- hour_of_day (0..23)

Target label: sla_breached (0 or 1) — whether the complaint eventually breached its SLA.

Usage:
    python ml/generate_training_data.py
    # writes ml/training_data.csv
"""

import csv
import random
from datetime import datetime, timezone, timedelta

OUTPUT_FILE = "ml/training_data.csv"
NUM_SAMPLES = 5000

TIER_HOURS = {"REGULATORY": 5, "HIGH": 24, "MEDIUM": 48, "NORMAL": 72}


def _breach_label(severity: float, priority: int, tier_hours: int, queue_size: int,
                  regulatory: int, vip: int) -> int:
    """Heuristic label: higher severity + smaller tier + larger queue -> more likely breach."""
    score = 0.0
    score += severity * 0.35
    score += (priority / 5.0) * 0.20
    score += (1.0 - tier_hours / 72.0) * 0.25
    score += min(queue_size / 25.0, 1.0) * 0.15
    score += regulatory * 0.05
    if score > random.uniform(0.45, 0.55):
        return 1
    return 0


def generate() -> None:
    random.seed(42)

    with open(OUTPUT_FILE, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "severity_score", "priority_tier", "sla_tier_hours",
            "queue_size", "regulatory_flag", "vip_customer",
            "channel_is_digital", "hour_of_day", "sla_breached"
        ])

        for _ in range(NUM_SAMPLES):
            severity = round(random.uniform(0.0, 1.0), 3)
            priority = random.randint(1, 5)
            tier_hours = random.choice([5, 24, 48, 72])
            queue_size = random.randint(0, 30)
            regulatory = 1 if random.random() < 0.12 else 0
            vip = 1 if random.random() < 0.08 else 0
            channel_digital = 1 if random.random() < 0.75 else 0
            hour = random.randint(0, 23)
            breached = _breach_label(severity, priority, tier_hours, queue_size, regulatory, vip)

            writer.writerow([
                severity, priority, tier_hours,
                queue_size, regulatory, vip,
                channel_digital, hour, breached
            ])

    print(f"Generated {NUM_SAMPLES} samples → {OUTPUT_FILE}")


if __name__ == "__main__":
    generate()