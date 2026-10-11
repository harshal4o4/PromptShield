from typing import List
from pydantic import BaseModel
from app.schemas.events import EventItem


class OverviewKPIs(BaseModel):
    prompts_analyzed: int
    attacks_detected: int
    requests_blocked: int
    sanitized_count: int
    escalated_count: int
    attack_rate_pct: float
    block_rate_pct: float


class ActivityPoint(BaseModel):
    label: str
    total: int
    attacks: int
    blocked: int


class OverviewResponse(BaseModel):
    kpis: OverviewKPIs
    activity: List[ActivityPoint]
    recent_events: List[EventItem]
