import json
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.core.database import get_db_connection
from app.schemas.events import EventsListResponse, EventItem, EventDetail

router = APIRouter(prefix="/api/v1/events", tags=["Events"])


@router.get("", response_model=EventsListResponse)
def list_events(
    search: Optional[str] = Query(None, description="Search term in summary or excerpt"),
    decision: Optional[str] = Query(None, description="Filter by decision (ALLOW, BLOCK, SANITIZE, ESCALATE)"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level"),
    date_from: Optional[str] = Query(None, description="ISO-8601 start timestamp"),
    date_to: Optional[str] = Query(None, description="ISO-8601 end timestamp"),
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100)
):
    """Paginated list of auditable security events with filtering."""
    query = "SELECT * FROM events WHERE 1=1"
    count_query = "SELECT COUNT(*) as total FROM events WHERE 1=1"
    params = []

    if search:
        search_filter = " AND (summary LIKE ? OR redacted_excerpt LIKE ?)"
        query += search_filter
        count_query += search_filter
        params.extend([f"%{search}%", f"%{search}%"])

    if decision and decision.upper() != "ALL":
        decision_filter = " AND decision = ?"
        query += decision_filter
        count_query += decision_filter
        params.append(decision.upper())

    if risk_level and risk_level.lower() != "all":
        risk_filter = " AND risk_level = ?"
        query += risk_filter
        count_query += risk_filter
        params.append(risk_level.lower())

    if date_from:
        df_filter = " AND timestamp >= ?"
        query += df_filter
        count_query += df_filter
        params.append(date_from)

    if date_to:
        dt_filter = " AND timestamp <= ?"
        query += dt_filter
        count_query += dt_filter
        params.append(date_to)

    with get_db_connection() as conn:
        total = conn.execute(count_query, params).fetchone()["total"]

        offset = (page - 1) * page_size
        query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
        exec_params = list(params)
        exec_params.extend([page_size, offset])

        rows = conn.execute(query, exec_params).fetchall()

        items = []
        for r in rows:
            signals = json.loads(r["signals_json"]) if r["signals_json"] else []
            primary_rule = signals[0]["rule_id"] if signals else None
            items.append(
                EventItem(
                    id=r["id"],
                    timestamp=r["timestamp"],
                    source_type=r["source_type"],
                    trust_level=r["trust_level"],
                    decision=r["decision"],
                    risk_level=r["risk_level"],
                    summary=r["summary"],
                    signals_count=len(signals),
                    primary_rule=primary_rule,
                    redacted_excerpt=r["redacted_excerpt"],
                    is_attack=bool(r["is_attack"]),
                    is_demo=bool(r["is_demo"])
                )
            )

        total_pages = (total + page_size - 1) // page_size if total > 0 else 1

        return EventsListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )


@router.get("/{event_id}", response_model=EventDetail)
def get_event_detail(event_id: str):
    """Retrieve full permitted detail for one audit event."""
    with get_db_connection() as conn:
        row = conn.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

        signals = json.loads(row["signals_json"]) if row["signals_json"] else []
        return EventDetail(
            id=row["id"],
            timestamp=row["timestamp"],
            source_type=row["source_type"],
            trust_level=row["trust_level"],
            decision=row["decision"],
            risk_level=row["risk_level"],
            summary=row["summary"],
            signals=signals,
            redacted_excerpt=row["redacted_excerpt"],
            sanitized_text=row["sanitized_text"],
            detector_version=row["detector_version"],
            policy_version=row["policy_version"],
            is_attack=bool(row["is_attack"]),
            is_demo=bool(row["is_demo"])
        )
