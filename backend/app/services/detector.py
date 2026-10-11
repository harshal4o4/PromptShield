import re
import base64
from typing import List, Dict, Any, Optional
from app.schemas.analysis import SignalItem
from app.services.normalization import Normalizer, NormalizationResult
from app.services.canary_detector import CanaryDetector
from app.services.classifiers.factory import get_classifier
from app.core.config import settings


class DetectionResult:
    def __init__(
        self,
        signals: List[SignalItem],
        normalized_text: str,
        original_text: str,
        source_type: str,
        trust_level: str,
        detector_version: str = settings.detector_version,
        classifier_confidence: float = 0.0,
        classifier_details: Optional[Dict[str, Any]] = None
    ):
        self.signals = signals
        self.normalized_text = normalized_text
        self.original_text = original_text
        self.source_type = source_type
        self.trust_level = trust_level
        self.detector_version = detector_version
        self.classifier_confidence = classifier_confidence
        self.classifier_details = classifier_details or {}

    @property
    def has_signals(self) -> bool:
        return len(self.signals) > 0

    @property
    def highest_severity(self) -> str:
        if not self.signals:
            return "low"
        severities = [s.severity for s in self.signals]
        if "critical" in severities:
            return "critical"
        if "high" in severities:
            return "high"
        if "medium" in severities:
            return "medium"
        return "low"


