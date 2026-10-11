from fastapi import APIRouter, HTTPException, status
from app.core.config import settings
from app.core.database import get_db_connection

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check():
    """Liveness & readiness health check. Discloses no secrets or local filesystem paths."""
    db_status = "connected"
    try:
        with get_db_connection() as conn:
            conn.execute("SELECT 1;").fetchone()
    except Exception:
        db_status = "unavailable"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"status": "degraded", "database": "unavailable"}
        )

    return {
        "status": "ok",
        "app": "PromptShield",
        "version": settings.app_version,
        "database": db_status
    }
