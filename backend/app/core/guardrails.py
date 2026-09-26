import logging
import re
from typing import Tuple

logger = logging.getLogger("guardrails")

# Common Prompt Injection / Jailbreak Attack Patterns
PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|above|system)\s+instructions",
    r"forget\s+(your\s+)?(system\s+)?prompt",
    r"you\s+are\s+now\s+dan",
    r"bypass\s+(all\s+)?rules",
    r"disregard\s+(prior|previous)\s+directives",
    r"act\s+as\s+an\s+unfiltered",
    r"do\s+anything\s+now",
    r"jailbreak",
]

# PII Regex Patterns
EMAIL_REGEX = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
PHONE_REGEX = r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"
CREDIT_CARD_REGEX = r"\b(?:\d[ -]*?){13,16}\b"
SSN_REGEX = r"\b\d{3}-\d{2}-\d{4}\b"


def detect_prompt_injection(text: str) -> Tuple[bool, str]:
    """
    Checks if the user input contains prompt injection or jailbreak attempts.
    Returns (is_injection_detected, reason).
    """
    lower_text = text.lower()
    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, lower_text):
            logger.warning("[GUARDRAILS] Prompt Injection Attempt Detected: '%s'", text)
            return True, "Potential prompt injection or jailbreak attempt detected."
    return False, ""


def mask_pii(text: str) -> str:
    """
    Redacts sensitive Personally Identifiable Information (PII) like email, phone, and card numbers.
    """
    masked = text
    masked = re.sub(EMAIL_REGEX, "[EMAIL_REDACTED]", masked)
    masked = re.sub(PHONE_REGEX, "[PHONE_REDACTED]", masked)
    masked = re.sub(SSN_REGEX, "[SSN_REDACTED]", masked)
    masked = re.sub(CREDIT_CARD_REGEX, "[CARD_REDACTED]", masked)
    
    if masked != text:
        logger.info("[GUARDRAILS] PII data masked in text.")
    
    return masked


def process_user_input(question: str) -> str:
    """
    Input Guardrail Pipeline:
    1. Checks for prompt injection. Raises ValueError if suspicious.
    2. Masks any PII in the question.
    """
    is_injection, reason = detect_prompt_injection(question)
    if is_injection:
        raise ValueError(f"Security Alert: {reason}")
    
    clean_question = mask_pii(question)
    return clean_question


def process_model_output(answer: str) -> str:
    """
    Output Guardrail Pipeline:
    Masks any PII in model output before returning to user.
    """
    return mask_pii(answer)
