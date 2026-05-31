import json
import logging
import os
import threading
import time
from dataclasses import dataclass

import tweepy

from services.channels.base import BaseChannel
from api.config import get_settings
from api.models.outbound_message import OutboundMessage
from api.db.session import get_db

logger = logging.getLogger(__name__)

STEP_PROMPTS = {
    "name": "Please provide your full name.",
    "account_no": "Please provide your account number.",
    "phone": "Please provide your phone number.",
    "email": "Please provide your email address.",
}


@dataclass
class UserSession:
    step: str = "complaint"
    complaint_text: str = ""
    name: str = ""
    account_no: str = ""
    phone: str = ""
    email: str = ""
    complaint_id: str = ""
    screen_name: str = ""


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
        self._client: tweepy.Client | None = None
        self._own_user_id: str | None = None
        self._last_seen_tweet_id: int | None = None
        self._thread: threading.Thread | None = None
        self._stop_flag = threading.Event()
        self._last_seen_file = "twitter_last_seen.json"
        self._load_last_seen()
        self._sessions: dict[str, UserSession] = {}

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
            logger.warning("Twitter not configured. Skipping.")
            return

        try:
            self._client = tweepy.Client(
                bearer_token=self._settings.bearer_token,
                consumer_key=self._settings.api_key,
                consumer_secret=self._settings.api_secret,
                access_token=self._settings.access_token,
                access_token_secret=self._settings.access_token_secret,
                wait_on_rate_limit=True,
            )

            me = self._client.get_me()
            if not me or not me.data:
                logger.error("Twitter: could not verify credentials.")
                self._client = None
                return

            self._own_user_id = str(me.data.id)
            logger.warning(
                "Twitter: authenticated as @%s (id=%s)",
                me.data.username,
                self._own_user_id,
            )

        except Exception as e:
            logger.error("Twitter auth failed: %s", e)
            self._client = None
            return

        self._stop_flag.clear()
        self._thread = threading.Thread(target=self._poll_mentions, daemon=True)
        self._thread.start()
        logger.warning("TwitterChannel userbot polling STARTED for @%s", self.username)

    async def stop(self) -> None:
        self._stop_flag.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=5)
        logger.warning("TwitterChannel stopped.")

    def _reply(self, tweet_id: int, text: str, screen_name: str) -> bool:
        if self._client is None:
            return False
        try:
            self._client.create_tweet(
                text=f"@{screen_name} {text}"[:280],
                in_reply_to_tweet_id=tweet_id,
            )
            self._log_outbound(str(tweet_id), text[:280], True, None)
            return True
        except Exception as e:
            self._log_outbound(str(tweet_id), text[:280], False, str(e))
            logger.error("Twitter reply failed: %s", e)
            return False

    def _handle_mention(self, screen_name: str, text_strip: str, tid: int, api_host: str) -> None:
        if screen_name not in self._sessions:
            self._sessions[screen_name] = UserSession(screen_name=screen_name)
            if not self._reply(tid, "Welcome to Union Bank of India Support!\n\nPlease describe your complaint or issue in detail.", screen_name):
                logger.warning("Twitter: failed to send welcome reply to @%s", screen_name)
            return

        session = self._sessions[screen_name]

        if text_strip.lower() in ("/start", "/reset"):
            self._sessions[screen_name] = UserSession(screen_name=screen_name)
            if not self._reply(tid, "Session reset. Please describe your complaint or issue in detail.", screen_name):
                logger.warning("Twitter: failed to send reset reply to @%s", screen_name)
            return

        if session.step == "registered":
            self._reply(tid, f"Your complaint is registered. Ticket ID: {session.complaint_id}. You will be notified when it is resolved.", screen_name)
            return

        if session.step == "complaint":
            session.complaint_text = text_strip
            session.step = "name"
            self._reply(tid, STEP_PROMPTS["name"], screen_name)
            return

        if session.step == "name":
            session.name = text_strip
            session.step = "account_no"
            self._reply(tid, STEP_PROMPTS["account_no"], screen_name)
            return

        if session.step == "account_no":
            session.account_no = text_strip
            session.step = "phone"
            self._reply(tid, STEP_PROMPTS["phone"], screen_name)
            return

        if session.step == "phone":
            session.phone = text_strip
            session.step = "email"
            self._reply(tid, STEP_PROMPTS["email"], screen_name)
            return

        if session.step == "email":
            session.email = text_strip
            self._create_complaint_from_session(session, tid, api_host)

    def _create_complaint_from_session(self, session: UserSession, tid: int, api_host: str) -> None:
        import requests

        payload = {
            "customer_id": f"@{session.screen_name}",
            "channel": "twitter",
            "source_ref": str(tid),
            "raw_text": session.complaint_text,
        }

        try:
            res = requests.post(f"{api_host}/api/v1/complaints", json=payload, timeout=10)
            if res.status_code == 201:
                complaint_data = res.json()
                session.complaint_id = complaint_data.get("id")
                session.step = "registered"

                try:
                    requests.put(
                        f"{api_host}/api/v1/complaints/{session.complaint_id}/details",
                        json={
                            "customer_name": session.name or None,
                            "customer_email": session.email or None,
                            "customer_phone": session.phone or None,
                            "account_number": session.account_no or None,
                        },
                        timeout=10,
                    )
                except Exception:
                    pass

                self._reply(
                    tid,
                    f"Complaint Registered! Ticket ID: {session.complaint_id}. Name: {session.name}. Our team is reviewing your case.",
                    session.screen_name,
                )
            else:
                logger.warning("API returned status %s: %s", res.status_code, res.text)
                self._reply(tid, "Could not register your complaint. Please try again later.", session.screen_name)
        except Exception as api_err:
            logger.warning("Failed to create Twitter complaint: %s", api_err)
            self._reply(tid, "Could not register your complaint. Please try again later.", session.screen_name)

    def _poll_mentions(self) -> None:
        logger.warning("Twitter mention poller activated for @%s", self.username)
        api_host = get_settings().api_host
        cycle_count = 0

        while not self._stop_flag.is_set():
            try:
                if self._client is None:
                    logger.warning("Twitter poller: client not authenticated, waiting...")
                    time.sleep(30)
                    continue

                kwargs = {
                    "id": self._own_user_id,
                    "expansions": ["author_id"],
                    "tweet_fields": ["author_id", "created_at", "text"],
                    "user_fields": ["username"],
                    "max_results": 10,
                }
                if self._last_seen_tweet_id:
                    kwargs["since_id"] = self._last_seen_tweet_id

                response = self._client.get_users_mentions(**kwargs)
                cycle_count += 1

                meta = getattr(response, "meta", {}) or {}
                result_count = meta.get("result_count", 0) if isinstance(meta, dict) else 0
                errors = getattr(response, "errors", []) or []

                logger.warning(
                    "Twitter poller cycle=%d, mentions=%d, meta_result_count=%s, errors=%s, last_seen_id=%s",
                    cycle_count,
                    len(response.data) if response.data else 0,
                    result_count,
                    errors,
                    self._last_seen_tweet_id,
                )

                if errors:
                    logger.error("Twitter API errors: %s", errors)

                if not response.data:
                    continue

                users = {}
                if response.includes and "users" in response.includes:
                    for u in response.includes["users"]:
                        users[str(u.id)] = u.username

                max_seen = self._last_seen_tweet_id or 0

                for tweet in reversed(response.data):
                    tid = int(tweet.id)
                    max_seen = max(max_seen, tid)

                    author_id = str(tweet.author_id) if tweet.author_id else None
                    screen_name = users.get(author_id, "unknown") if author_id else "unknown"

                    if author_id == self._own_user_id:
                        continue

                    text = tweet.text or ""
                    if not text:
                        continue

                    text_strip = text.strip()
                    logger.warning("Twitter mention from @%s (id=%d): '%s...'", screen_name, tid, text_strip[:40])
                    self._handle_mention(screen_name, text_strip, tid, api_host)

                self._save_last_seen(max_seen)
                self._last_seen_tweet_id = max_seen

            except tweepy.TooManyRequests:
                logger.warning("Twitter rate limit hit, sleeping 15 minutes...")
                time.sleep(900)
                continue
            except Exception as e:
                logger.error("Error in Twitter polling: %s", e)
            finally:
                time.sleep(60)

    async def send_message(self, source_ref: str, text: str, **kwargs) -> bool:
        if self._client is None:
            logger.error("Twitter client not authenticated")
            return False

        truncated = text[:280]
        try:
            self._client.create_tweet(truncated, in_reply_to_tweet_id=int(source_ref))
            self._log_outbound(source_ref, truncated, True, None)
            return True
        except Exception as e:
            self._log_outbound(source_ref, truncated, False, str(e))
            logger.error("Twitter send_message failed: %s", e)
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