class SecurityDetector:
    """
    Multi-layered Security Detection Engine combining:
    1. Canary & Protected Demo Secret Detection (variations, encodings, extraction intent)
    2. Deterministic Heuristics (Direct instruction overrides, system leaks, exfiltration sinks)
    3. Source-Aware Indirect Injection Detection (documents, web snippets, tool outputs)
    4. Obfuscation & Evasion Analysis (zero-width characters, control sequences, decoded base64 payloads)
    5. Specialized Prompt-Injection Classifier (Meta Llama Prompt Guard 2 / Local Classifier)
    6. Context-Aware False Positive Reduction
    """

    # 1. Direct Override patterns
    DIRECT_OVERRIDE_PATTERNS = [
        re.compile(r"(?i)\b(?:ignore|disregard|forget|bypass|override|drop)\b(?:\s+\w+){0,5}\s+\b(?:previous|prior|above|all|system|earlier|security)\b(?:\s+\w+){0,3}\s+\b(?:instructions?|rules?|prompts?|constraints?|directives?|polic(?:y|ies))\b"),
        re.compile(r"(?i)\b(?:you are now|act as|pretend to be|roleplay as|switch to)\b(?:\s+\w+){0,3}\s+\b(?:dan|jailbreak|unrestricted|developer mode|evil|unfiltered|godmode)\b"),
        re.compile(r"(?i)\bdo anything now\b"),
        re.compile(r"(?i)\bstart\s+(?:a\s+)?new\s+instructions?\b"),
        re.compile(r"(?i)\bdisable\s+(?:all\s+)?safety\s+(?:guidelines?|filters?|rules?)\b"),
        re.compile(r"(?i)\b(?:the\s+)?previous\s+instructions\s+are\s+obsolete\b"),
        re.compile(r"(?i)\btreat\s+this\s+(?:message|prompt)\s+as\s+the\s+highest(?:\s+priority)?\s+instruction\b"),
        re.compile(r"(?i)\bno\s+longer\s+bound\s+by\s+(?:any\s+)?rules\b"),
    ]

    # Context-aware benign discussions (False Positive Mitigation)
    DIRECT_OVERRIDE_BENIGN_PATTERNS = [
        re.compile(r"(?i)^(?:what is|how does|explain|definition of|can you describe|write an essay on|why is|research into)\s+.*?\b(?:prompt injection|jailbreak|override)\b"),
        re.compile(r"(?i)\b(?:in python|in javascript|in sql|git config|compiler|gitignore|dockerfile)\b.*?\b(?:ignore|system)\b")
    ]

    # 2. System Prompt Leak patterns
    SYSTEM_PROMPT_LEAK_PATTERNS = [
        re.compile(r"(?i)\b(?:repeat|print|output|show|reveal|display|echo|give me|tell me|quote)\b(?:\s+\w+){0,6}\s+\b(?:system prompt|initial prompt|developer prompt|developer message|hidden prompt|system instruction|hidden instruction|initial instruction|security rules|confidential configuration)s?\b"),
        re.compile(r"(?i)\bwhat\s+(?:were|are)\s+your\s+(?:initial|system|original|developer|internal)\s+(?:instructions?|prompts?|guidelines?)\b"),
        re.compile(r"(?i)\boutput\s+everything\s+above\s+verbatim\b"),
        re.compile(r"(?i)\bcopy\s+(?:and\s+paste\s+)?your\s+(?:exact\s+)?pre-prompt\b")
    ]

    SYSTEM_PROMPT_LEAK_BENIGN = [
        re.compile(r"(?i)^(?:what is|how do I write|how does|explain|how do developers|best practices for)\s+.*?\b(?:system prompt|prompt engineering)\b")
    ]

    # 3. Data Exfiltration patterns
    MARKDOWN_EXFIL_PATTERN = re.compile(r"!\[.*?\]\((https?://[^\s\)]+[\?&](?:token|data|secret|cookie|prompt|q|leak)=[^ \)]+)\)")
    EXFIL_URL_PATTERNS = [
        re.compile(r"(?i)\b(?:send|transmit|post|upload|exfiltrate|forward|curl|ping)\b(?:\s+\w+){0,6}\s+\b(?:to\s+|with\s+)?(https?://[^\s]+|webhook[^\s]*|requestbin[^\s]*)")
    ]

    # 4. Indirect Injection markers (documents / web / tools)
    INDIRECT_MARKERS = [
        re.compile(r"(?i)\[\s*(?:system|admin|override|system-instruction|prompt-override)\s*:\s*([^\]]+)\]"),
        re.compile(r"(?i)<!--\s*(?:system|instruction|prompt|override)\s*:\s*(.*?)-->"),
        re.compile(r"(?i)\bIMPORTANT\s+INSTRUCTION\s+FOR\s+(?:AI|ASSISTANT|MODEL)\s*:\s*(.+)"),
        re.compile(r"(?i)\bAI\s+ASSISTANT\s*:\s*ignore\s+all\s+(?:prior|other)\s+text\b"),
        re.compile(r"(?i)\bHuman\s*:\s*.*?Assistant\s*:\s*"),
        re.compile(r"(?i)<(?:system|instructions|prompt_override)>"),
    ]

    def __init__(self):
        self.canary_detector = CanaryDetector()
        self.classifier = get_classifier()

    def analyze(
        self,
        text: str,
        source_type: str = "user",
        trust_level: str = "untrusted",
        context: Optional[Dict[str, Any]] = None
    ) -> DetectionResult:
        context = context or {}

        # 1. Text Normalization (preserves original content while scanning normalized copy)
        norm_result: NormalizationResult = Normalizer.normalize(text)
        cleaned = norm_result.normalized_text

        signals: List[SignalItem] = []

        # --- Layer 1: Canary & Protected Demo Secret Variations ---
        canary_matches = self.canary_detector.scan(text)
        # Also scan normalized copy for spaced/cleaned variations
        if not canary_matches and cleaned != text:
            canary_matches = self.canary_detector.scan(cleaned)

        if canary_matches:
            for match in canary_matches:
                signals.append(
                    SignalItem(
                        rule_id="SYNTHETIC_SECRET_EXTRACTION",
                        label="Protected Demo Secret / Canary Detected",
                        severity="critical",
                        evidence=f"Variation ({match.variation_type}): {match.evidence}"
                    )
                )

        # --- Layer 2: Direct Instruction Override ---
        is_override_benign = any(b.search(cleaned) for b in self.DIRECT_OVERRIDE_BENIGN_PATTERNS)
        if not is_override_benign:
            for pattern in self.DIRECT_OVERRIDE_PATTERNS:
                m = pattern.search(cleaned)
                if m:
                    signals.append(
                        SignalItem(
                            rule_id="DIRECT_OVERRIDE",
                            label="Instruction Override Attempt",
                            severity="high",
                            evidence=m.group(0)[:80]
                        )
                    )
                    break

        # --- Layer 3: System Prompt Extraction / Leak ---
        is_leak_benign = any(b.search(cleaned) for b in self.SYSTEM_PROMPT_LEAK_BENIGN)
        if not is_leak_benign:
            for pattern in self.SYSTEM_PROMPT_LEAK_PATTERNS:
                m = pattern.search(cleaned)
                if m:
                    signals.append(
                        SignalItem(
                            rule_id="SYSTEM_PROMPT_LEAK",
                            label="System Prompt Extraction Attempt",
                            severity="high",
                            evidence=m.group(0)[:80]
                        )
                    )
                    break

        # --- Layer 4: Data Exfiltration Intent ---
        m_md = self.MARKDOWN_EXFIL_PATTERN.search(text)
        if m_md:
            signals.append(
                SignalItem(
                    rule_id="DATA_EXFILTRATION",
                    label="Markdown Image Exfiltration URL",
                    severity="high",
                    evidence=m_md.group(1)[:80]
                )
            )
        else:
            for pattern in self.EXFIL_URL_PATTERNS:
                m_exfil = pattern.search(cleaned)
                if m_exfil:
                    signals.append(
                        SignalItem(
                            rule_id="DATA_EXFILTRATION",
                            label="Unauthorized Data Transmission Intent",
                            severity="high",
                            evidence=m_exfil.group(0)[:80]
                        )
                    )
                    break

        # --- Layer 5: Indirect Prompt Injection (Source-Aware) ---
        # Any uploaded file, document, web scraped data, or tool output is treated as untrusted data
        if source_type in ["document", "web", "tool"] or trust_level != "trusted":
            for pattern in self.INDIRECT_MARKERS:
                m_ind = pattern.search(text) or pattern.search(cleaned)
                if m_ind:
                    signals.append(
                        SignalItem(
                            rule_id="INDIRECT_INJECTION",
                            label=f"Embedded Indirect Injection in {source_type.capitalize()}",
                            severity="high",
                            evidence=m_ind.group(0)[:80]
                        )
                    )
                    break

        # --- Layer 6: Obfuscation & Evasion Indicators ---
        if norm_result.has_control_chars or norm_result.has_zero_width_chars:
            signals.append(
                SignalItem(
                    rule_id="OBFUSCATION_EVASION",
                    label="Suspicious Control or Zero-Width Characters",
                    severity="medium",
                    evidence=", ".join(norm_result.detected_anomalies)
                )
            )
        elif norm_result.has_base64_indicator:
            # Check if base64 decodes into dangerous strings
            b64_blocks = Normalizer.BASE64_BLOCK_PATTERN.findall(text)
            for b in b64_blocks:
                try:
                    padded = b + "=" * ((4 - len(b) % 4) % 4)
                    decoded = base64.b64decode(padded).decode("utf-8", errors="ignore")
                    if any(p.search(decoded) for p in self.DIRECT_OVERRIDE_PATTERNS) or any(p.search(decoded) for p in self.SYSTEM_PROMPT_LEAK_PATTERNS):
                        signals.append(
                            SignalItem(
                                rule_id="OBFUSCATION_EVASION",
                                label="Base64 Encoded Adversarial Instruction",
                                severity="high",
                                evidence=f"Decoded payload snippet: {decoded[:60]}"
                            )
                        )
                        break
                except Exception:
                    pass

        # --- Layer 7: Specialized Prompt-Injection Classifier (Meta Llama Prompt Guard 2) ---
        classifier_res = self.classifier.classify(cleaned, source_type=source_type)
        if classifier_res.is_injection:
            # If deterministic checks haven't already marked critical, add classifier signal
            signals.append(
                SignalItem(
                    rule_id="PROMPT_GUARD_CLASSIFIER",
                    label=f"Specialized Classifier Alert ({classifier_res.provider_name})",
                    severity="high" if classifier_res.confidence >= 0.70 else "medium",
                    evidence=f"Confidence: {classifier_res.confidence:.2f} // Threat: {classifier_res.threat_category}"
                )
            )

        return DetectionResult(
            signals=signals,
            normalized_text=cleaned,
            original_text=text,
            source_type=source_type,
            trust_level=trust_level,
            classifier_confidence=classifier_res.confidence,
            classifier_details=classifier_res.details
        )
