import json
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from app.core.database import get_db_connection, DEFAULT_POLICY_CONFIG
from app.schemas.policies import PolicyConfig, PolicyUpdateRequest

router = APIRouter(prefix="/api/v1/policies", tags=["Policies"])


@router.get("", response_model=PolicyConfig)
def get_active_policy():
    """Retrieve active policy configuration and version."""
    with get_db_connection() as conn:
        row = conn.execute("SELECT config_json FROM policies WHERE id = 'active'").fetchone()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active policy not found")
        data = json.loads(row["config_json"])
        return data


@router.put("", response_model=PolicyConfig)
def update_policy(payload: PolicyUpdateRequest):
    """Validate and save policy changes."""
    with get_db_connection() as conn:
        row = conn.execute("SELECT version, config_json FROM policies WHERE id = 'active'").fetchone()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active policy not found")
        
        current = json.loads(row["config_json"])
        current_version = current.get("version", "1.0.0")

        # Bump minor version on update
        try:
            parts = current_version.split(".")
            parts[-1] = str(int(parts[-1]) + 1)
            new_version = ".".join(parts)
        except Exception:
            new_version = "1.0.1"

        if payload.sanitization_enabled is not None:
            current["sanitization_enabled"] = payload.sanitization_enabled
        if payload.ambiguous_escalation is not None:
            current["ambiguous_escalation"] = payload.ambiguous_escalation
        if payload.rules is not None:
            for rule_id, rule_conf in payload.rules.items():
                current["rules"][rule_id] = rule_conf.model_dump()
        if payload.severity_actions is not None:
            current["severity_actions"].update(payload.severity_actions)

        current["version"] = new_version
        current["updated_at"] = datetime.now(timezone.utc).isoformat()

        conn.execute(
            "UPDATE policies SET version = ?, updated_at = ?, config_json = ? WHERE id = 'active'",
            (new_version, current["updated_at"], json.dumps(current))
        )
        return current


@router.post("/reset", response_model=PolicyConfig)
def reset_policy():
    """Restore documented default policies."""
    now_iso = datetime.now(timezone.utc).isoformat()
    defaults = dict(DEFAULT_POLICY_CONFIG)
    defaults["updated_at"] = now_iso
    defaults["version"] = "1.0.0"

    with get_db_connection() as conn:
        conn.execute(
            "UPDATE policies SET version = ?, updated_at = ?, config_json = ? WHERE id = 'active'",
            ("1.0.0", now_iso, json.dumps(defaults))
        )
    return defaults
