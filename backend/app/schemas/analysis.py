from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field


class SignalItem(BaseModel):
    rule_id: str
    label: str
    severity: Literal["low", "medium", "high", "critical"]
    evidence: str


class AnalysisRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000, description="Untrusted text to inspect")
    source_type: Literal["user", "document", "web", "tool"] = "user"
    trust_level: Literal["trusted", "untrusted", "semi-trusted"] = "untrusted"
    context: Optional[Dict[str, Any]] = Field(default_factory=dict)


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
