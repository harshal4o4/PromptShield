from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    host: str = "127.0.0.1"
    port: int = 8000
    db_path: str = "promptshield.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    log_level: str = "INFO"
    max_text_length: int = 100000
    app_version: str = "1.0.0"
    detector_version: str = "promptshield-engine-v2"

    # AI & Detection Engine Configuration
    groq_api_key: Optional[str] = None
    groq_prompt_guard_model: str = "llama-guard-3-8b"
    groq_ai_model: str = "llama-3.3-70b-versatile"
    classifier_provider: str = "auto"  # "groq", "local", "auto"
    classifier_failure_policy: str = "fallback_heuristics"  # "fail_closed", "fallback_heuristics", "escalate"
    classifier_timeout_seconds: float = 3.0

    # Protected Model & Execution Configuration
    protected_model_provider: str = "auto"  # "groq", "simulated", "auto"
    max_file_size_mb: int = 5

    # Canary / Synthetic Secrets (comma-separated)
    canary_secrets: str = "PS_DEMO_SECRET_7F3A,PS_CANARY_ROOT_9921,PS_ENTERPRISE_KEY_X882"

    # Admin Authorization for Policy Modification
    admin_api_key: str = "promptshield-secops-admin-key"

    model_config = SettingsConfigDict(
        env_prefix="PROMPTSHIELD_",
        env_file=".env",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def canary_secrets_list(self) -> List[str]:
        return [sec.strip() for sec in self.canary_secrets.split(",") if sec.strip()]


settings = Settings()
