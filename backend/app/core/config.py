from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    host: str = "127.0.0.1"
    port: int = 8000
    db_path: str = "promptshield.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    log_level: str = "INFO"
    max_text_length: int = 10000
    app_version: str = "1.0.0"
    detector_version: str = "rules-v1"

    model_config = SettingsConfigDict(
        env_prefix="PROMPTSHIELD_",
        env_file=".env",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
