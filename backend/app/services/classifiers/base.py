from abc import ABC, abstractmethod
from typing import Optional, Dict, Any


class ClassifierResult:
    def __init__(
        self,
        is_injection: bool,
        confidence: float,
        threat_category: str,
        provider_name: str,
        latency_ms: float = 0.0,
        error: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.is_injection = is_injection
        self.confidence = confidence
        self.threat_category = threat_category
        self.provider_name = provider_name
        self.latency_ms = latency_ms
        self.error = error
        self.details = details or {}


class BasePromptClassifier(ABC):
    """Abstract interface for external and local prompt injection classifiers."""

    @abstractmethod
    def classify(self, text: str, source_type: str = "user") -> ClassifierResult:
        """Classify input text and return a standardized ClassifierResult."""
        pass
