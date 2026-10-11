import time
import logging
import httpx
from abc import ABC, abstractmethod
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("promptshield.protected_model")


class ModelResponse:
    def __init__(
        self,
        content: str,
        model_name: str,
        tokens_used: int = 0,
        latency_ms: float = 0.0,
        is_simulated: bool = False
    ):
        self.content = content
        self.model_name = model_name
        self.tokens_used = tokens_used
        self.latency_ms = latency_ms
        self.is_simulated = is_simulated


class BaseProtectedModel(ABC):
    """Abstract interface for protected downstream AI models."""

    @abstractmethod
    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> ModelResponse:
        pass


class GroqProtectedModel(BaseProtectedModel):
    """
    Adapter invoking Groq LLM API (Meta Llama 3.3 70B / Llama 3.1 8B)
    only when permitted by the PromptShield policy engine.
    """

    GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        timeout_seconds: float = 10.0
    ):
        self.api_key = api_key or settings.groq_api_key
        self.model = model or settings.groq_ai_model
        self.timeout = timeout_seconds

    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> ModelResponse:
        start_time = time.perf_counter()

        if not self.api_key:
            logger.info("Groq API key not set; using simulated protected model.")
            sim = SimulatedProtectedModel()
            return sim.generate(prompt, system_prompt)

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        messages = []
        sys_msg = system_prompt or "You are a helpful, secure enterprise AI assistant protected by PromptShield middleware."
        messages.append({"role": "system", "content": sys_msg})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": 800
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.post(self.GROQ_API_URL, json=payload, headers=headers)

            latency = (time.perf_counter() - start_time) * 1000

            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                tokens = data.get("usage", {}).get("total_tokens", 0)
                return ModelResponse(
                    content=content,
                    model_name=self.model,
                    tokens_used=tokens,
                    latency_ms=latency,
                    is_simulated=False
                )
            else:
                logger.warning(f"Groq generation failed with HTTP {resp.status_code}, falling back to simulated model.")
                sim = SimulatedProtectedModel()
                return sim.generate(prompt, system_prompt)

        except Exception as e:
            logger.warning(f"Groq API call failed: {str(e)}, falling back to simulated model.")
            sim = SimulatedProtectedModel()
            return sim.generate(prompt, system_prompt)


class SimulatedProtectedModel(BaseProtectedModel):
    """
    High-fidelity simulated enterprise AI model for local testing and live demonstrations.
    Provides realistic task completions for approved prompts while ensuring deterministic behavior.
    """

    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> ModelResponse:
        start_time = time.perf_counter()
        p_lower = prompt.lower()

        # Generate realistic domain response
        if "revenue" in p_lower or "quarterly" in p_lower or "growth" in p_lower:
            content = (
                "### Quarterly Financial Analysis Summary\n\n"
                "- **Total Q3 Revenue**: $48.2M (+14.5% YoY growth)\n"
                "- **Operating Margin**: 28.4% (up 180 bps from prior quarter)\n"
                "- **Gross Margin**: 71.2%\n\n"
                "**Key Driver**: SaaS recurring revenue reached 82% of total receipts, driven by enterprise cloud migrations. "
                "Operating expenses remained controlled within budget guidelines."
            )
        elif "candidate" in p_lower or "resume" in p_lower:
            content = (
                "### Candidate Evaluation Summary\n\n"
                "- **Technical Experience**: 10 years in software engineering and cloud infrastructure.\n"
                "- **Core Competencies**: Distributed systems, microservices, secure API development.\n"
                "- **Assessment**: Strong technical qualifications aligned with senior engineering requirements. "
                "Recommended for technical interview round."
            )
        elif "summarize" in p_lower or "summary" in p_lower:
            content = (
                "### Document Summary\n\n"
                "The submitted text outlines key operational milestones, core requirements, and implementation guidelines. "
                "All primary objectives have been cataloged with verifiable completion criteria."
            )
        elif "code" in p_lower or "python" in p_lower or "function" in p_lower:
            content = (
                "```python\n"
                "# PromptShield Protected Execution Example\n"
                "def verify_secure_pipeline(payload: str) -> bool:\n"
                "    \"\"\"Verifies that payload passed middleware checks before execution.\"\"\"\n"
                "    return len(payload.strip()) > 0\n"
                "```\n\n"
                "The code snippet implements input boundary validation adhering to secure programming practices."
            )
        else:
            content = (
                f"### Analysis Result\n\n"
                f"Successfully processed validated input ({len(prompt)} characters). "
                f"Your request was inspected and safely executed through PromptShield's protected AI middleware."
            )

        latency = (time.perf_counter() - start_time) * 1000 + 15.0  # realistic simulated latency
        return ModelResponse(
            content=content,
            model_name="promptshield-simulated-llm-v1",
            tokens_used=len(content.split()) * 2,
            latency_ms=latency,
            is_simulated=True
        )


def get_protected_model() -> BaseProtectedModel:
    """Factory resolving the active protected model adapter."""
    if settings.protected_model_provider == "groq" and settings.groq_api_key:
        return GroqProtectedModel()
    elif settings.protected_model_provider == "simulated":
        return SimulatedProtectedModel()
    else:  # "auto"
        if settings.groq_api_key and settings.groq_api_key.strip():
            return GroqProtectedModel()
        return SimulatedProtectedModel()
