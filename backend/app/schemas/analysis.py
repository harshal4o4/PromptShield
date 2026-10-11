from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field


class SignalItem(BaseModel):
    rule_id: str
    label: str
    severity: Literal["low", "medium", "high", "critical"]
    evidence: str


class AnalysisRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=100000, description="Untrusted text to inspect")
    source_type: Literal["user", "document", "web", "tool"] = "user"
    trust_level: Literal["trusted", "untrusted", "semi-trusted"] = "untrusted"
    context: Optional[Dict[str, Any]] = Field(default_factory=dict)
    call_model: bool = Field(default=False, description="Whether to call protected AI model if input is permitted")


class AnalysisResponse(BaseModel):
    event_id: str
    decision: Literal["ALLOW", "BLOCK", "SANITIZE", "ESCALATE"]
    risk_level: Literal["low", "medium", "high", "critical"]
    summary: str
    signals: List[SignalItem] = Field(default_factory=list)
    sanitized_text: Optional[str] = None
    analyzed_at: str
    detector_version: str
    policy_version: str
    model_response: Optional[str] = None
    output_security_check: Optional[str] = None  # "passed" | "blocked" | "not_applicable"
    execution_latency_ms: Optional[float] = None
    threat_categories: List[str] = Field(default_factory=list)
    rule_identifiers: List[str] = Field(default_factory=list)


class FileInspectionResponse(BaseModel):
    filename: str
    file_type: str
    size_bytes: int
    extracted_length: int
    extracted_excerpt: str
    analysis: AnalysisResponse
