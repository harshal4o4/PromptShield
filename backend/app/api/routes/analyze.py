from fastapi import APIRouter
from app.schemas.analysis import AnalysisRequest, AnalysisResponse

router = APIRouter(prefix="/api/v1/analyze", tags=["Analyze"])


@router.post("", response_model=AnalysisResponse)
def analyze_prompt(payload: AnalysisRequest):
    """Analyze input text, detect prompt injection / data exfiltration, apply policy, and persist audit event."""
    from app.services.detector import SecurityDetector
    from app.services.policy_engine import PolicyEngine
    from app.services.audit import AuditService

    detector = SecurityDetector()
    policy_engine = PolicyEngine()
    audit_service = AuditService()

    detection_result = detector.analyze(
        text=payload.text,
        source_type=payload.source_type,
        trust_level=payload.trust_level,
        context=payload.context or {}
    )

    decision_result = policy_engine.evaluate(detection_result)

    event_id = audit_service.log_event(
        request=payload,
        detection=detection_result,
        decision=decision_result
    )

    return AnalysisResponse(
        event_id=event_id,
        decision=decision_result.decision,
        risk_level=decision_result.risk_level,
        summary=decision_result.summary,
        signals=detection_result.signals,
        sanitized_text=decision_result.sanitized_text,
        analyzed_at=decision_result.evaluated_at,
        detector_version=detection_result.detector_version,
        policy_version=decision_result.policy_version
    )
