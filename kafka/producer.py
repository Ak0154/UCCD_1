import json
import logging
from typing import Any, Optional

from api.config import get_settings

logger = logging.getLogger(__name__)

try:
    from kafka import KafkaProducer
    from kafka.errors import KafkaError, NoBrokersAvailable
    KAFKA_AVAILABLE = True
except ImportError:
    KAFKA_AVAILABLE = False
    KafkaProducer = None  # type: ignore
    KafkaError = Exception  # type: ignore
    NoBrokersAvailable = Exception  # type: ignore

_producer: Optional["KafkaProducer[bytes, bytes]"] = None


def _get_producer() -> Optional["KafkaProducer[bytes, bytes]"]:
    global _producer
    if _producer is not None:
        return _producer

    if not KAFKA_AVAILABLE:
        logger.warning("kafka-python not installed; producer unavailable")
        return None

    settings = get_settings()
    try:
        _producer = KafkaProducer(
            bootstrap_servers=settings.kafka_bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            key_serializer=lambda k: str(k).encode("utf-8") if k else None,
            acks="all",
            retries=3,
            linger_ms=10,
        )
        logger.info(f"Kafka producer connected to {settings.kafka_bootstrap_servers}")
        return _producer
    except NoBrokersAvailable:
        logger.warning(f"Kafka brokers unavailable at {settings.kafka_bootstrap_servers}")
        return None
    except Exception as e:
        logger.error(f"Failed to create Kafka producer: {e}")
        return None


def publish_complaint(
    complaint_data: dict[str, Any],
    topic: str = "complaints.inbound",
    key: str | None = None,
) -> bool:
    producer = _get_producer()
    if producer is None:
        return False

    try:
        future = producer.send(topic, value=complaint_data, key=key)
        record_metadata = future.get(timeout=10)
        logger.info(
            f"Published complaint to {topic} partition {record_metadata.partition} offset {record_metadata.offset}"
        )
        return True
    except KafkaError as e:
        logger.error(f"Failed to publish complaint to {topic}: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error publishing complaint: {e}")
        return False


def close_producer() -> None:
    global _producer
    if _producer is not None:
        _producer.close()
        _producer = None