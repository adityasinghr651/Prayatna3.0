import logging
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text

from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/data", tags=["Data"])


def get_db():
    from app.database import SyncSessionLocal
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/weather")
def get_weather(
    limit: int = Query(default=1, ge=1, le=100),
    db = Depends(get_db),
):
    """
    Returns latest weather readings.
    Default: latest 1 record.

    Frontend usage:
        GET /api/data/weather
        GET /api/data/weather?limit=24   (last 24 readings)
    """
    rows = db.execute(text("""
        SELECT
            city, lat, lon,
            temperature, feels_like, humidity, pressure,
            wind_speed, wind_direction,
            rainfall_1h, rainfall_3h,
            weather_main, weather_desc,
            visibility, uv_index,
            recorded_at
        FROM weather_data
        WHERE city = :city
        ORDER BY recorded_at DESC
        LIMIT :limit
    """), {
        "city":  settings.default_city,
        "limit": limit,
    }).mappings().fetchall()

    data = [
        {**dict(r), "recorded_at": str(r["recorded_at"])}
        for r in rows
    ]

    return {
        "city":    settings.default_city,
        "count":   len(data),
        "weather": data,
    }


@router.get("/traffic")
def get_traffic(
    limit: int = Query(default=1, ge=1, le=100),
    db = Depends(get_db),
):
    """
    Returns latest traffic readings.

    Frontend usage:
        GET /api/data/traffic
        GET /api/data/traffic?limit=48
    """
    rows = db.execute(text("""
        SELECT
            city, lat, lon,
            current_speed, free_flow_speed,
            congestion_ratio, incident_count,
            incident_types, road_closure,
            confidence, recorded_at
        FROM traffic_data
        WHERE city = :city
        ORDER BY recorded_at DESC
        LIMIT :limit
    """), {
        "city":  settings.default_city,
        "limit": limit,
    }).mappings().fetchall()

    data = [
        {**dict(r), "recorded_at": str(r["recorded_at"])}
        for r in rows
    ]

    return {
        "city":    settings.default_city,
        "count":   len(data),
        "traffic": data,
    }


@router.get("/events")
def get_events(
    active_only: bool = Query(default=True),
    db = Depends(get_db),
):
    """
    Returns crowd events for today.

    Frontend usage:
        GET /api/data/events
    """
    query = """
        SELECT
            event_id, city, lat, lon,
            title, category, rank,
            attendance, start_time, end_time,
            recorded_at
        FROM events_data
        WHERE city = :city
        AND DATE(recorded_at) = CURRENT_DATE
        ORDER BY rank DESC
        LIMIT 20
    """

    rows = db.execute(
        text(query),
        {"city": settings.default_city}
    ).mappings().fetchall()

    data = [
        {
            **dict(r),
            "start_time":  str(r["start_time"]),
            "end_time":    str(r["end_time"]),
            "recorded_at": str(r["recorded_at"]),
        }
        for r in rows
    ]

    return {
        "city":   settings.default_city,
        "count":  len(data),
        "events": data,
    }


@router.get("/social")
def get_social():
    """
    Returns latest social signal data from Redis.

    Frontend usage:
        GET /api/data/social
    """
    import json
    import redis as redis_client

    r = redis_client.from_url(settings.redis_url)

    raw = r.get("social:latest")
    if not raw:
        return {
            "score":       0.0,
            "total_posts": 0,
            "summary":     {},
            "posts":       [],
            "message":     "No social data yet.",
        }

    data = json.loads(raw)
    return {
        "score":       data.get("score", 0.0),
        "total_posts": data.get("summary", {}).get("total_posts", 0),
        "top_keywords": data.get("summary", {}).get("top_keywords", []),
        "sample_texts": data.get("summary", {}).get("sample_texts", []),
        "posts":        data.get("posts", [])[:5],
        "updated_at":   data.get("updated_at"),
    }


@router.get("/analytics/traffic-weather")
def get_traffic_weather_correlation(
    hours: int = Query(default=24, ge=1, le=168),
    db = Depends(get_db),
):
    """
    Returns correlated traffic + weather data for
    the Analytics page scatter/line chart.

    Frontend usage:
        GET /api/data/analytics/traffic-weather?hours=24
    """
    rows = db.execute(text("""
        SELECT
            w.recorded_at        AS time,
            w.rainfall_1h,
            w.temperature,
            w.humidity,
            t.congestion_ratio,
            t.incident_count,
            t.current_speed
        FROM weather_data w
        JOIN traffic_data t
            ON DATE_TRUNC('hour', w.recorded_at)
             = DATE_TRUNC('hour', t.recorded_at)
        WHERE w.city = :city
        AND   w.recorded_at > NOW() - make_interval(hours => :hours)
        ORDER BY w.recorded_at ASC
        LIMIT 200
    """), {
        "city":  settings.default_city,
        "hours": hours,
    }).mappings().fetchall()

    data = [
        {
            "time":             str(r["time"]),
            "rainfall_1h":      float(r["rainfall_1h"] or 0),
            "temperature":      float(r["temperature"] or 0),
            "humidity":         int(r["humidity"] or 0),
            "congestion_ratio": float(r["congestion_ratio"] or 1),
            "incident_count":   int(r["incident_count"] or 0),
            "current_speed":    float(r["current_speed"] or 0),
        }
        for r in rows
    ]

    return {
        "city":  settings.default_city,
        "hours": hours,
        "count": len(data),
        "data":  data,
    }