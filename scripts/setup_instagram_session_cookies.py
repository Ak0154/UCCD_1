"""Script to build Instagram session from sessionid cookie (bypasses challenge flow).

Usage:
    Option A — Env var (auto):
        Set INSTAGRAM_SESSIONID in .env
        Run: python scripts/setup_instagram_session_cookies.py

    Option B — Interactive:
        1. Log into instagram.com in your browser
        2. F12 → Storage → Cookies → instagram.com → copy sessionid
        3. Run: python scripts/setup_instagram_session_cookies.py
        4. Paste sessionid when prompted
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()


def build_session():
    from instagrapi import Client

    session_file = os.getenv("INSTAGRAM_SESSION_FILE", "instagram_session.json")
    sessionid = os.getenv("INSTAGRAM_SESSIONID", "")

    if not sessionid:
        sessionid = input("Paste sessionid cookie value from instagram.com: ").strip()

    if not sessionid:
        print("ERROR: sessionid is required.")
        sys.exit(1)

    client = Client()

    if os.path.exists(session_file):
        try:
            client.load_settings(session_file)
            client.get_timeline_feed()
            print(f"Session restored from {session_file}. Already logged in as @{client.username}.")
            return
        except Exception:
            print("Existing session expired, creating new one...")
            try:
                os.remove(session_file)
            except OSError:
                pass

    try:
        client.login_by_sessionid(sessionid)
        print(f"Step 1 OK: Identified as @{client.username} via sessionid cookie.")
    except Exception as e:
        print(f"ERROR: sessionid login failed: {e}")
        print("Get a fresh sessionid from your browser at instagram.com")
        sys.exit(1)

    print("Step 2: Exchanging web session for mobile API tokens (relogin)...")
    try:
        client.relogin()
        print("Mobile API tokens acquired successfully.")
    except Exception as e:
        print(f"WARNING: relogin failed: {e}")
        print("Session may have limited API access. Saving partial session anyway.")

    client.dump_settings(session_file)
    print(f"Session saved to: {session_file}")

    try:
        threads = client.direct_threads(amount=1)
        print(f"API verification: OK ({len(threads)} DM threads fetched)")
    except Exception as e:
        print(f"API verification WARNING: {e}")
        print("The session file was saved but API calls may fail until challenge is resolved.")

    print(f"\nDone. Session file: {session_file}")


if __name__ == "__main__":
    build_session()