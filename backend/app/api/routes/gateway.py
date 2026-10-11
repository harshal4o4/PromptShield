from typing import Optional, Dict, Any, Literal
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from app.services.pipeline import SecurityPipeline

router = APIRouter(prefix="/api/v1/gateway", tags=["Gateway Middleware"])

pipeline = SecurityPipeline()


class GatewayChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=100000, description="User prompt or retrieved document")
    source_type: Literal["user", "document", "web", "tool"] = "user"
    trust_level: Literal["trusted", "untrusted", "semi-trusted"] = "untrusted"
    system_prompt: Optional[str] = None
    context: Optional[Dict[str, Any]] = Field(default_factory=dict)


class GatewayChatResponse(BaseModel):
    success: bool
    decision: str
    risk_level: str
    message: str
    model_response: Optional[str] = None
    output_security_check: Optional[str] = None
    signals_count: int
    event_id: str
    execution_latency_ms: float


@router.post("/chat", response_model=GatewayChatResponse)
def gateway_chat(req: GatewayChatRequest):
    """
    Middleware Gateway: Protects AI model applications against prompt injection,
    indirect injections, and sensitive data exfiltration before model execution.
    Only permitted inputs proceed to the protected model.
    """
    res = pipeline.process_text(
        text=req.prompt,
        source_type=req.source_type,
        trust_level=req.trust_level,
        call_model=True,
        system_prompt=req.system_prompt,
        context=req.context
    )

    is_permitted = res.decision in ["ALLOW", "SANITIZE"]

    return GatewayChatResponse(
        success=is_permitted,
        decision=res.decision,
        risk_level=res.risk_level,
        message=res.summary,
        model_response=res.model_response if is_permitted else None,
        output_security_check=res.output_security_check,
        signals_count=len(res.signals),
        event_id=res.event_id,
        execution_latency_ms=res.execution_latency_ms
    )
