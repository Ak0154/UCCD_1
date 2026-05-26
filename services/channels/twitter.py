import asyncio
import logging
import threading
import time
import json
import os

from services.channels.base import BaseChannel
from api.config import get_settings
from api.models.outbound_message import OutboundMessage
from api.db.session import get_db

logger = logging.getLogger(__name__)


class TwitterChannel(BaseChannel):
    name = "twitter"
    display_name = "Twitter/X"
    supports_inbound = True
    supports_outbound = True
    inbound_method = "userbot"

    def __init__(self):
        settings = get_settings()
        self._settings = settings.twitter
        self.username = self._settings.username
        self._client = None
        self._last_seen_tweet_id: int | None = None
        self._thread: threading.Thread | None = None
        self._stop_flag = threading.Event()
        self._last_seen_file = "twitter_last_seen.json"
        self._load_last_seen()

    def _load_last_seen(self) -> None:
        try:
            if os.path.exists(self._last_seen_file):
                with open(self._last_seen_file) as f:
                    data = json.load(f)
                    self._last_seen_tweet_id = data.get("last_tweet_id")
        except Exception:
            self._last_seen_tweet_id = None

    def _save_last_seen(self, tweet_id: int) -> None:
        try:
            with open(self._last_seen_file, "w") as f:
                json.dump({"last_tweet_id": tweet_id}, f)
        except Exception:
            pass

    def is_configured(self) -> bool:
        return self._settings.is_configured()

    async def start(self) -> None:
        if not self.is_configured():
            logger.info("Twitter userbot not configured. Skipping.")
            return
        try:
            from tweety import Twitter as TweetyClient
            self._client = TweetyClient(self.username)
            self._client.sign_in(
                self.username,
                self._settings.password,
                self._settings.email or None,
            )
        except ImportError:
            logger.error("tweety-ns package not installed. Install with: pip install tweety-ns")
            return
        except Exception as e:
            logger.error(f"Twitter sign-in failed: {e}")
            return

        self._stop_flag.clear()
        self._thread = threading.Thread(target=self._poll_mentions, daemon=True)
        self._thread.start()
        logger.info("TwitterChannel userbot polling started.")

    async def stop(self) -> None:
        self._stop_flag.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=5)
        logger.info("TwitterChannel stopped.")

    def _poll_mentions(self) -> None:
        logger.info("Twitter mention poller activated.")
        api_host = get_settings().api_host

        while not self._stop_flag.is_set():
            try:
                if self._client is None:
                    time.sleep(30)
                    continue

                mentions = self._client.get_mentions()
                if not mentions:
                    time.sleep(30)
                    continue

                max_seen = self._last_seen_tweet_id or 0
                for tweet in mentions:
                    tid = int(getattr(tweet, "id", 0))
                    if tid <= max_seen:
                        continue
                    max_seen = max(max_seen, tid)
                    text = getattr(tweet, "text", "")
                    author = getattr(tweet, "author", {})
                    screen_name = getattr(author, "screen_name", "unknown") if hasattr(author, "screen_name") else "unknown"

                    logger.info(f"Twitter mention from @{screen_name}: '{text[:40]}...'")
                    payload = {
                        "customer_id": f"@{screen_name}",
                        "channel": "twitter",
                        "source_ref": str(tid),
                        "raw_text": text,
                    }
                    try:
                        import requests
                        res = requests.post(f"{api_host}/api/v1/complaints", json=payload, timeout=10)
                        if res.status_code == 201:
                            logger.info(f"Twitter complaint created for tweet {tid}")
                    except Exception as api_err:
                        logger.warning(f"Failed to create Twitter complaint: {api_err}")

                self._save_last_seen(max_seen)
                self._last_seen_tweet_id = max_seen

            except Exception as e:
                logger.error(f"Error in Twitter polling: {e}")
            finally:
                time.sleep(60)

    async def send_message(self, source_ref: str, text: str, **kwargs) -> bool:
        if self._client is None:
            logger.error("Twitter client not authenticated")
            return False

        truncated = text[:280]
        try:
            self._client.reply(truncated, tweet_id=int(source_ref))
            self._log_outbound(source_ref, truncated, True, None)
            return True
        except Exception as e:
            self._log_outbound(source_ref, truncated, False, str(e))
            logger.error(f"Twitter send_message failed: {e}")
            return False

    def _log_outbound(self, source_ref: str, text: str, success: bool, error: str | None) -> None:
        db = next(get_db())
        try:
            record = OutboundMessage(
                channel="twitter",
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