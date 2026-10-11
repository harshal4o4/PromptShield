import uuid
import json
import re
from app.core.database import get_db_connection
from app.schemas.analysis import AnalysisRequest
from app.services.detector import DetectionResult
from app.services.policy_engine import DecisionResult


class AuditService:
    CANARY_REDACT_PATTERN = re.compile(r"PS_(?:DEMO_SECRET|CANARY)_[A-Za-z0-9_]+")

    def log_event(
        self,
        request: AnalysisRequest,
        detection: DetectionResult,
        decision: DecisionResult,
        is_demo: bool = False
    ) -> str:
        event_id = str(uuid.uuid4())

        # Create bounded redacted excerpt
        excerpt = request.text[:200]
        # Redact any canaries from stored excerpt
        excerpt = self.CANARY_REDACT_PATTERN.sub("[REDACTED_CANARY_TOKEN]", excerpt)

        signals_data = [s.model_dump() for s in detection.signals]
        is_attack = 1 if (decision.decision in ["BLOCK", "SANITIZE", "ESCALATE"] or detection.has_signals) else 0

        with get_db_connection() as conn:
            conn.execute(
                """
                INSERT INTO events (
                    id, timestamp, source_type, trust_level, decision, risk_level,
                    summary, signals_json, redacted_excerpt, sanitized_text,
                    detector_version, policy_version, is_attack, is_demo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    event_id,
                    decision.evaluated_at,
                    request.source_type,
                    request.trust_level,
                    decision.decision,
                    decision.risk_level,
                    decision.summary,
                    json.dumps(signals_data),
                    excerpt,
                    decision.sanitized_text,
                    detection.detector_version,
                    decision.policy_version,
                    is_attack,
                    1 if is_demo else 0
                )
            )

        return event_id
