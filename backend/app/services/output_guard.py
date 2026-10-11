import re
from typing import Optional, List
from app.services.canary_detector import CanaryDetector, CanaryMatch


class OutputGuardResult:
    def __init__(
        self,
        status: str,  # "passed" | "blocked" | "sanitized"
        output_text: str,
        violations: List[str],
        reason: Optional[str] = None
    ):
        self.status = status
        self.output_text = output_text
        self.violations = violations
        self.reason = reason

    @property
    def is_clean(self) -> bool:
        return self.status == "passed"


class OutputGuard:
    """
    Middleware output security inspector.
    Evaluates protected AI model output before it is returned to the client,
    ensuring no confidential canaries, internal pre-prompts, or exfiltration links escape.
    """

    EXFIL_URL_PATTERN = re.compile(r"!\[.*?\]\((https?://[^\s\)]+[\?&](?:token|data|secret|cookie|prompt|q|leak)=[^ \)]+)\)")
    SYSTEM_LEAK_OUTPUT_PATTERN = re.compile(r"(?i)(?:my\s+initial\s+system\s+instructions\s+are|here\s+is\s+my\s+confidential\s+system\s+prompt|developer\s+message\s+verbatim\s*:\s*)")

    def __init__(self):
        self.canary_detector = CanaryDetector()

    def inspect(self, model_output: str) -> OutputGuardResult:
        violations = []

        # 1. Check for Canary Secret Leaks in output
        canary_matches = self.canary_detector.scan(model_output)
        if canary_matches:
            for match in canary_matches:
                violations.append(f"Canary secret leak ({match.variation_type}): {match.secret}")

        # 2. Check for Markdown exfiltration links embedded in output
        if self.EXFIL_URL_PATTERN.search(model_output):
            violations.append("Data exfiltration markdown link found in generated text")

        # 3. Check for blatant system prompt regurgitation
        if self.SYSTEM_LEAK_OUTPUT_PATTERN.search(model_output):
            violations.append("System pre-prompt leakage pattern detected in model response")

        if violations:
            redacted_msg = (
                "[PROMPTSHIELD SECURITY INTERCEPTION: Output blocked and redacted by PromptShield middleware. "
                "The protected model output attempted to disclose a sensitive canary secret or confidential policy instruction.]"
            )
            return OutputGuardResult(
                status="blocked",
                output_text=redacted_msg,
                violations=violations,
                reason="; ".join(violations)
            )

        return OutputGuardResult(
            status="passed",
            output_text=model_output,
            violations=[]
        )
