from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.analysis import SignalItem


class EventItem(BaseModel):
    id: str
    timestamp: str
    source_type: str
    trust_level: str
    decision: Literal["ALLOW", "BLOCK", "SANITIZE", "ESCALATE"]
    risk_level: Literal["low", "medium", "high", "critical"]
    summary: str
    signals_count: int
    primary_rule: Optional[str] = None
    redacted_excerpt: str
    is_attack: bool
    is_demo: bool = False


class EventDetail(BaseModel):
    id: str
    timestamp: str
    source_type: str
    trust_level: str
    decision: Literal["ALLOW", "BLOCK", "SANITIZE", "ESCALATE"]
    risk_level: Literal["low", "medium", "high", "critical"]
    summary: str
    signals: List[SignalItem] = Field(default_factory=list)
    redacted_excerpt: str
    sanitized_text: Optional[str] = None
    detector_version: str
    policy_version: str
    is_attack: bool
    is_demo: bool = False


class EventsListResponse(BaseModel):
    items: List[EventItem]
    total: int
    page: int
    page_size: int
    total_pages: int
