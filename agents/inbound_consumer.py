import logging
from typing import Any

from kafka.base_consumer import create_consumer, publish_to_dlq
from agents.orchestrator import run_pipeline

logger = logging.getLogger(__name__)

MAX_RETRIES = 3


class PermanentFailure(Exception):
    """Failure that should not be retried — message is malformed or permanently invalid."""


def process_inbound_message(data: dict[str, Any]) -> None:
    """Process a single inbound complaint message.

    Raises PermanentFailure for unrecoverable errors (no retry).
    Other exceptions are considered retryable.
    """
    complaint_id = data.get("complaint_id")
    if not complaint_id:
        raise PermanentFailure("Missing complaint_id in message")

    run_pipeline(
        complaint_id=complaint_id,
        raw_text=data.get("raw_text", ""),
        channel=data.get("channel", "unknown"),
        customer_id=data.get("customer_id"),
        bot_slots=data.get("bot_slots", {}),
        language_code=data.get("language_code", "en"),
    )


def run_consumer() -> None:
    """Run the inbound consumer loop."""
    consumer = create_consumer(
        topics=["complaints.inbound"],
        group_id="inbound-processor",
    )
    if consumer is None:
        logger.error("Could not start consumer - Kafka unavailable")
        return

    for message in consumer:
        data = message.value
        if data is None:
            continue

        try:
            process_inbound_message(data)
            continue
        except PermanentFailure as e:
            logger.error("Permanent failure for complaint %s: %s", data.get("complaint_id"), e)
            publish_to_dlq(data, str(e))
            continue

        for attempt in range(MAX_RETRIES):
            try:
                process_inbound_message(data)
                break
            except Exception as e:
                if attempt == MAX_RETRIES - 1:
                    error_msg = f"Failed after {MAX_RETRIES} retries: {e}"
                    logger.error(error_msg)
                    publish_to_dlq(data, error_msg)
                else:
                    logger.warning("Retry %d/%d for complaint %s", attempt + 1, MAX_RETRIES, data.get("complaint_id"))


if __name__ == "__main__":
    run_consumer()