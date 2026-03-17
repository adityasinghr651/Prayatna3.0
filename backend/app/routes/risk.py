import json
import logging
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

import redis as redis_client

from app.config import settings
from app.database import get_sync_db
from app.services.risk_engine import get_risk_engine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/risk", tags=["Risk"])
r = redis_client.from_url(settings.redis_url)


def get_db():
    """Sync DB dependency for risk routes."""
    from app.database import SyncSessionLocal
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/current")
def get_current_risk(
    zone_id: str = Query(default="indore-center"),
    force:   bool = Query(default=False),
    db = Depends(get_db),
):
    """
    Returns current risk assessment for a zone.
    Cached in Redis for 60 seconds unless force=True.

    Frontend usage:
        GET /api/risk/current
        GET /api/risk/current?zone_id=indore-center&force=true
    """
    engine = get_risk_engine()
    result = engine.compute_risk(db=db, zone_id=zone_id, force=force)
    return result


@router.get("/latest")
def get_latest_risk():
    """
    Returns latest risk from Redis cache instantly.
    No DB query — fastest possible response.
    Used by frontend for real-time polling fallback.
    """
    cached = r.get("risk:latest")
    if cached:
        return json.loads(cached)
    return {
        "zone_id":    "indore-center",
        "city":       settings.default_city,
        "risk_score": 0.0,
        "risk_level": "SAFE",
        "message":    "Awaiting first data collection. Workers may not be running.",
    }


@router.get("/history")
def get_risk_history(
    hours: int = Query(default=24, ge=1, le=168),
    db = Depends(get_db),
):
    """
    Returns risk score history for trend chart.
    Default: last 24 hours. Max: 7 days (168 hours).

    Frontend usage:
        GET /api/risk/history?hours=24
    """
    from sqlalchemy import text

    rows = db.execute(text("""
        SELECT
            zone_id,
            risk_score,
            risk_level,
            weather_score,
            traffic_score,
            crowd_score,
            camera_score,
            social_score,
            computed_at
        FROM risk_scores
        WHERE city        = :city
        AND   computed_at > NOW() - make_interval(hours => :hours)
        ORDER BY computed_at ASC
    """), {
        "city":  settings.default_city,
        "hours": hours,
    }).mappings().fetchall()

    history = [
        {
            **dict(r),
            "computed_at": str(r["computed_at"]),
        }
        for r in rows
    ]

    return {
        "city":    settings.default_city,
        "hours":   hours,
        "count":   len(history),
        "history": history,
    }


@router.get("/heatmap")
def get_heatmap_data(db = Depends(get_db)):
    """
    Returns zone risk data formatted for Deck.gl heatmap.

    Frontend usage:
        GET /api/risk/heatmap
    Response format matches HeatmapLayer data prop.
    """
    engine = get_risk_engine()
    zones  = engine.get_zone_heatmap_data(db)

    return {
        "city":  settings.default_city,
        "zones": zones,
        "count": len(zones),
    }


@router.get("/scores")
def get_all_scores(db = Depends(get_db)):
    """
    Returns latest score for every zone.
    Used by RiskPanel sidebar component.
    """
    from sqlalchemy import text

    rows = db.execute(text("""
        SELECT DISTINCT ON (zone_id)
            zone_id, city, lat, lon,
            risk_score, risk_level,
            weather_score, traffic_score,
            crowd_score, camera_score, social_score,
            computed_at
        FROM risk_scores
        WHERE city = :city
        ORDER BY zone_id, computed_at DESC
    """), {"city": settings.default_city}).mappings().fetchall()

    return {
        "city":   settings.default_city,
        "zones":  [dict(r) for r in rows],
        "count":  len(rows),
    }


@router.get("/explain/{zone_id}")
def get_risk_explanation(
    zone_id: str,
    db = Depends(get_db),
):
    """
    Returns detailed XAI explanation for a zone.
    Used by ExplainAI panel on the dashboard.

    Frontend usage:
        GET /api/risk/explain/indore-center
    """
    # Force fresh computation with full explanation
    engine  = get_risk_engine()
    result  = engine.compute_risk(db=db, zone_id=zone_id, force=True)

    return {
        "zone_id":              result.get("zone_id"),
        "risk_score":           result.get("risk_score"),
        "risk_level":           result.get("risk_level"),
        "explanation":          result.get("explanation"),
        "contributing_factors": result.get("contributing_factors"),
        "data_freshness":       result.get("data_freshness"),
        "computed_at":          result.get("computed_at"),
    }