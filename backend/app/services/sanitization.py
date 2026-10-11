import re
from typing import Optional, List
from app.schemas.analysis import SignalItem
from app.services.normalization import Normalizer


class SanitizationResult:
    def __init__(self, sanitized_text: Optional[str], was_sanitized: bool, rationale: str):
        self.sanitized_text = sanitized_text
        self.was_sanitized = was_sanitized
        self.rationale = rationale


class Sanitizer:
    # Bounded injection tag patterns that can be cleanly excised from surrounding document text
    BOUNDED_INJECTION_TAGS = [
        re.compile(r"\[\s*(?:system|admin|override)\s*:\s*[^\]]+\]", re.IGNORECASE),
        re.compile(r"<!--\s*(?:system|instruction|prompt|override)\s*:\s*.*?-->", re.IGNORECASE),
        re.compile(r"!\[.*?\]\(https?://[^\s\)]+[\?&](?:token|data|secret|cookie|prompt)=[^ \)]+\)", re.IGNORECASE)
    ]

    @classmethod
    def sanitize(cls, text: str, signals: List[SignalItem]) -> SanitizationResult:
        if not signals:
            return SanitizationResult(sanitized_text=None, was_sanitized=False, rationale="No risk signals found.")

        # Check if critical rule fired - never attempt sanitizing a critical secret extraction
        rule_ids = [s.rule_id for s in signals]
        if "SYNTHETIC_SECRET_EXTRACTION" in rule_ids or "DIRECT_OVERRIDE" in rule_ids:
            return SanitizationResult(
                sanitized_text=None,
                was_sanitized=False,
                rationale="Direct instruction override or canary extraction cannot be safely sanitized without total semantic alteration."
            )

        # Attempt defensible transformations:
        modified = text
        changes_made = []

        # 1. Strip zero-width & control chars if OBFUSCATION_EVASION fired
        if "OBFUSCATION_EVASION" in rule_ids:
            cleaned = Normalizer.ZERO_WIDTH_PATTERN.sub("", modified)
            cleaned = Normalizer.CONTROL_CHAR_PATTERN.sub("", cleaned)
            if cleaned != modified:
                modified = cleaned
                changes_made.append("Stripped hidden zero-width and control characters")

        # 2. Excise bounded metadata injection tags or exfiltration tags
        for pattern in cls.BOUNDED_INJECTION_TAGS:
            if pattern.search(modified):
                modified = pattern.sub("", modified)
                changes_made.append("Excised isolated injection/exfiltration tags")

        # Strip redundant whitespace left by excisions
        modified = re.sub(r"[ \t]+", " ", modified).strip()

        # If modified text is now empty or unchanged, sanitization is not defensible
        if not changes_made or not modified:
            return SanitizationResult(
                sanitized_text=None,
                was_sanitized=False,
                rationale="Content cannot be defensively sanitized without loss of content integrity."
            )

        return SanitizationResult(
            sanitized_text=modified,
            was_sanitized=True,
            rationale="; ".join(changes_made)
        )
