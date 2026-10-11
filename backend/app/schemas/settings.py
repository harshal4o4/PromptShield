from typing import Literal, Optional
from pydantic import BaseModel


class AppSettings(BaseModel):
    retention_mode: Literal["redacted_excerpt", "hash_only", "full_text_local_only"] = "redacted_excerpt"
    telemetry_enabled: bool = True
    alert_threshold: Literal["low", "medium", "high", "critical"] = "high"
    max_text_length: int = 10000


class AppSettingsUpdate(BaseModel):
    retention_mode: Optional[Literal["redacted_excerpt", "hash_only", "full_text_local_only"]] = None
    telemetry_enabled: Optional[bool] = None
    alert_threshold: Optional[Literal["low", "medium", "high", "critical"]] = None
