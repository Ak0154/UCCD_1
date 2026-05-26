import hmac
import hashlib
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session

from api.db.session import get_db
from api.models.webhook_event import WebhookEvent
from api.config import get_settings
from services.complaint_service import create_complaint_internal

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/webhooks", tags=["webhooks"])


def _verify_sendgrid_signature(payload: bytes, signature: str, webhook_key: str) -> bool:
    if not webhook_key or not signature:
        return False
    expected = hmac.new(webhook_key.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def _handle_complaint(event: WebhookEvent, complaint_payload: dict, db: Session) -> None:
    try:
        complaint = create_complaint_internal(complaint_payload)
        event.complaint_id = str(complaint.id)
        event.processed = True
        event.processed_at = datetime.now(timezone.utc)
    except Exception as e:
        logger.error(f"Failed to create complaint from webhook: {e}")
        event.error_message = str(e)


@router.post("/email")
async def sendgrid_inbound(request: Request, db: Session = Depends(get_db)):
    settings = get_settings()
    if not settings.email.is_configured():
        raise HTTPException(status_code=503, detail="Email channel not configured")

    body = await request.body()
    signature = request.headers.get("X-Twilio-Email-Event-Webhook-Signature", "")

    if settings.email.inbound_webhook_key:
        if not _verify_sendgrid_signature(body, signature, settings.email.inbound_webhook_key):
            raise HTTPException(status_code=401, detail="Invalid webhook signature")

    try:
        payload = await request.json()
    except Exception:
        payload = {"raw_body": body.decode(errors="replace")}

    event = WebhookEvent(
        channel="email",
        event_type="inbound_email",
        raw_payload=payload if isinstance(payload, dict) else {"data": str(payload)},
        received_at=datetime.now(timezone.utc),
    )
    db.add(event)
    db.commit()

    try:
        envelopes = payload.get("envelope", {})
        from_addr = envelopes.get("from", payload.get("from", ""))
        subject = payload.get("subject", "")
        text = payload.get("text", payload.get("html", ""))
        sg_message_id = payload.get("sg_message_id", "")

        if not text or not from_addr:
            event.processed = True
            event.error_message = "Missing required fields (from/text)"
            db.commit()
            return {"status": "ignored", "reason": "missing_fields"}

        complaint_payload = {
            "customer_id": from_addr,
            "channel": "email",
            "source_ref": sg_message_id or from_addr,
            "raw_text": f"Subject: {subject}\n\n{text}",
            "bot_slots": {"email_subject": subject, "sg_message_id": sg_message_id},
        }
        _handle_complaint(event, complaint_payload, db)

    except Exception as e:
        logger.error(f"SendGrid webhook processing failed: {e}")
        event.error_message = str(e)

    db.commit()
    return {"status": "received"}


@router.post("/whatsapp")
async def openwa_callback(request: Request, db: Session = Depends(get_db)):
    settings = get_settings()
    if not settings.whatsapp.is_configured():
        raise HTTPException(status_code=503, detail="WhatsApp channel not configured")

    body = await request.body()
    try:
        payload = await request.json()
    except Exception:
        payload = {"raw_body": body.decode(errors="replace")}

    event = WebhookEvent(
        channel="whatsapp",
        event_type=payload.get("event", "message"),
        raw_payload=payload if isinstance(payload, dict) else {"data": str(payload)},
        received_at=datetime.now(timezone.utc),
    )
    db.add(event)
    db.commit()

    try:
        chat_id = payload.get("chatId") or payload.get("from")
        text = payload.get("body") or payload.get("content", "")
        sender = payload.get("sender", {}).get("id", payload.get("author", ""))

        if not text or not chat_id:
            event.processed = True
            event.error_message = "Missing required fields (chatId/body)"
            db.commit()
            return {"status": "ignored", "reason": "missing_fields"}

        complaint_payload = {
            "customer_id": sender or f"WA_{chat_id}",
            "channel": "whatsapp",
            "source_ref": chat_id,
            "raw_text": text,
        }
        _handle_complaint(event, complaint_payload, db)

    except Exception as e:
        logger.error(f"open-wa webhook processing failed: {e}")
        event.error_message = str(e)

    db.commit()
    return {"status": "received"}


@router.get("/{channel}/health")
def webhook_health(channel: str):
    from services.channels import get_channel

    ch = get_channel(channel)
    if ch is None:
        raise HTTPException(status_code=404, detail=f"Channel '{channel}' not registered")
    return {"channel": ch.name, "display_name": ch.display_name, "enabled": ch.enabled}


@router.get("/status")
def channel_status():
    from services.channels import list_channels
    from api.schemas.channel import ChannelStatus

    channels = [
        ChannelStatus(
            name=ch.name,
            display_name=ch.display_name,
            enabled=ch.enabled,
            supports_inbound=ch.supports_inbound,
            supports_outbound=ch.supports_outbound,
            inbound_method=ch.inbound_method,
        )
        for ch in list_channels()
    ]
    return {"channels": [c.model_dump() for c in channels]}