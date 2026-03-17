import logging
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from datetime import datetime, timezone

from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


def get_db():
    from app.database import SyncSessionLocal
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/active")
def get_active_alerts(
    limit:    int  = Query(default=20, ge=1, le=100),
    severity: str  = Query(default=None),
    db = Depends(get_db),
):
    """
    Returns all currently active alerts.
    Optional filter by severity: HIGH, MEDIUM.

    Frontend usage:
        GET /api/alerts/active
        GET /api/alerts/active?severity=HIGH
    """
    base_query = """
        SELECT
            alert_id, city, zone_id, lat, lon,
            alert_type, severity, title, description,
            risk_score, risk_factors,
            is_active, acknowledged,
            created_at, resolved_at
        FROM alerts
        WHERE is_active = TRUE
        AND city = :city
    """

    params: dict = {"city": settings.default_city, "limit": limit}

    if severity:
        base_query += " AND severity = :severity"
        params["severity"] = severity.upper()

    base_query += " ORDER BY created_at DESC LIMIT :limit"

    rows = db.execute(text(base_query), params).mappings().fetchall()

    alerts = [
        {
            **dict(r),
            "created_at":  str(r["created_at"]),
            "resolved_at": str(r["resolved_at"]) if r["resolved_at"] else None,
        }
        for r in rows
    ]

    return {
        "city":   settings.default_city,
        "count":  len(alerts),
        "alerts": alerts,
    }


@router.get("/history")
def get_alert_history(
    limit: int = Query(default=50, ge=1, le=200),
    hours: int = Query(default=24, ge=1, le=168),
    db = Depends(get_db),
):
    """
    Returns alert history including resolved ones.

    Frontend usage:
        GET /api/alerts/history?hours=24
    """
    rows = db.execute(text("""
        SELECT
            alert_id, city, zone_id, lat, lon,
            alert_type, severity, title, description,
            risk_score, is_active, acknowledged,
            created_at, resolved_at
        FROM alerts
        WHERE city = :city
        AND   created_at > NOW() - make_interval(hours => :hours)
        ORDER BY created_at DESC
        LIMIT :limit
    """), {
        "city":  settings.default_city,
        "hours": hours,
        "limit": limit,
    }).mappings().fetchall()

    alerts = [
        {
            **dict(r),
            "created_at":  str(r["created_at"]),
            "resolved_at": str(r["resolved_at"]) if r["resolved_at"] else None,
        }
        for r in rows
    ]

    return {
        "city":   settings.default_city,
        "hours":  hours,
        "count":  len(alerts),
        "alerts": alerts,
    }


@router.patch("/acknowledge/{alert_id}")
def acknowledge_alert(
    alert_id: str,
    db = Depends(get_db),
):
    """
    Mark an alert as acknowledged by an operator.

    Frontend usage:
        PATCH /api/alerts/acknowledge/some-uuid
    """
    result = db.execute(text("""
        UPDATE alerts
        SET acknowledged = TRUE
        WHERE alert_id = :alert_id
        RETURNING alert_id, acknowledged
    """), {"alert_id": alert_id})

    db.commit()
    updated = result.mappings().fetchone()

    if not updated:
        return {"error": "Alert not found", "alert_id": alert_id}

    return {
        "message":      "Alert acknowledged",
        "alert_id":     updated["alert_id"],
        "acknowledged": updated["acknowledged"],
    }


@router.patch("/resolve/{alert_id}")
def resolve_alert(
    alert_id: str,
    db = Depends(get_db),
):
    """
    Mark alert as resolved (inactive).

    Frontend usage:
        PATCH /api/alerts/resolve/some-uuid
    """
    result = db.execute(text("""
        UPDATE alerts
        SET
            is_active    = FALSE,
            resolved_at  = :resolved_at
        WHERE alert_id = :alert_id
        RETURNING alert_id, is_active, resolved_at
    """), {
        "alert_id":    alert_id,
        "resolved_at": datetime.now(timezone.utc),
    })

    db.commit()
    updated = result.mappings().fetchone()

    if not updated:
        return {"error": "Alert not found", "alert_id": alert_id}

    return {
        "message":     "Alert resolved",
        "alert_id":    updated["alert_id"],
        "is_active":   updated["is_active"],
        "resolved_at": str(updated["resolved_at"]),
    }


@router.get("/stats")
def get_alert_stats(db = Depends(get_db)):
    """
    Returns alert counts by severity for dashboard cards.

    Frontend usage:
        GET /api/alerts/stats
    """
    row = db.execute(text("""
        SELECT
            COUNT(*)                                  AS total,
            COUNT(*) FILTER (WHERE severity = 'HIGH'
                AND is_active = TRUE)                 AS active_high,
            COUNT(*) FILTER (WHERE severity = 'MEDIUM'
                AND is_active = TRUE)                 AS active_medium,
            COUNT(*) FILTER (WHERE is_active = TRUE)  AS total_active,
            COUNT(*) FILTER (
                WHERE created_at > NOW() - INTERVAL '1 hour'
            )                                         AS last_hour
        FROM alerts
        WHERE city = :city
    """), {"city": settings.default_city}).mappings().fetchone()

    return {
        "city":           settings.default_city,
        "total":          row["total"],
        "active_high":    row["active_high"],
        "active_medium":  row["active_medium"],
        "total_active":   row["total_active"],
        "last_hour":      row["last_hour"],
    }