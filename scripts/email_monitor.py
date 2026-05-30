"""
Email Webhook Live Monitor
Tails Docker container logs and displays the email processing pipeline in real-time.
Usage: python scripts/email_monitor.py
"""
import subprocess
import sys
import re
import time
from datetime import datetime


BLUE   = "\033[94m"
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
CYAN   = "\033[96m"
MAGENTA= "\033[95m"
BOLD   = "\033[1m"
RESET  = "\033[0m"
GRAY   = "\033[90m"

ICONS = {
    "received":    "[IN]",
    "guardrail":   "[GRD]",
    "language":    "[LANG]",
    "groq":        "[AI]",
    "sarvam":      "[TR]",
    "reply":       "[OUT]",
    "complaint":   "[TICKET]",
    "translated":  "[TL]",
    "error":       "[ERR]",
    "confirm":     "[OK]",
    "mailgun":     "[MG]",
    "blocked":     "[BLOCK]",
}

PATTERNS = [
    (re.compile(r"\[EMAIL_WEBHOOK\] Request received from"), "received", BLUE),
    (re.compile(r"Conversation mode=(True|False)"), "guardrail", CYAN),
    (re.compile(r"_process_email_conversation START"), "received", GREEN),
    (re.compile(r"Guardrail matched", re.IGNORECASE), "guardrail", YELLOW),
    (re.compile(r"New email conversation started"), "language", MAGENTA),
    (re.compile(r"language="), "language", MAGENTA),
    (re.compile(r"Groq.*generation"), "groq", CYAN),
    (re.compile(r"Sarvam.*translation"), "sarvam", CYAN),
    (re.compile(r"translation to"), "sarvam", CYAN),
    (re.compile(r"Mailgun send|send_message"), "mailgun", GREEN),
    (re.compile(r"replied|reply", re.IGNORECASE), "reply", GREEN),
    (re.compile(r"complaint_created|Complaint Registered"), "complaint", YELLOW),
    (re.compile(r"confirmation|confirmed"), "confirm", GREEN),
    (re.compile(r"BLOCKED|blocked", re.IGNORECASE), "blocked", RED),
    (re.compile(r"error|Error|ERROR|fail", re.IGNORECASE), "error", RED),
    (re.compile(r"200 OK.*webhooks/email"), "received", GREEN),
    (re.compile(r"401 Unauthorized.*webhooks/email"), "error", RED),
    (re.compile(r"detected_language|language_code"), "language", MAGENTA),
]


def classify_line(line: str) -> tuple[str, str]:
    for pattern, label, color in PATTERNS:
        if pattern.search(line):
            return label, color
    return "", ""


def format_line(line: str) -> str:
    ts = datetime.now().strftime("%H:%M:%S")
    label, color = classify_line(line)

    if label == "error":
        return f"{GRAY}{ts}{RESET} {RED}{ICONS['error']} {line.strip()}{RESET}"
    elif label == "received":
        return f"{GRAY}{ts}{RESET} {GREEN}{ICONS['received']} {line.strip()}{RESET}"
    elif label == "blocked":
        return f"{GRAY}{ts}{RESET} {RED}{ICONS['blocked']} BLOCKED: {line.strip()}{RESET}"
    elif label:
        icon = ICONS.get(label, "•")
        return f"{GRAY}{ts}{RESET} {color}{icon} {line.strip()}{RESET}"

    return f"{GRAY}{ts}{RESET} {GRAY}{line.strip()}{RESET}"


def print_header():
    print("\033[2J\033[H", end="")
    print(f"{BOLD}{BLUE}{'='*70}{RESET}")
    print(f"{BOLD}{BLUE}  EMAIL WEBHOOK LIVE MONITOR{RESET}")
    print(f"{BOLD}{BLUE}  complaints@abhineet.net -> nginx/ngrok -> FastAPI -> Groq -> Sarvam -> Mailgun{RESET}")
    print(f"{BOLD}{BLUE}{'='*70}{RESET}")
    print(f"{GRAY}  {ICONS['received']} Received  {ICONS['guardrail']} Guardrail  {ICONS['language']} Language  {ICONS['groq']} Groq AI  {ICONS['sarvam']} Sarvam  {ICONS['reply']} Reply  {ICONS['blocked']} Blocked  {ICONS['error']} Error{RESET}")
    print(f"{BLUE}{'-'*70}{RESET}")

    print(f"{GRAY}  Mailgun domain: abhineet.net{RESET}")
    print(f"{GRAY}  Mode: Conversation ({'true' if True else 'false'}){RESET}")
    print(f"{GRAY}  Providers: Groq (llama-3.1-8b) + Sarvam (mayura:v1 + sarvam-translate:v1){RESET}")
    print(f"{BLUE}{'-'*70}{RESET}\n")


def main():
    print_header()

    cmd = ["docker", "compose", "logs", "-f", "--tail", "0", "api"]

    try:
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True,
        )
    except FileNotFoundError:
        print(f"{RED}Docker compose not found. Make sure Docker is installed.{RESET}")
        sys.exit(1)

    try:
        for line in proc.stdout:
            line = line.strip()
            if not line:
                continue

            if "webhook" in line.lower() or "email" in line.lower() or "conversation" in line.lower() or \
               "guardrail" in line.lower() or "groq" in line.lower() or "sarvam" in line.lower() or \
               "language" in line.lower() or "mailgun" in line.lower() or "complaint" in line.lower() or \
               "blocked" in line.lower() or "replied" in line.lower() or "confirmation" in line.lower() or \
               "error" in line.lower():
                formatted = format_line(line)
                print(formatted, flush=True)

    except KeyboardInterrupt:
        print(f"\n{YELLOW}Monitor stopped.{RESET}")
    finally:
        proc.terminate()
        proc.wait()


if __name__ == "__main__":
    main()