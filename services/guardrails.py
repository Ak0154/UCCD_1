import re
import logging
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)


class GuardResult(Enum):
    PASS = "pass"
    BLOCK = "block"
    SANITIZE = "sanitize"


@dataclass
class GuardReport:
    result: GuardResult
    risk_score: float = 0.0
    blocked_patterns: list[str] = field(default_factory=list)
    sanitized_text: str | None = None
    reason: str = ""


INJECTION_PATTERNS: list[tuple[str, float, str]] = [
    (r"(?i)\bignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|messages?|prompts?)\b", 0.95, "ignore_previous_instructions"),
    (r"(?i)\byou\s+are\s+now\s+(an?\s+)?(DAN|jailbreak|unfiltered|unrestricted|evil|malicious|hacker)\b", 0.95, "role_override_jailbreak"),
    (r"(?i)\b(system\s*:\s*|system\s+prompt\s*:|system\s+message\s*:)\s*(you\s+are|your\s+role|your\s+name)", 0.90, "system_prompt_override"),
    (r"(?i)\bpretend\s+(you\s+are|to\s+be)\b", 0.85, "pretend_role"),
    (r"(?i)\bact\s+as\s+(if\s+you\s+are|an?\s+AI\s+that)\b", 0.85, "act_as_role"),
    (r"(?i)\b(new\s+instructions?|new\s+prompt|new\s+system\s+message)\s*:\s*", 0.90, "new_instructions"),
    (r"(?i)\bdisregard\s+(all\s+)?(previous|above|prior)\b", 0.90, "disregard_instructions"),
    (r"(?i)\bforget\s+(everything|all)\s+(you|we)\s+(know|said|discussed)\b", 0.85, "forget_context"),
    (r"(?i)\byou\s+must\s+(always\s+)?(respond|answer|reply)\s+(with|as)\b", 0.75, "forced_response"),
    (r"(?i)\bdelete\s+(the\s+)?(database|all\s+records|all\s+data|all\s+complaints)\b", 0.95, "destructive_command"),
    (r"(?i)\b(drop|truncate|alter)\s+table\b", 0.95, "sql_injection"),
    (r"(?i)\b(SELECT|INSERT|UPDATE|DELETE)\s+(FROM|INTO|SET|WHERE)\b", 0.60, "sql_fragment"),
    (r"(?i)<script[^>]*>.*?</script>", 0.85, "xss_script_tag"),
    (r"(?i)\bon\w+\s*=\s*[\"']?\s*javascript:", 0.85, "xss_event_handler"),
    (r"(?i)\bdata\s*:\s*text/html", 0.70, "data_uri_html"),
    (r"(?i)\bsend\s+(me|all|the)\s+(all\s+)?(customer|user|account)\s+(data|info(rmation)?|details|records)\b", 0.85, "data_exfiltration_request"),
    (r"(?i)\bwhat\s+(is|are|was)\s+your\s+(system|original|first)\s+prompt\b", 0.80, "prompt_extraction"),
    (r"(?i)\breveal\s+your\s+(system\s+)?(prompt|instructions?|rules?)\b", 0.85, "reveal_prompt"),
    (r"(?i)\bdon'?t\s+(follow|obey)\s+(your\s+)?(rules?|instructions?|guidelines?)\b", 0.80, "disobey_rules"),
    (r"(?i)\bbypass\s+(the\s+)?(filter|guardrail|safety|restriction|limit)", 0.85, "bypass_attempt"),
]

MAX_INPUT_LENGTH = 20000


def _sanitize_email_text(text: str) -> str:
    sanitized = text
    sanitized = re.sub(r'<script[^>]*>.*?</script>', '[blocked:script]', sanitized, flags=re.IGNORECASE | re.DOTALL)
    sanitized = re.sub(r'<[^>]+on\w+\s*=\s*["\'][^"\']*["\'][^>]*>', '[blocked:handler]', sanitized, flags=re.IGNORECASE)
    sanitized = re.sub(r'<[^>]*javascript:[^>]*>', '[blocked:js_uri]', sanitized, flags=re.IGNORECASE)
    return sanitized


def check_email_guardrails(from_addr: str, subject: str, body_text: str) -> GuardReport:
    combined = f"Subject: {subject}\n\n{body_text}"

    if len(combined) > MAX_INPUT_LENGTH:
        return GuardReport(
            result=GuardResult.BLOCK,
            risk_score=1.0,
            blocked_patterns=["max_length_exceeded"],
            reason=f"Email content exceeds maximum allowed length of {MAX_INPUT_LENGTH} characters",
        )

    scored_patterns: list[tuple[float, str]] = []

    for pattern, score, label in INJECTION_PATTERNS:
        matches = re.findall(pattern, combined)
        if matches:
            scored_patterns.append((score, label))
            logger.warning(f"Guardrail matched '{label}' (score={score}) in email from {from_addr}")

    if not scored_patterns:
        sanitized_body = _sanitize_email_text(body_text)
        if sanitized_body != body_text:
            return GuardReport(
                result=GuardResult.SANITIZE,
                risk_score=0.3,
                sanitized_text=sanitized_body,
                reason="HTML/script content sanitized",
            )
        return GuardReport(result=GuardResult.PASS)

    max_score = max(s[0] for s in scored_patterns)
    blocked_labels = [s[1] for s in scored_patterns]

    if max_score >= 0.85:
        return GuardReport(
            result=GuardResult.BLOCK,
            risk_score=max_score,
            blocked_patterns=blocked_labels,
            reason=f"Blocked due to high-risk patterns: {', '.join(blocked_labels)}",
        )

    combined_score = 1.0 - (1.0 - max_score) * 0.7
    if len(scored_patterns) >= 3:
        combined_score = min(1.0, combined_score + 0.15)

    if combined_score >= 0.80:
        return GuardReport(
            result=GuardResult.BLOCK,
            risk_score=combined_score,
            blocked_patterns=blocked_labels,
            reason=f"Blocked due to cumulative risk score {combined_score:.2f}: {', '.join(blocked_labels)}",
        )

    sanitized_body = _sanitize_email_text(body_text)
    return GuardReport(
        result=GuardResult.SANITIZE,
        risk_score=combined_score,
        blocked_patterns=blocked_labels,
        sanitized_text=sanitized_body,
        reason=f"Sanitized — moderate risk patterns: {', '.join(blocked_labels)}",
    )