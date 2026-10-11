import json
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from app.core.database import get_db_connection, DEFAULT_SETTINGS
from app.schemas.settings import AppSettings, AppSettingsUpdate

router = APIRouter(prefix="/api/v1/settings", tags=["Settings"])


@router.get("", response_model=AppSettings)
def get_settings():
    """Read supported application settings."""
    with get_db_connection() as conn:
        row = conn.execute("SELECT settings_json FROM app_settings WHERE id = 'global'").fetchone()
        if not row:
            return DEFAULT_SETTINGS
        return json.loads(row["settings_json"])


@router.put("", response_model=AppSettings)
def update_settings(payload: AppSettingsUpdate):
    """Save supported application settings."""
    with get_db_connection() as conn:
        row = conn.execute("SELECT settings_json FROM app_settings WHERE id = 'global'").fetchone()
        current = json.loads(row["settings_json"]) if row else dict(DEFAULT_SETTINGS)

        if payload.retention_mode is not None:
            current["retention_mode"] = payload.retention_mode
        if payload.telemetry_enabled is not None:
            current["telemetry_enabled"] = payload.telemetry_enabled
        if payload.alert_threshold is not None:
            current["alert_threshold"] = payload.alert_threshold

        now_iso = datetime.now(timezone.utc).isoformat()
        conn.execute(
            "UPDATE app_settings SET updated_at = ?, settings_json = ? WHERE id = 'global'",
            (now_iso, json.dumps(current))
        )
        return current
