from fastapi import APIRouter
from app.schemas.analysis import AnalysisRequest, AnalysisResponse
from app.services.pipeline import SecurityPipeline

router = APIRouter(prefix="/api/v1/analyze", tags=["Analyze"])

# Global pipeline instance
pipeline = SecurityPipeline()


@router.post("", response_model=AnalysisResponse)
def analyze_prompt(payload: AnalysisRequest):
    """
    Executes PromptShield Security Pipeline:
    Input Validation → Extraction & Normalization → Threat Detection → Policy Engine
    → Security Decision → Protected AI Model (only when permitted) → Output Security Check → Audit Log
    """
    res = pipeline.process_text(
        text=payload.text,
        source_type=payload.source_type,
        trust_level=payload.trust_level,
        call_model=payload.call_model,
        context=payload.context or {}
    )

    return AnalysisResponse(
        event_id=res.event_id,
        decision=res.decision,
        risk_level=res.risk_level,
        summary=res.summary,
        signals=res.signals,
        sanitized_text=res.sanitized_text,
        analyzed_at=res.analyzed_at,
        detector_version=res.detector_version,
        policy_version=res.policy_version,
        model_response=res.model_response,
        output_security_check=res.output_security_check,
        execution_latency_ms=res.execution_latency_ms,
        threat_categories=res.threat_categories,
        rule_identifiers=res.rule_identifiers
    )
