import asyncio
import logging
import threading
import time

from services.channels.base import BaseChannel
from api.config import get_settings
from api.models.outbound_message import OutboundMessage
from api.db.session import get_db

logger = logging.getLogger(__name__)


class InstagramChannel(BaseChannel):
    name = "instagram"
    display_name = "Instagram"
    supports_inbound = True
    supports_outbound = True
    inbound_method = "userbot"

    def __init__(self):
        settings = get_settings()
        self._settings = settings.instagram
        self._client = None
        self._own_user_id: str | None = None
        self._thread: threading.Thread | None = None
        self._stop_flag = threading.Event()

    def is_configured(self) -> bool:
        return self._settings.is_configured()

    async def start(self) -> None:
        if not self.is_configured():
            logger.info("Instagram userbot not configured. Skipping.")
            return
        try:
            from instagrapi import Client
            self._client = Client()
            session_file = self._settings.session_file

            try:
                self._client.load_settings(session_file)
                self._client.login(self._settings.username, self._settings.password)
                try:
                    self._client.get_timeline_feed()
                except Exception:
                    logger.info("Instagram session expired, re-logging in...")
                    self._client.login(self._settings.username, self._settings.password)
                    self._client.dump_settings(session_file)
            except Exception:
                self._client.login(self._settings.username, self._settings.password)
                self._client.dump_settings(session_file)

            self._own_user_id = str(self._client.user_id)
            logger.info(f"Instagram logged in as {self._settings.username} (id={self._own_user_id})")

        except ImportError:
            logger.error("instagrapi package not installed. Install with: pip install instagrapi")
            return
        except Exception as e:
            logger.error(f"Instagram sign-in failed: {e}")
            return

        self._stop_flag.clear()
        self._thread = threading.Thread(target=self._poll_dms, daemon=True)
        self._thread.start()
        logger.info("InstagramChannel userbot polling started.")

    async def stop(self) -> None:
        self._stop_flag.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=5)
        logger.info("InstagramChannel stopped.")

    def _poll_dms(self) -> None:
        logger.info("Instagram DM poller activated.")
        api_host = get_settings().api_host

        while not self._stop_flag.is_set():
            try:
                if self._client is None:
                    time.sleep(30)
                    continue

                threads = self._client.direct_threads(amount=20)
                for thread in threads:
                    thread_id = str(thread.pk)
                    messages = self._client.direct_messages(thread_id, amount=5)
                    for msg in messages:
                        sender_id = str(msg.user_id)
                        if sender_id == self._own_user_id:
                            continue

                        text = getattr(msg, "text", "")
                        if not text:
                            continue

                        logger.info(f"Instagram DM from {sender_id}: '{text[:40]}...'")
                        payload = {
                            "customer_id": f"IG_{sender_id}",
                            "channel": "instagram",
                            "source_ref": thread_id,
                            "raw_text": text,
                        }
                        try:
                            import requests
                            res = requests.post(f"{api_host}/api/v1/complaints", json=payload, timeout=10)
                            if res.status_code == 201:
                                logger.info(f"Instagram complaint created for thread {thread_id}")
                        except Exception as api_err:
                            logger.warning(f"Failed to create Instagram complaint: {api_err}")

            except Exception as e:
                logger.error(f"Error in Instagram DM polling: {e}")
            finally:
                time.sleep(60)

    async def send_message(self, source_ref: str, text: str, **kwargs) -> bool:
        if self._client is None:
            logger.error("Instagram client not authenticated")
            return False

        truncated = text[:1000]
        try:
            self._client.direct_send(truncated, thread_ids=[int(source_ref)])
            self._log_outbound(source_ref, truncated, True, None)
            return True
        except Exception as e:
            self._log_outbound(source_ref, truncated, False, str(e))
            logger.error(f"Instagram send_message failed: {e}")
            return False

    def _log_outbound(self, source_ref: str, text: str, success: bool, error: str | None) -> None:
        db = next(get_db())
        try:
            record = OutboundMessage(
                channel="instagram",
                source_ref=source_ref,
                message_text=text,
                status="sent" if success else "failed",
                error_message=error,
            )
            db.add(record)
            db.commit()
        except Exception:
            pass
        finally:
            db.close()