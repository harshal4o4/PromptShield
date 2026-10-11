import time
import logging
from typing import Optional, Dict, Any, Tuple
from app.core.config import settings
from app.schemas.analysis import SignalItem, AnalysisRequest
from app.services.file_extractor import FileExtractor, ExtractedDocument
from app.services.detector import SecurityDetector, DetectionResult
from app.services.policy_engine import PolicyEngine, DecisionResult
from app.services.protected_model.adapter import get_protected_model, BaseProtectedModel
from app.services.output_guard import OutputGuard, OutputGuardResult
from app.services.audit import AuditService

logger = logging.getLogger("promptshield.pipeline")


class PipelineExecutionResult:
    def __init__(
        self,
        event_id: str,
        decision: str,
        risk_level: str,
        summary: str,
        signals: list,
        sanitized_text: Optional[str],
        model_response: Optional[str],
        output_security_check: Optional[str],
        analyzed_at: str,
        execution_latency_ms: float,
        detector_version: str,
        policy_version: str,
        source_type: str,
        trust_level: str,
        threat_categories: list,
        rule_identifiers: list
    ):
        self.event_id = event_id
        self.decision = decision
        self.risk_level = risk_level
        self.summary = summary
        self.signals = signals
        self.sanitized_text = sanitized_text
        self.model_response = model_response
        self.output_security_check = output_security_check
        self.analyzed_at = analyzed_at
        self.execution_latency_ms = execution_latency_ms
        self.detector_version = detector_version
        self.policy_version = policy_version
        self.source_type = source_type
        self.trust_level = trust_level
        self.threat_categories = threat_categories
        self.rule_identifiers = rule_identifiers


class SecurityPipeline:
    """
    Core PromptShield Security Pipeline:
    Input Prompt / Uploaded File / Simulated Tool Output
    → Input Validation
    → Text Extraction and Normalization
    → Source Identification & Untrusted Data Labeling
    → Threat Detection (Canaries + Heuristics + Meta Llama Prompt Guard)
    → Policy Engine (ALLOW / BLOCK / SANITIZE / ESCALATE)
    → Security Decision
    → Protected AI Model (only when permitted)
    → Output Security Check
    → Response & Audit Logging
    """

    def __init__(
        self,
        detector: Optional[SecurityDetector] = None,
        policy_engine: Optional[PolicyEngine] = None,
        model_adapter: Optional[BaseProtectedModel] = None,
        output_guard: Optional[OutputGuard] = None,
        audit_service: Optional[AuditService] = None
    ):
        self.detector = detector or SecurityDetector()
        self.policy_engine = policy_engine or PolicyEngine()
        self.model_adapter = model_adapter or get_protected_model()
        self.output_guard = output_guard or OutputGuard()
        self.audit_service = audit_service or AuditService()

    def process_text(
        self,
        text: str,
        source_type: str = "user",
        trust_level: str = "untrusted",
        call_model: bool = False,
        system_prompt: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> PipelineExecutionResult:
        start_time = time.perf_counter()
        context = context or {}

        # 1. Input Validation
        if not text or not text.strip():
            raise ValueError("Input text cannot be empty.")
        if len(text) > settings.max_text_length:
            raise ValueError(f"Input text exceeds maximum allowed length of {settings.max_text_length} characters.")

        # 2 & 3. Extraction, Normalization & Threat Detection
        detection_result: DetectionResult = self.detector.analyze(
            text=text,
            source_type=source_type,
            trust_level=trust_level,
            context=context
        )

        # 4 & 5. Policy Engine Evaluation & Decision
        decision_result: DecisionResult = self.policy_engine.evaluate(detection_result)

        # 6. Protected AI Model Call (ONLY when permitted: ALLOW or SANITIZE)
        model_response_text: Optional[str] = None
        output_check_status: Optional[str] = None

        if call_model:
            if decision_result.decision in ["ALLOW", "SANITIZE"]:
                # Determine text to forward: if sanitized, send sanitized text; otherwise original
                effective_prompt = decision_result.sanitized_text if decision_result.decision == "SANITIZE" else text
                
                # Invoke Protected AI Model
                raw_model_res = self.model_adapter.generate(
                    prompt=effective_prompt,
                    system_prompt=system_prompt
                )

                # 7. Output Security Check
                output_res: OutputGuardResult = self.output_guard.inspect(raw_model_res.content)
                model_response_text = output_res.output_text
                output_check_status = output_res.status
            else:
                # Prohibited: Do NOT call protected model
                model_response_text = f"[PromptShield Interception]: Request blocked by policy engine ({decision_result.decision}). Protected model was not called."
                output_check_status = "not_applicable"

        # 8. Audit Logging & Telemetry Persistence
        req_obj = AnalysisRequest(
            text=text[:10000],
            source_type=source_type,
            trust_level=trust_level,
            context=context
        )
        event_id = self.audit_service.log_event(
            request=req_obj,
            detection=detection_result,
            decision=decision_result
        )

        total_latency = (time.perf_counter() - start_time) * 1000

        return PipelineExecutionResult(
            event_id=event_id,
            decision=decision_result.decision,
            risk_level=decision_result.risk_level,
            summary=decision_result.summary,
            signals=detection_result.signals,
            sanitized_text=decision_result.sanitized_text,
            model_response=model_response_text,
            output_security_check=output_check_status,
            analyzed_at=decision_result.evaluated_at,
            execution_latency_ms=round(total_latency, 2),
            detector_version=detection_result.detector_version,
            policy_version=decision_result.policy_version,
            source_type=source_type,
            trust_level=trust_level,
            threat_categories=decision_result.threat_categories,
            rule_identifiers=decision_result.rule_identifiers
        )

    def process_file(
        self,
        file_bytes: bytes,
        filename: str,
        call_model: bool = False,
        system_prompt: Optional[str] = None
    ) -> Tuple[ExtractedDocument, PipelineExecutionResult]:
        # Step 1 & 2: Validate file and safely extract text in-memory
        doc = FileExtractor.validate_and_extract(file_bytes, filename)

        # Step 3: Identify document content as untrusted data
        pipeline_res = self.process_text(
            text=doc.text,
            source_type="document",
            trust_level="untrusted",
            call_model=call_model,
            system_prompt=system_prompt,
            context={"filename": doc.filename, "file_type": doc.file_type, "file_size_bytes": doc.size_bytes}
        )

        return doc, pipeline_res
