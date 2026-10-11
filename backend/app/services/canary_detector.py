import re
import base64
import urllib.parse
from typing import List, Optional, Tuple, Set
from app.core.config import settings


class CanaryMatch:
    def __init__(self, secret: str, variation_type: str, evidence: str):
        self.secret = secret
        self.variation_type = variation_type
        self.evidence = evidence


class CanaryDetector:
    """
    Detects protected demo secrets, canaries, and confidential system tokens
    across capitalization, spacing, reversing, base64, hex, URL encoding,
    and extraction intent patterns.
    """

    GENERIC_CANARY_PATTERN = re.compile(r"\bPS_(?:DEMO_SECRET|CANARY|SECRET)_[A-Za-z0-9_]+\b", re.IGNORECASE)

    INTENT_PATTERNS = [
        re.compile(r"(?i)\b(?:reveal|leak|print|show|give me|extract|disclose|what is|tell me|echo|quote)\b(?:\s+\w+){0,5}\s+\b(?:canary|demo secret|synthetic secret|api key|internal secret|master password|protected demo value|protected demo secret|canary token)\b"),
        re.compile(r"(?i)\bprint\s+(?:the\s+)?(?:confidential\s+)?canary\s+token\b"),
        re.compile(r"(?i)\bwhat\s+(?:is|was)\s+(?:the\s+)?(?:secret\s+)?canary(?:\s+value)?\b"),
        re.compile(r"(?i)\b(?:display|output|show)\s+(?:any\s+)?(?:hidden\s+)?(?:tokens?|secrets?|keys?)\s+from\s+(?:system\s+)?instructions?\b")
    ]

    def __init__(self, secrets: Optional[List[str]] = None):
        self.secrets = [s.strip() for s in (secrets or settings.canary_secrets_list) if s.strip()]
        self._compiled_regexes = self._build_variation_matchers()

    def _build_variation_matchers(self) -> List[Tuple[str, str, re.Pattern]]:
        """Pre-compiles regex matchers for each secret across supported variations."""
        matchers = []
        for secret in self.secrets:
            # 1. Exact case-insensitive
            matchers.append((secret, "case_variation", re.compile(re.escape(secret), re.IGNORECASE)))

            # 2. Spaced / interspersed characters: e.g. "P S _ D E M O" or "P.S._.D.E.M.O"
            # Match each character of the secret with optional whitespace/dots/hyphens between them
            char_pattern = r"[\s\.\-_]*".join(re.escape(c) for c in secret)
            matchers.append((secret, "spaced_interspersed", re.compile(rf"(?i)\b{char_pattern}\b")))

            # 3. Reversed: e.g. "A3F7_TERCES_OMED_SP"
            reversed_secret = secret[::-1]
            matchers.append((secret, "reversed", re.compile(re.escape(reversed_secret), re.IGNORECASE)))

            # 4. Base64 encoded versions (with and without padding)
            b64_full = base64.b64encode(secret.encode()).decode()
            b64_strip = b64_full.rstrip("=")
            matchers.append((secret, "base64_encoded", re.compile(rf"\b(?:{re.escape(b64_full)}|{re.escape(b64_strip)})\b")))

            # Also base64 of lowercase
            b64_lower = base64.b64encode(secret.lower().encode()).decode().rstrip("=")
            matchers.append((secret, "base64_encoded_lower", re.compile(rf"\b{re.escape(b64_lower)}\b")))

            # 5. Hex representation: e.g. "50535f..."
            hex_repr = secret.encode().hex()
            matchers.append((secret, "hex_encoded", re.compile(rf"(?i)\b{re.escape(hex_repr)}\b")))

            # 6. URL / Percent encoded: e.g. "%50%53%5F..."
            url_repr = urllib.parse.quote(secret)
            if "%" in url_repr:
                matchers.append((secret, "url_encoded", re.compile(re.escape(url_repr), re.IGNORECASE)))

        return matchers

    def scan(self, text: str) -> List[CanaryMatch]:
        """Scans input text for any canary secret occurrences, variations, or extraction intents."""
        matches: List[CanaryMatch] = []
        seen_evidence: Set[str] = set()

        # Check compiled secret variations
        for secret, var_type, pattern in self._compiled_regexes:
            m = pattern.search(text)
            if m:
                ev = m.group(0)[:80]
                if ev not in seen_evidence:
                    seen_evidence.add(ev)
                    matches.append(CanaryMatch(secret=secret, variation_type=var_type, evidence=ev))

        # Check generic pattern for any undocumented canary format (e.g. PS_CANARY_...)
        for gen_match in self.GENERIC_CANARY_PATTERN.finditer(text):
            ev = gen_match.group(0)[:80]
            if ev not in seen_evidence:
                seen_evidence.add(ev)
                matches.append(CanaryMatch(secret=ev, variation_type="generic_canary_token", evidence=ev))

        # Check extraction intent
        for intent_pat in self.INTENT_PATTERNS:
            m_intent = intent_pat.search(text)
            if m_intent:
                ev = m_intent.group(0)[:80]
                if ev not in seen_evidence:
                    seen_evidence.add(ev)
                    matches.append(CanaryMatch(secret="INTENT_EXTRACTION", variation_type="extraction_intent", evidence=ev))
                break

        return matches
