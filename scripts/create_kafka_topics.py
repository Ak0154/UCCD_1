#!/usr/bin/env python
"""Create required Kafka topics for UCCD."""
import json
import subprocess
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.config import get_settings

TOPICS = [
    {"name": "complaints.inbound", "partitions": 3, "replication": 1},
    {"name": "complaints.dlq", "partitions": 1, "replication": 1},
    {"name": "complaints.translated", "partitions": 3, "replication": 1},
]


def create_topics() -> None:
    settings = get_settings()
    bootstrap = settings.kafka_bootstrap_servers

    for topic in TOPICS:
        cmd = [
            "kafka-topics",
            "--bootstrap-server", bootstrap,
            "--create",
            "--topic", topic["name"],
            "--partitions", str(topic["partitions"]),
            "--replication-factor", str(topic["replication"]),
            "--if-not-exists",
        ]
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                print(f"Created topic: {topic['name']}")
            else:
                print(f"Topic {topic['name']}: {result.stderr.strip()}")
        except FileNotFoundError:
            print("kafka-topics not found. Ensure Kafka binaries are in PATH.")
            print("Topics can also be auto-created with KAFKA_AUTO_CREATE_TOPICS_ENABLE=true")
            return
        except subprocess.TimeoutExpired:
            print(f"Timeout creating topic {topic['name']}")
            return


if __name__ == "__main__":
    try:
        create_topics()
    except ValueError as e:
        print(f"Configuration error: {e}", file=sys.stderr)
        sys.exit(1)