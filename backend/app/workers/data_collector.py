import json
import logging
from datetime import datetime, timezone
from sqlalchemy import text

from app.workers.celery_app import celery_app
from app.config import settings

logger = logging.getLogger(__name__)


def get_sync_db_session():
    from app.database import SyncSessionLocal
    return SyncSessionLocal()


# ═══════════════════════════════════════════════════════════════
# TASK 1 — Collect Weather
# ═══════════════════════════════════════════════════════════════
@celery_app.task(
    name="app.workers.data_collector.collect_weather",
    bind=True,
    max_retries=3,
    default_retry_delay=30,
)
def collect_weather(self):
    import asyncio
    from app.services.weather_service import fetch_weather

    logger.info("[Worker] Collecting weather data...")

    try:
        weather = asyncio.run(fetch_weather())

        db = get_sync_db_session()
        try:
            raw_response_json = json.dumps(
                weather.get("raw_response", {})
            )

            query = text("""
                INSERT INTO weather_data (
                    city, lat, lon, temperature, feels_like,
                    humidity, pressure, wind_speed, wind_direction,
                    rainfall_1h, rainfall_3h, weather_main, weather_desc,
                    visibility, uv_index, raw_response, recorded_at
                ) VALUES (
                    :city, :lat, :lon, :temperature, :feels_like,
                    :humidity, :pressure, :wind_speed, :wind_direction,
                    :rainfall_1h, :rainfall_3h, :weather_main, :weather_desc,
                    :visibility, :uv_index, :raw_response::jsonb, :recorded_at
                )
            """)

            db.execute(query, {
                "city":           weather.get("city",          settings.default_city),
                "lat":            weather.get("lat",           settings.default_lat),
                "lon":            weather.get("lon",           settings.default_lon),
                "temperature":    weather.get("temperature",   0),
                "feels_like":     weather.get("feels_like",    0),
                "humidity":       weather.get("humidity",      0),
                "pressure":       weather.get("pressure",      0),
                "wind_speed":     weather.get("wind_speed",    0),
                "wind_direction": weather.get("wind_direction",0),
                "rainfall_1h":    weather.get("rainfall_1h",  0),
                "rainfall_3h":    weather.get("rainfall_3h",  0),
                "weather_main":   weather.get("weather_main", ""),
                "weather_desc":   weather.get("weather_desc", ""),
                "visibility":     weather.get("visibility",   0),
                "uv_index":       weather.get("uv_index",     0),
                "raw_response":   raw_response_json,
                "recorded_at":    weather.get("recorded_at",  datetime.now(timezone.utc)),
            })
            db.commit()
            logger.info(
                f"[Worker] Weather saved — "
                f"Temp: {weather.get('temperature')}°C, "
                f"Rain: {weather.get('rainfall_1h')}mm"
            )
        finally:
            db.close()

    except Exception as exc:
        logger.error(f"[Worker] Weather collection failed: {exc}")
        raise self.retry(exc=exc)


# ═══════════════════════════════════════════════════════════════
# TASK 2 — Collect Traffic
# ═══════════════════════════════════════════════════════════════
@celery_app.task(
    name="app.workers.data_collector.collect_traffic",
    bind=True,
    max_retries=3,
    default_retry_delay=30,
)
def collect_traffic(self):
    import asyncio
    from app.services.traffic_service import fetch_full_traffic

    logger.info("[Worker] Collecting traffic data...")

    try:
        traffic = asyncio.run(fetch_full_traffic())

        db = get_sync_db_session()
        try:
            incident_types_json = json.dumps(
                traffic.get("incident_types", {})
            )
            raw_response_json = json.dumps(
                traffic.get("raw_response", {})
            )

            query = text("""
                INSERT INTO traffic_data (
                    city, lat, lon, current_speed, free_flow_speed,
                    congestion_ratio, incident_count, incident_types,
                    road_closure, confidence, raw_response, recorded_at
                ) VALUES (
                    :city, :lat, :lon, :current_speed, :free_flow_speed,
                    :congestion_ratio, :incident_count, :incident_types::jsonb,
                    :road_closure, :confidence, :raw_response::jsonb, :recorded_at
                )
            """)

            db.execute(query, {
                "city":             traffic.get("city",             settings.default_city),
                "lat":              traffic.get("lat",              settings.default_lat),
                "lon":              traffic.get("lon",              settings.default_lon),
                "current_speed":    traffic.get("current_speed",    0),
                "free_flow_speed":  traffic.get("free_flow_speed",  0),
                "congestion_ratio": traffic.get("congestion_ratio", 1.0),
                "incident_count":   traffic.get("incident_count",   0),
                "incident_types":   incident_types_json,
                "road_closure":     traffic.get("road_closure",     False),
                "confidence":       traffic.get("confidence",       0),
                "raw_response":     raw_response_json,
                "recorded_at":      traffic.get("recorded_at",     datetime.now(timezone.utc)),
            })
            db.commit()
            logger.info(
                f"[Worker] Traffic saved — "
                f"Speed: {traffic.get('current_speed')}km/h, "
                f"Incidents: {traffic.get('incident_count')}"
            )
        finally:
            db.close()

    except Exception as exc:
        logger.error(f"[Worker] Traffic collection failed: {exc}")
        raise self.retry(exc=exc)


