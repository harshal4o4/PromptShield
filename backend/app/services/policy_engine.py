import json
from datetime import datetime, timezone
from typing import Optional, Literal
from app.services.detector import DetectionResult
from app.services.sanitization import Sanitizer, SanitizationResult
from app.core.database import get_db_connection, DEFAULT_POLICY_CONFIG


class DecisionResult:
    def __init__(
        self,
        decision: Literal["ALLOW", "BLOCK", "SANITIZE", "ESCALATE"],
        risk_level: Literal["low", "medium", "high", "critical"],
        summary: str,
        sanitized_text: Optional[str],
        policy_version: str,
        evaluated_at: str
    ):
        self.decision = decision
        self.risk_level = risk_level
        self.summary = summary
        self.sanitized_text = sanitized_text
        self.policy_version = policy_version
        self.evaluated_at = evaluated_at


class PolicyEngine:
    def __init__(self, policy_config: Optional[dict] = None):
        self._policy_config = policy_config

    def _get_active_policy(self) -> dict:
        if self._policy_config:
            return self._policy_config

        try:
            with get_db_connection() as conn:
                row = conn.execute("SELECT config_json FROM policies WHERE id = 'active'").fetchone()
                if row:
                    return json.loads(row["config_json"])
        except Exception:
            pass
        return DEFAULT_POLICY_CONFIG

    def evaluate(self, detection: DetectionResult) -> DecisionResult:
        policy = self._get_active_policy()
        policy_version = policy.get("version", "1.0.0")
        rules_conf = policy.get("rules", {})
        severity_actions = policy.get("severity_actions", {})
        sanitization_enabled = policy.get("sanitization_enabled", True)
        ambiguous_escalation = policy.get("ambiguous_escalation", True)
        evaluated_at = datetime.now(timezone.utc).isoformat()

        # Filter signals based on enabled state in policy
        active_signals = []
        for s in detection.signals:
            rule_entry = rules_conf.get(s.rule_id, {})
            # If rule is configured and disabled, skip it
            if rule_entry and not rule_entry.get("enabled", True):
                continue
            active_signals.append(s)

        # Case 1: No active risk signals
        if not active_signals:
            return DecisionResult(
                decision="ALLOW",
                risk_level="low",
                summary="No policy-triggering risk was detected in the submitted payload.",
                sanitized_text=None,
                policy_version=policy_version,
                evaluated_at=evaluated_at
            )

        # Assess highest severity among active signals
        severities = [s.severity for s in active_signals]
        if "critical" in severities:
            highest_sev = "critical"
        elif "high" in severities:
            highest_sev = "high"
        elif "medium" in severities:
            highest_sev = "medium"
        else:
            highest_sev = "low"

        # Check for ambiguity (multiple diverse vectors or untrusted source conflict)
        rule_ids = set(s.rule_id for s in active_signals)
        is_ambiguous = ambiguous_escalation and len(rule_ids) >= 2 and highest_sev == "medium"

        if is_ambiguous:
            return DecisionResult(
                decision="ESCALATE",
                risk_level=highest_sev,
                summary=f"Multiple conflicting threat vectors detected ({', '.join(rule_ids)}). Escalated for human triage.",
                sanitized_text=None,
                policy_version=policy_version,
                evaluated_at=evaluated_at
            )

        # Map through severity action or specific rule action
        rule_actions = [rules_conf.get(s.rule_id, {}).get("action") for s in active_signals if rules_conf.get(s.rule_id, {}).get("action")]
        if "BLOCK" in rule_actions:
            target_action = "BLOCK"
        elif "ESCALATE" in rule_actions:
            target_action = "ESCALATE"
        elif "SANITIZE" in rule_actions:
            target_action = "SANITIZE"
        else:
            target_action = severity_actions.get(highest_sev, "BLOCK")

        # Handle SANITIZE action
        sanitized_payload = None
        if target_action == "SANITIZE":
            if sanitization_enabled:
                san_res: SanitizationResult = Sanitizer.sanitize(detection.normalized_text, active_signals)
                if san_res.was_sanitized and san_res.sanitized_text:
                    sanitized_payload = san_res.sanitized_text
                    return DecisionResult(
                        decision="SANITIZE",
                        risk_level=highest_sev,
                        summary=f"Defensible sanitization performed: {san_res.rationale}.",
                        sanitized_text=sanitized_payload,
                        policy_version=policy_version,
                        evaluated_at=evaluated_at
                    )
                else:
                    # Fallback when sanitization is not defensible
                    target_action = "BLOCK" if highest_sev in ["high", "critical"] else "ESCALATE"
            else:
                target_action = "BLOCK" if highest_sev in ["high", "critical"] else "ESCALATE"

        # Build summary
        signal_labels = [s.label for s in active_signals]
        summary = f"Detected {', '.join(signal_labels)}. Action applied per policy '{policy_version}'."

        return DecisionResult(
            decision=target_action,
            risk_level=highest_sev,
            summary=summary,
            sanitized_text=sanitized_payload,
            policy_version=policy_version,
            evaluated_at=evaluated_at
        )
