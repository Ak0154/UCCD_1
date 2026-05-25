"""
Train a Random Forest model to predict SLA violation risk.

Usage:
    python ml/train_violation_model.py
    # Reads ml/training_data.csv, writes ml/violation_predictor.pkl
"""

import csv
import pickle
import logging
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

logger = logging.getLogger(__name__)

FEATURE_COLUMNS = [
    "severity_score", "priority_tier", "sla_tier_hours",
    "queue_size", "regulatory_flag", "vip_customer",
    "channel_is_digital", "hour_of_day",
]
LABEL_COLUMN = "sla_breached"

INPUT_FILE = "ml/training_data.csv"
OUTPUT_FILE = "ml/violation_predictor.pkl"


def load_data(path: str):
    features, labels = [], []
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            features.append([float(row[col]) for col in FEATURE_COLUMNS])
            labels.append(int(row[LABEL_COLUMN]))
    return features, labels


def train() -> None:
    X, y = load_data(INPUT_FILE)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    report = classification_report(y_test, y_pred, target_names=["met", "breached"])
    print(report)

    with open(OUTPUT_FILE, "wb") as f:
        pickle.dump(model, f)
    print(f"Model saved → {OUTPUT_FILE}")


if __name__ == "__main__":
    train()