# ═══════════════════════════════════════════════════════════════
# TASK 3 — Collect Events
# ═══════════════════════════════════════════════════════════════
@celery_app.task(
    name="app.workers.data_collector.collect_events",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def collect_events(self):
    import asyncio
    from app.services.events_service import fetch_events_predicthq

    logger.info("[Worker] Collecting events data...")

    try:
        events = asyncio.run(fetch_events_predicthq())

        if not events:
            logger.info("[Worker] No events found for today.")
            return

        db = get_sync_db_session()
        try:
            query = text("""
                INSERT INTO events_data (
                    event_id, city, lat, lon, title, category,
                    rank, attendance, start_time, end_time,
                    raw_response, recorded_at
                ) VALUES (
                    :event_id, :city, :lat, :lon, :title, :category,
                    :rank, :attendance, :start_time, :end_time,
                    :raw_response::jsonb, :recorded_at
                )
                ON CONFLICT (event_id) DO NOTHING
            """)

            for event in events:
                db.execute(query, {
                    "event_id":    event.get("event_id",   ""),
                    "city":        event.get("city",       settings.default_city),
                    "lat":         event.get("lat",        settings.default_lat),
                    "lon":         event.get("lon",        settings.default_lon),
                    "title":       event.get("title",      ""),
                    "category":    event.get("category",   ""),
                    "rank":        event.get("rank",       0),
                    "attendance":  event.get("attendance", 0),
                    "start_time":  event.get("start_time", None),
                    "end_time":    event.get("end_time",   None),
                    "raw_response":json.dumps(event.get("raw_response", {})),
                    "recorded_at": event.get("recorded_at", datetime.now(timezone.utc)),
                })

            db.commit()
            logger.info(f"[Worker] Events saved — Count: {len(events)}")
        finally:
            db.close()

    except Exception as exc:
        logger.error(f"[Worker] Events collection failed: {exc}")
        raise self.retry(exc=exc)


# ═══════════════════════════════════════════════════════════════
# TASK 4 — Collect Social Signals
# ═══════════════════════════════════════════════════════════════
@celery_app.task(
    name="app.workers.data_collector.collect_social",
    bind=True,
    max_retries=3,
    default_retry_delay=30,
)
def collect_social(self):
    import asyncio
    import redis as redis_client
    from app.services.social_service import (
        fetch_social_signals,
        compute_social_risk_score,
        extract_social_summary,
    )

    logger.info("[Worker] Collecting social signals...")

    try:
        posts   = asyncio.run(fetch_social_signals())
        score   = compute_social_risk_score(posts)
        summary = extract_social_summary(posts)

        r = redis_client.from_url(settings.redis_url)
        r.setex(
            "social:latest",
            300,
            json.dumps({
                "score":      score,
                "summary":    summary,
                "posts":      posts[:10],
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }),
        )
        logger.info(
            f"[Worker] Social saved — "
            f"Posts: {len(posts)}, Score: {score}"
        )

    except Exception as exc:
        logger.error(f"[Worker] Social collection failed: {exc}")
        raise self.retry(exc=exc)


# ═══════════════════════════════════════════════════════════════
# TASK 5 — Compute and Store Risk Score
# ═══════════════════════════════════════════════════════════════
@celery_app.task(
    name="app.workers.data_collector.compute_and_store_risk",
    bind=True,
    max_retries=3,
    default_retry_delay=15,
)
def compute_and_store_risk(self):
    import redis as redis_client
    from app.services.weather_service import compute_weather_risk_score
    from app.services.traffic_service import compute_traffic_risk_score
    from app.services.events_service  import compute_events_risk_score
    from app.services.social_service  import compute_social_risk_score

    logger.info("[Worker] Computing risk score...")

    try:
        db = get_sync_db_session()
        r  = redis_client.from_url(settings.redis_url)

        # ── Pull latest weather ───────────────────────────────
        weather_row = db.execute(text("""
            SELECT * FROM weather_data
            WHERE city = :city
            ORDER BY recorded_at DESC LIMIT 1
        """), {"city": settings.default_city}).mappings().fetchone()
        weather = dict(weather_row) if weather_row else {}

        # ── Pull latest traffic ───────────────────────────────
        traffic_row = db.execute(text("""
            SELECT * FROM traffic_data
            WHERE city = :city
            ORDER BY recorded_at DESC LIMIT 1
        """), {"city": settings.default_city}).mappings().fetchone()
        traffic = dict(traffic_row) if traffic_row else {}

        # ── Pull today's events ───────────────────────────────
        events_rows = db.execute(text("""
            SELECT * FROM events_data
            WHERE city = :city
            AND DATE(start_time) = CURRENT_DATE
        """), {"city": settings.default_city}).mappings().fetchall()
        events = [dict(row) for row in events_rows]

        # ── Pull social from Redis ────────────────────────────
        social_raw  = r.get("social:latest")
        social_data = json.loads(social_raw) if social_raw else {}
        social_score = social_data.get("score", 0.0)

        # ── Pull camera from Redis ────────────────────────────
        camera_raw  = r.get("camera:latest")
        camera_data = json.loads(camera_raw) if camera_raw else {}
        camera_score = camera_data.get("score", 0.0)

        # ── Compute individual scores ─────────────────────────
        weather_score = compute_weather_risk_score(weather)
        traffic_score = compute_traffic_risk_score(traffic)
        crowd_score   = compute_events_risk_score(events)

        # ── Weighted final risk score ─────────────────────────
        final_score = round(
            (weather_score * 0.25) +
            (traffic_score * 0.30) +
            (crowd_score   * 0.20) +
            (camera_score  * 0.15) +
            (social_score  * 0.10),
            3
        )

        # ── Risk level ────────────────────────────────────────
        if final_score >= settings.high_risk_threshold:
            risk_level = "HIGH"
        elif final_score >= settings.medium_risk_threshold:
            risk_level = "MEDIUM"
        else:
            risk_level = "SAFE"

        # ── Contributing factors ──────────────────────────────
        contributing_factors = {
            "weather": {
                "score":   weather_score,
                "weight":  "25%",
                "details": {
                    "temperature": weather.get("temperature"),
                    "rainfall":    weather.get("rainfall_1h"),
                    "visibility":  weather.get("visibility"),
                    "weather_desc":weather.get("weather_desc"),
                },
            },
            "traffic": {
                "score":   traffic_score,
                "weight":  "30%",
                "details": {
                    "current_speed":    traffic.get("current_speed"),
                    "congestion_ratio": traffic.get("congestion_ratio"),
                    "incidents":        traffic.get("incident_count"),
                },
            },
            "crowd_events": {
                "score":   crowd_score,
                "weight":  "20%",
                "details": {"active_events": len(events)},
            },
            "camera": {
                "score":   camera_score,
                "weight":  "15%",
                "details": camera_data.get("summary", {}),
            },
            "social": {
                "score":   social_score,
                "weight":  "10%",
                "details": social_data.get("summary", {}),
            },
        }

        # ── Save to DB ────────────────────────────────────────
        contributing_factors_json = json.dumps(contributing_factors)

        db.execute(text("""
            INSERT INTO risk_scores (
                zone_id, city, lat, lon,
                risk_score, risk_level,
                weather_score, traffic_score,
                crowd_score, camera_score, social_score,
                contributing_factors, computed_at
            ) VALUES (
                :zone_id, :city, :lat, :lon,
                :risk_score, :risk_level,
                :weather_score, :traffic_score,
                :crowd_score, :camera_score, :social_score,
                :contributing_factors::jsonb, :computed_at
            )
        """), {
            "zone_id":              "indore-center",
            "city":                 settings.default_city,
            "lat":                  settings.default_lat,
            "lon":                  settings.default_lon,
            "risk_score":           final_score,
            "risk_level":           risk_level,
            "weather_score":        weather_score,
            "traffic_score":        traffic_score,
            "crowd_score":          crowd_score,
            "camera_score":         camera_score,
            "social_score":         social_score,
            "contributing_factors": contributing_factors_json,
            "computed_at":          datetime.now(timezone.utc),
        })
        db.commit()
        db.close()

        # ── Cache in Redis ────────────────────────────────────
        risk_payload = {
            "zone_id":              "indore-center",
            "city":                 settings.default_city,
            "lat":                  settings.default_lat,
            "lon":                  settings.default_lon,
            "risk_score":           final_score,
            "risk_level":           risk_level,
            "contributing_factors": contributing_factors,
            "updated_at":           datetime.now(timezone.utc).isoformat(),
        }
        r.setex("risk:latest", 120, json.dumps(risk_payload))

        logger.info(
            f"[Worker] Risk computed — "
            f"Score: {final_score}, Level: {risk_level}"
        )

        return risk_payload

    except Exception as exc:
        logger.error(f"[Worker] Risk computation failed: {exc}")
        raise self.retry(exc=exc)