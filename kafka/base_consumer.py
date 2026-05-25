import json
import logging
from datetime import datetime, timezone
from typing import Any

try:
    from kafka import KafkaConsumer
    from kafka.errors import KafkaError, NoBrokersAvailable
    KAFKA_AVAILABLE = True
except ImportError:
    KAFKA_AVAILABLE = False
    KafkaConsumer = None  # type: ignore
    KafkaError = Exception  # type: ignore
    NoBrokersAvailable = Exception  # type: ignore

from api.config import get_settings

logger = logging.getLogger(__name__)


def create_consumer(
    topics: list[str],
    group_id: str,
    auto_offset_reset: str = "earliest",
) -> "KafkaConsumer[bytes, bytes]" | None:
    if not KAFKA_AVAILABLE:
        logger.warning("kafka-python not installed; consumer unavailable")
        return None

    settings = get_settings()
    try:
        consumer = KafkaConsumer(
            *topics,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            group_id=group_id,
            auto_offset_reset=auto_offset_reset,
            value_deserializer=lambda v: json.loads(v.decode("utf-8")) if v else None,
            key_deserializer=lambda k: k.decode("utf-8") if k else None,
            enable_auto_commit=True,
            auto_commit_interval_ms=5000,
        )
        logger.info(f"Kafka consumer connected to topics: {topics}")
        return consumer
    except NoBrokersAvailable:
        logger.warning(f"Kafka brokers unavailable at {settings.kafka_bootstrap_servers}")
        return None
    except Exception as e:
        logger.error(f"Failed to create Kafka consumer: {e}")
        return None


def publish_to_dlq(
    message: dict[str, Any],
    error: str,
    dlq_topic: str = "complaints.dlq",
) -> bool:
    from kafka.producer import publish_complaint

    payload = {
        "original_message": message,
        "error": error,
        "failed_at": datetime.now(timezone.utc).isoformat(),
    }
    return publish_complaint(payload, topic=dlq_topic, key=message.get("complaint_id"))