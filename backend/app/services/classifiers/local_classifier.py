import re
import time
from typing import Dict, List, Tuple
from app.services.classifiers.base import BasePromptClassifier, ClassifierResult


class LocalSemanticClassifier(BasePromptClassifier):
    """
    Local multi-feature prompt injection classifier.
    Computes weighted adversarial intent scores across instruction hijacking,
    role distortion, rule nullification, and delimiter escaping.
    """

    FEATURE_WEIGHTS: List[Tuple[re.Pattern, float, str]] = [
        # Instruction hijacking & boundary breakout
        (re.compile(r"(?i)\b(?:ignore|forget|disregard|override|bypass)\b(?:\s+\w+){0,4}\s+\b(?:all|previous|prior|above|system)\b", re.IGNORECASE), 0.40, "instruction_breakout"),
        (re.compile(r"(?i)\b(?:you are now|pretend to be|act as|switch to)\b(?:\s+\w+){0,3}\s+\b(?:dan|developer mode|unrestricted|jailbreak|evil)\b", re.IGNORECASE), 0.35, "persona_override"),
        (re.compile(r"(?i)\bdo\s+anything\s+now\b", re.IGNORECASE), 0.35, "dan_variant"),
        (re.compile(r"(?i)\bstart\s+(?:a\s+)?new\s+conversation\s+where\s+you\b", re.IGNORECASE), 0.25, "context_clearing"),
        (re.compile(r"(?i)\bprint\s+(?:the\s+)?(?:secret|canary|system\s+prompt|developer\s+instructions?)\b", re.IGNORECASE), 0.35, "confidential_extraction"),
        (re.compile(r"(?i)\[\s*(?:system|admin|override)\s*:\s*[^\]]+\]", re.IGNORECASE), 0.30, "synthetic_role_injection"),
        (re.compile(r"(?i)\boutput\s+everything\s+above\s+verbatim\b", re.IGNORECASE), 0.30, "verbatim_leakage"),
        (re.compile(r"(?i)\bno\s+restrictions\s+or\s+safety\s+filters\b", re.IGNORECASE), 0.25, "safety_disabling"),
        (re.compile(r"(?i)\bdisclose\s+(?:all\s+)?(?:internal|hidden)\s+guidelines\b", re.IGNORECASE), 0.25, "guideline_disclosure"),
    ]

    BENIGN_DISCUSSIONS = [
        re.compile(r"(?i)^(?:what is|how does|explain|definition of|can you describe|write an essay on)\s+.*?\b(?:prompt injection|jailbreak|override)\b"),
        re.compile(r"(?i)\b(?:in python|in javascript|in sql|git config|compiler|gitignore)\b")
    ]

    def classify(self, text: str, source_type: str = "user") -> ClassifierResult:
        start_time = time.perf_counter()

        # Hard negative check: benign informational query
        for benign_pat in self.BENIGN_DISCUSSIONS:
            if benign_pat.search(text):
                latency = (time.perf_counter() - start_time) * 1000
                return ClassifierResult(
                    is_injection=False,
                    confidence=0.08,
                    threat_category="",
                    provider_name="local_semantic_classifier",
                    latency_ms=latency,
                    details={"matched_features": [], "context": "educational_benign"}
                )

        score = 0.0
        matched_categories = []

        for pattern, weight, category in self.FEATURE_WEIGHTS:
            if pattern.search(text):
                score += weight
                matched_categories.append(category)

        # Source context weighting: documents & web sources with instruction markers get higher scrutiny
        if source_type in ["document", "web", "tool"]:
            if any("injection" in cat or "instruction" in cat for cat in matched_categories):
                score = min(1.0, score + 0.15)

        # Cap score at 1.0
        confidence = min(1.0, score)
        is_injection = confidence >= 0.40
        primary_cat = matched_categories[0] if matched_categories else ""

        latency = (time.perf_counter() - start_time) * 1000
        return ClassifierResult(
            is_injection=is_injection,
            confidence=round(confidence, 3),
            threat_category=f"LOCAL_CLASSIFIER:{primary_cat}" if is_injection else "",
            provider_name="local_semantic_classifier",
            latency_ms=latency,
            details={"matched_categories": matched_categories, "raw_score": score}
        )
