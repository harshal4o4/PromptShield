from typing import Dict, Literal, Optional
from pydantic import BaseModel, Field


class RuleConfig(BaseModel):
    name: str
    enabled: bool
    severity: Literal["low", "medium", "high", "critical"]
    action: Literal["ALLOW", "BLOCK", "SANITIZE", "ESCALATE"]
    description: str


class PolicyConfig(BaseModel):
    version: str
    updated_at: str
    sanitization_enabled: bool = True
    ambiguous_escalation: bool = True
    rules: Dict[str, RuleConfig]
    severity_actions: Dict[str, Literal["ALLOW", "BLOCK", "SANITIZE", "ESCALATE"]]


class PolicyUpdateRequest(BaseModel):
    sanitization_enabled: Optional[bool] = None
    ambiguous_escalation: Optional[bool] = None
    rules: Optional[Dict[str, RuleConfig]] = None
    severity_actions: Optional[Dict[str, Literal["ALLOW", "BLOCK", "SANITIZE", "ESCALATE"]]] = None
