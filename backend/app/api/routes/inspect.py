from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.schemas.analysis import FileInspectionResponse, AnalysisResponse
from app.services.file_extractor import FileValidationError
from app.services.pipeline import SecurityPipeline

router = APIRouter(prefix="/api/v1/inspect", tags=["Inspection"])

pipeline = SecurityPipeline()


@router.post("/file", response_model=FileInspectionResponse)
async def inspect_file(
    file: UploadFile = File(..., description="TXT, PDF, or DOCX document to inspect safely"),
    call_model: bool = Form(default=False, description="Whether to call protected model if document is permitted")
):
    """
    Safely inspects an uploaded document (TXT, PDF, or DOCX):
    1. Validates file extension, size limit, and rejects executable headers
    2. Safely extracts plain text in-memory
    3. Designates content as untrusted document source
    4. Runs full PromptShield security pipeline: Heuristics, Canaries, and Meta Llama Prompt Guard
    5. Returns policy decision, identified threat signals, and safe excerpt
    """
    try:
        content = await file.read()
        doc, res = pipeline.process_file(
            file_bytes=content,
            filename=file.filename or "uploaded_file.txt",
            call_model=call_model
        )

        analysis_obj = AnalysisResponse(
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

        return FileInspectionResponse(
            filename=doc.filename,
            file_type=doc.file_type,
            size_bytes=doc.size_bytes,
            extracted_length=doc.character_count,
            extracted_excerpt=doc.excerpt,
            analysis=analysis_obj
        )

    except FileValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File inspection failed: {str(e)}"
        )
