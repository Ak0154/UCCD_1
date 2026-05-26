import asyncio
import os
import logging
import threading
import time
from datetime import datetime, timezone

import requests
from sqlalchemy.orm import Session

from services.channels.base import BaseChannel
from api.db.session import get_db
from api.models.complaint import Complaint
from api.models.outbound_message import OutboundMessage
from agents.orchestrator import run_pipeline
from api.websocket import broadcast_event

logger = logging.getLogger(__name__)

TELEGRAM_API = "https://api.telegram.org"


class TelegramChannel(BaseChannel):
    name = "telegram"
    display_name = "Telegram"
    supports_inbound = True
    supports_outbound = True
    inbound_method = "polling"

    def __init__(self, token: str = "", api_host: str = "http://localhost:8000"):
        self.token = token or os.getenv("TELEGRAM_BOT_TOKEN", "")
        self.api_host = api_host or os.getenv("API_HOST", "http://localhost:8000")
        self._thread: threading.Thread | None = None
        self._stop_flag = threading.Event()

    def is_configured(self) -> bool:
        return bool(self.token and self.token.strip() and self.token != "YOUR_TELEGRAM_BOT_TOKEN")

    async def start(self) -> None:
        if not self.is_configured():
            logger.info("Telegram bot token not configured. Skipping.")
            return
        self._stop_flag.clear()
        self._thread = threading.Thread(target=self._poll_updates, daemon=True)
        self._thread.start()
        logger.info("TelegramChannel polling thread started.")

    async def stop(self) -> None:
        self._stop_flag.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=5)
        logger.info("TelegramChannel stopped.")

    def _poll_updates(self) -> None:
        offset = 0
        base_url = f"{TELEGRAM_API}/bot{self.token}"
        logger.info("Telegram Bot listener activated. Polling...")

        while not self._stop_flag.is_set():
            try:
                response = requests.get(
                    f"{base_url}/getUpdates",
                    params={"offset": offset, "timeout": 20},
                    timeout=25,
                )
                if response.status_code != 200:
                    logger.warning(f"Telegram getUpdates returned {response.status_code}. Retrying...")
                    time.sleep(15)
                    continue

                data = response.json()
                updates = data.get("result", [])
                for update in updates:
                    offset = update["update_id"] + 1
                    message = update.get("message", {})
                    chat = message.get("chat", {})
                    chat_id = chat.get("id")
                    text = message.get("text")
                    from_user = message.get("from", {})
                    username = from_user.get("username") or from_user.get("first_name") or "Telegram User"

                    if not text or not chat_id:
                        continue

                    text_strip = text.strip()
                    if text_strip == "/start":
                        requests.post(
                            f"{base_url}/sendMessage",
                            json={
                                "chat_id": chat_id,
                                "text": "🏦 *Welcome to Union Bank of India Support!*\n\nPlease type your complaint or issue details below. Our AI-driven triage system will log it immediately and provide an initial assessment.",
                                "parse_mode": "Markdown",
                            },
                        )
                        continue

                    logger.info(f"Telegram received ticket from {username} (Chat ID {chat_id}): '{text_strip[:40]}...'")
                    requests.post(f"{base_url}/sendChatAction", json={"chat_id": chat_id, "action": "typing"})

                    payload = {
                        "customer_id": f"TG_{chat_id}",
                        "channel": "telegram",
                        "source_ref": str(chat_id),
                        "raw_text": text_strip,
                    }

                    try:
                        res = requests.post(f"{self.api_host}/api/v1/complaints", json=payload, timeout=8)
                        if res.status_code == 201:
                            complaint_data = res.json()
                            complaint_id = complaint_data.get("id")
                            requests.post(
                                f"{base_url}/sendMessage",
                                json={
                                    "chat_id": chat_id,
                                    "text": f"🎫 *Ticket Logged!*\n\n*Ticket ID:* `{complaint_id}`\n\nOur AI triage agents are reviewing your case. We will send you an initial report and estimated resolution time shortly.",
                                    "parse_mode": "Markdown",
                                },
                            )
                        else:
                            logger.warning(f"API returned status {res.status_code}: {res.text}")
                            self._save_fallback_db(base_url, chat_id, text_strip)
                    except Exception as api_err:
                        logger.warning(f"Failed to post to API: {api_err}. Running DB write fallback...")
                        self._save_fallback_db(base_url, chat_id, text_strip)

            except Exception as e:
                logger.error(f"Error in Telegram polling cycle: {e}")
                time.sleep(5)

    def _save_fallback_db(self, base_url: str, chat_id: int, text: str) -> None:
        db = next(get_db())
        try:
            from uuid import uuid4

            complaint_id = uuid4()
            db_complaint = Complaint(
                id=complaint_id,
                customer_id=f"TG_{chat_id}",
                channel="telegram",
                source_ref=str(chat_id),
                raw_text=text,
                status="queued",
                created_at=datetime.now(timezone.utc),
            )
            db.add(db_complaint)
            db.commit()

            requests.post(
                f"{base_url}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": f"🎫 *Ticket Logged (DB Fallback)!*\n\n*Ticket ID:* `{complaint_id}`\n\nOur AI agents are analyzing your case.",
                    "parse_mode": "Markdown",
                },
            )

            broadcast_event({
                "type": "complaint_created",
                "ts": datetime.now(timezone.utc).isoformat(),
                "complaint_id": str(complaint_id),
                "status": "queued",
                "channel": "telegram",
                "customer_id": f"TG_{chat_id}",
            })

            threading.Thread(
                target=run_pipeline,
                kwargs={
                    "complaint_id": str(complaint_id),
                    "raw_text": text,
                    "channel": "telegram",
                    "customer_id": f"TG_{chat_id}",
                },
                daemon=True,
            ).start()

        except Exception as db_err:
            logger.error(f"DB Fallback write failed: {db_err}")
            requests.post(
                f"{base_url}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": "❌ We are experiencing database issues. Your complaint could not be saved. Please try again later.",
                },
            )
        finally:
            db.close()

    async def send_message(self, source_ref: str, text: str, **kwargs) -> bool:
        if not self.token:
            return False
        url = f"{TELEGRAM_API}/bot{self.token}/sendMessage"
        payload = {"chat_id": source_ref, "text": text}
        payload.update(kwargs)
        try:
            r = requests.post(url, json=payload, timeout=10)
            success = r.status_code == 200
            self._log_outbound(source_ref, text, success, None if success else r.text, r.json().get("result", {}).get("message_id") if success else None)
            return success
        except Exception as e:
            self._log_outbound(source_ref, text, False, str(e))
            logger.error(f"Telegram send_message failed: {e}")
            return False

    async def format_resolution_message(self, complaint, resolution_text: str) -> str:
        return f"Your ticket {complaint.id} has been resolved.\n\nResolution Notes:\n{resolution_text}"

    async def format_triage_message(self, complaint, ai_draft: str) -> dict:
        tier_hours = {"REGULATORY": 5, "HIGH": 24, "MEDIUM": 48, "NORMAL": 72}
        sla_hours = tier_hours.get(complaint.sla_tier, 72)
        msg = (
            f"🎫 *Ticket Triage Assessment ready!*\n\n"
            f"*Ticket ID:* `{complaint.id}`\n"
            f"*Category:* {complaint.complaint_type or 'General'}\n"
            f"*SLA Deadline:* {sla_hours} hours\n"
            f"*Severity Level:* {complaint.severity_score:.2f}\n\n"
            f"🤖 *AI Assistant's Response Draft:*\n{ai_draft}"
        )
        return {"text": msg, "parse_mode": "Markdown"}

    def _log_outbound(self, source_ref: str, text: str, success: bool, error: str | None, provider_id: str | None = None) -> None:
        db = next(get_db())
        try:
            record = OutboundMessage(
                channel="telegram",
                source_ref=source_ref,
                message_text=text,
                status="sent" if success else "failed",
                provider_message_id=str(provider_id) if provider_id else None,
                error_message=error,
            )
            db.add(record)
            db.commit()
        except Exception:
            pass
        finally:
            db.close()