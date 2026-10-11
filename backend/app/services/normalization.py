import re
import unicodedata
from typing import Dict, Any, List


class NormalizationResult:
    def __init__(
        self,
        original_text: str,
        normalized_text: str,
        detected_anomalies: List[str],
        has_zero_width_chars: bool,
        has_control_chars: bool,
        has_base64_indicator: bool
    ):
        self.original_text = original_text
        self.normalized_text = normalized_text
        self.detected_anomalies = detected_anomalies
        self.has_zero_width_chars = has_zero_width_chars
        self.has_control_chars = has_control_chars
        self.has_base64_indicator = has_base64_indicator


class Normalizer:
    # Zero-width spaces, joiners, direction marks
    ZERO_WIDTH_PATTERN = re.compile(r"[\u200B-\u200D\uFEFF\u202A-\u202E]")
    # Control chars except newline, tab, carriage return
    CONTROL_CHAR_PATTERN = re.compile(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]")
    # Potential base64 block indicator (at least 20 chars of valid b64 ending with = or without space)
    BASE64_BLOCK_PATTERN = re.compile(r"(?:[A-Za-z0-9+/]{20,}={0,2})")

    @classmethod
    def normalize(cls, text: str) -> NormalizationResult:
        anomalies = []

        # 1. Check for zero-width characters
        has_zw = bool(cls.ZERO_WIDTH_PATTERN.search(text))
        if has_zw:
            anomalies.append("zero_width_characters_detected")

        # 2. Check for unexpected control characters
        has_ctrl = bool(cls.CONTROL_CHAR_PATTERN.search(text))
        if has_ctrl:
            anomalies.append("control_characters_detected")

        # 3. Check for base64 blocks
        has_b64 = bool(cls.BASE64_BLOCK_PATTERN.search(text))
        if has_b64:
            anomalies.append("base64_pattern_detected")

        # 4. Unicode normalization (NFKC)
        cleaned = unicodedata.normalize("NFKC", text)

        # 5. Strip zero-width chars from the normalized comparison buffer
        cleaned = cls.ZERO_WIDTH_PATTERN.sub("", cleaned)

        # 6. Normalize line endings and collapse extreme repetitive spacing
        cleaned = re.sub(r"\r\n|\r", "\n", cleaned)
        cleaned = re.sub(r"[ \t]+", " ", cleaned)

        return NormalizationResult(
            original_text=text,
            normalized_text=cleaned,
            detected_anomalies=anomalies,
            has_zero_width_chars=has_zw,
            has_control_chars=has_ctrl,
            has_base64_indicator=has_b64
        )
