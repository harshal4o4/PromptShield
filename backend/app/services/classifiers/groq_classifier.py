import time
import logging
import httpx
from typing import Optional
from app.core.config import settings
from app.services.classifiers.base import BasePromptClassifier, ClassifierResult

logger = logging.getLogger("promptshield.classifier.groq")


class GroqPromptGuardClassifier(BasePromptClassifier):
    """
    Modular classifier adapter for Meta Llama Prompt Guard / Llama Guard via Groq API.
    Enforces strict timeouts, error handling, and documented failure policies.
    """

    GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        timeout_seconds: Optional[float] = None,
        failure_policy: Optional[str] = None
    ):
        self.api_key = api_key or settings.groq_api_key
        self.model = model or settings.groq_prompt_guard_model
        self.timeout = timeout_seconds or settings.classifier_timeout_seconds
        self.failure_policy = failure_policy or settings.classifier_failure_policy

    def _apply_failure_policy(self, error_msg: str, start_time: float) -> ClassifierResult:
        latency = (time.perf_counter() - start_time) * 1000
        logger.warning(f"Groq Prompt Guard unavailable: {error_msg}. Applying policy: {self.failure_policy}")

        if self.failure_policy == "fail_closed":
            return ClassifierResult(
                is_injection=True,
                confidence=1.0,
                threat_category="CLASSIFIER_FAILURE_CLOSED",
                provider_name="groq_llama_guard",
                latency_ms=latency,
                error=error_msg,
                details={"failure_policy": "fail_closed"}
            )
        elif self.failure_policy == "escalate":
            return ClassifierResult(
                is_injection=True,
                confidence=0.5,
                threat_category="CLASSIFIER_FAILURE_ESCALATE",
                provider_name="groq_llama_guard",
                latency_ms=latency,
                error=error_msg,
                details={"failure_policy": "escalate"}
            )
        else:
            # "fallback_heuristics": do not treat as safe, but allow deterministic rules to govern
            return ClassifierResult(
                is_injection=False,
                confidence=0.0,
                threat_category="CLASSIFIER_FALLBACK_HEURISTICS",
                provider_name="groq_llama_guard",
                latency_ms=latency,
                error=error_msg,
                details={"failure_policy": "fallback_heuristics"}
            )

    def classify(self, text: str, source_type: str = "user") -> ClassifierResult:
        start_time = time.perf_counter()

        if not self.api_key:
            return self._apply_failure_policy("GROQ_API_KEY is not configured", start_time)

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        # Format input for Llama Guard safety classification
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": f"[Source: {source_type}]\n{text[:4000]}"
                }
            ],
            "temperature": 0.0,
            "max_tokens": 50
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(self.GROQ_API_URL, json=payload, headers=headers)

            latency = (time.perf_counter() - start_time) * 1000

            if response.status_code != 200:
                return self._apply_failure_policy(f"HTTP {response.status_code}: {response.text[:120]}", start_time)

            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()

            # Llama Guard returns "unsafe\n<category>" or "safe"
            if content.lower().startswith("unsafe"):
                lines = content.split("\n")
                category = lines[1].strip() if len(lines) > 1 else "adversarial_prompt_injection"
                return ClassifierResult(
                    is_injection=True,
                    confidence=0.96,
                    threat_category=f"GROQ_LLAMA_GUARD:{category}",
                    provider_name="groq_llama_guard",
                    latency_ms=latency,
                    details={"raw_output": content}
                )
            else:
                return ClassifierResult(
                    is_injection=False,
                    confidence=0.04,
                    threat_category="",
                    provider_name="groq_llama_guard",
                    latency_ms=latency,
                    details={"raw_output": content}
                )

        except httpx.TimeoutException:
            return self._apply_failure_policy(f"Request timed out after {self.timeout}s", start_time)
        except Exception as e:
            return self._apply_failure_policy(f"Network error: {str(e)}", start_time)
