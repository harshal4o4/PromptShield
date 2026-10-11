import json
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter
from app.core.database import get_db_connection
from app.schemas.overview import OverviewResponse, OverviewKPIs, ActivityPoint
from app.schemas.events import EventItem

router = APIRouter(prefix="/api/v1/overview", tags=["Overview"])


@router.get("", response_model=OverviewResponse)
def get_overview_data():
    """Real KPI counts, activity series, and recent events derived from persisted records."""
    with get_db_connection() as conn:
        total_prompts = conn.execute("SELECT COUNT(*) as count FROM events").fetchone()["count"]
        attacks = conn.execute("SELECT COUNT(*) as count FROM events WHERE is_attack = 1").fetchone()["count"]
        blocked = conn.execute("SELECT COUNT(*) as count FROM events WHERE decision = 'BLOCK'").fetchone()["count"]
        sanitized = conn.execute("SELECT COUNT(*) as count FROM events WHERE decision = 'SANITIZE'").fetchone()["count"]
        escalated = conn.execute("SELECT COUNT(*) as count FROM events WHERE decision = 'ESCALATE'").fetchone()["count"]

        attack_rate = round((attacks / total_prompts * 100), 2) if total_prompts > 0 else 0.0
        block_rate = round((blocked / total_prompts * 100), 2) if total_prompts > 0 else 0.0

        kpis = OverviewKPIs(
            prompts_analyzed=total_prompts,
            attacks_detected=attacks,
            requests_blocked=blocked,
            sanitized_count=sanitized,
            escalated_count=escalated,
            attack_rate_pct=attack_rate,
            block_rate_pct=block_rate
        )

        # Build 7-day activity timeline from actual events
        now = datetime.now(timezone.utc)
        activity = []
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            day_str = day.strftime("%Y-%m-%d")
            label = day.strftime("%b %d")

            day_total = conn.execute(
                "SELECT COUNT(*) as c FROM events WHERE date(timestamp) = ?", (day_str,)
            ).fetchone()["c"]
            day_attacks = conn.execute(
                "SELECT COUNT(*) as c FROM events WHERE date(timestamp) = ? AND is_attack = 1", (day_str,)
            ).fetchone()["c"]
            day_blocked = conn.execute(
                "SELECT COUNT(*) as c FROM events WHERE date(timestamp) = ? AND decision = 'BLOCK'", (day_str,)
            ).fetchone()["c"]

            activity.append(
                ActivityPoint(
                    label=label,
                    total=day_total,
                    attacks=day_attacks,
                    blocked=day_blocked
                )
            )

        # Recent 5 events
        recent_rows = conn.execute(
            "SELECT * FROM events ORDER BY timestamp DESC LIMIT 5"
        ).fetchall()

        recent_events = []
        for r in recent_rows:
            signals = json.loads(r["signals_json"]) if r["signals_json"] else []
            recent_events.append(
                EventItem(
                    id=r["id"],
                    timestamp=r["timestamp"],
                    source_type=r["source_type"],
                    trust_level=r["trust_level"],
                    decision=r["decision"],
                    risk_level=r["risk_level"],
                    summary=r["summary"],
                    signals_count=len(signals),
                    primary_rule=signals[0]["rule_id"] if signals else None,
                    redacted_excerpt=r["redacted_excerpt"],
                    is_attack=bool(r["is_attack"]),
                    is_demo=bool(r["is_demo"])
                )
            )

        return OverviewResponse(
            kpis=kpis,
            activity=activity,
            recent_events=recent_events
        )
