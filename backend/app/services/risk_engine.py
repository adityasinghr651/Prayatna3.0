import json
import logging
from datetime import datetime, timezone
from typing import Optional

import redis as redis_client
from sqlalchemy import text

from app.config import settings
from app.ml.predict import get_predictor

logger = logging.getLogger(__name__)


class RiskEngine:
    """
    Central risk computation engine.
    Pulls latest data from DB + Redis,
    runs ML prediction,
    returns unified risk assessment.
    """

    def __init__(self):
        self.redis     = redis_client.from_url(settings.redis_url)
        self.predictor = get_predictor()

    # ─────────────────────────────────────────────────────────
    # DATA FETCHERS — pull latest from DB or Redis
    # ─────────────────────────────────────────────────────────

    def _get_latest_weather(self, db) -> dict:
        """Pull most recent weather row from DB."""
        try:
            row = db.execute(text("""
                SELECT * FROM weather_data
                WHERE city = :city
                ORDER BY recorded_at DESC
                LIMIT 1
            """), {"city": settings.default_city}).mappings().fetchone()
            return dict(row) if row else {}
        except Exception as e:
            logger.error(f"[RiskEngine] Weather fetch failed: {e}")
            return {}

    def _get_latest_traffic(self, db) -> dict:
        """Pull most recent traffic row from DB."""
        try:
            row = db.execute(text("""
                SELECT * FROM traffic_data
                WHERE city = :city
                ORDER BY recorded_at DESC
                LIMIT 1
            """), {"city": settings.default_city}).mappings().fetchone()
            return dict(row) if row else {}
        except Exception as e:
            logger.error(f"[RiskEngine] Traffic fetch failed: {e}")
            return {}

    def _get_todays_events(self, db) -> list:
        """Pull today's events from DB."""
        try:
            rows = db.execute(text("""
                SELECT * FROM events_data
                WHERE city = :city
                AND DATE(recorded_at) = CURRENT_DATE
                ORDER BY rank DESC
                LIMIT 10
            """), {"city": settings.default_city}).mappings().fetchall()
            return [dict(r) for r in rows]
        except Exception as e:
            logger.error(f"[RiskEngine] Events fetch failed: {e}")
            return []

    def _get_camera_data(self) -> dict:
        """Pull latest camera score from Redis."""
        try:
            raw = self.redis.get("camera:latest")
            return json.loads(raw) if raw else {}
        except Exception as e:
            logger.error(f"[RiskEngine] Camera Redis fetch failed: {e}")
            return {}

    def _get_social_data(self) -> dict:
        """Pull latest social signals from Redis."""
        try:
            raw = self.redis.get("social:latest")
            return json.loads(raw) if raw else {}
        except Exception as e:
            logger.error(f"[RiskEngine] Social Redis fetch failed: {e}")
            return {}

    # ─────────────────────────────────────────────────────────
    # MAIN COMPUTE METHOD
    # ─────────────────────────────────────────────────────────

    def compute_risk(
        self,
        db,
        zone_id: str = "indore-center",
        lat:     float = None,
        lon:     float = None,
        force:   bool  = False,
    ) -> dict:
        """
        Full risk computation pipeline.

        1. Check Redis cache (skip recompute if fresh)
        2. Pull all data sources
        3. Run ML prediction
        4. Save to DB
        5. Update Redis cache
        6. Return unified risk payload

        Args:
            db:      sync SQLAlchemy session
            zone_id: city zone identifier
            lat/lon: coordinates for zone
            force:   skip cache and recompute

        Returns:
            Complete risk assessment dict
        """
        lat = lat or settings.default_lat
        lon = lon or settings.default_lon

        # ── Check cache first ─────────────────────────────────
        if not force:
            cached = self.redis.get(f"risk:{zone_id}")
            if cached:
                logger.info(f"[RiskEngine] Returning cached risk for {zone_id}")
                return json.loads(cached)

        logger.info(f"[RiskEngine] Computing fresh risk for {zone_id}")

        # ── Pull all data ─────────────────────────────────────
        weather = self._get_latest_weather(db)
        traffic = self._get_latest_traffic(db)
        events  = self._get_todays_events(db)
        camera  = self._get_camera_data()
        social  = self._get_social_data()

        # ── Run ML prediction ─────────────────────────────────
        prediction = self.predictor.predict(
            weather = weather,
            traffic = traffic,
            camera  = camera,
            events  = events,
            social  = social,
        )

        risk_score = prediction["risk_score"]
        risk_level = prediction["risk_level"]
        explanation = prediction["explanation"]

        # ── Build contributing factors breakdown ──────────────
        from app.services.weather_service import compute_weather_risk_score
        from app.services.traffic_service import compute_traffic_risk_score
        from app.services.events_service  import compute_events_risk_score
        from app.services.social_service  import compute_social_risk_score

        weather_score = compute_weather_risk_score(weather)
        traffic_score = compute_traffic_risk_score(traffic)
        crowd_score   = compute_events_risk_score(events)
        camera_score  = camera.get("score", 0.0)
        social_score  = social.get("score", 0.0)

        contributing_factors = {
            "weather": {
                "score":   weather_score,
                "weight":  "25%",
                "details": {
                    "temperature":   weather.get("temperature"),
                    "rainfall_1h":   weather.get("rainfall_1h"),
                    "wind_speed":    weather.get("wind_speed"),
                    "visibility":    weather.get("visibility"),
                    "weather_desc":  weather.get("weather_desc"),
                },
            },
            "traffic": {
                "score":   traffic_score,
                "weight":  "30%",
                "details": {
                    "current_speed":    traffic.get("current_speed"),
                    "free_flow_speed":  traffic.get("free_flow_speed"),
                    "congestion_ratio": traffic.get("congestion_ratio"),
                    "incident_count":   traffic.get("incident_count"),
                    "road_closure":     traffic.get("road_closure"),
                },
            },
            "crowd_events": {
                "score":   crowd_score,
                "weight":  "20%",
                "details": {
                    "active_events":    len(events),
                    "top_event":        events[0].get("title") if events else None,
                    "max_attendance":   max(
                        (e.get("attendance", 0) or 0 for e in events),
                        default=0
                    ),
                },
            },
            "camera": {
                "score":   camera_score,
                "weight":  "15%",
                "details": camera.get("summary", {}),
            },
            "social": {
                "score":   social_score,
                "weight":  "10%",
                "details": social.get("summary", {}),
            },
        }

        # ── Save to risk_scores table ─────────────────────────
        try:
            db.execute(text("""
                INSERT INTO risk_scores (
                    zone_id, city, lat, lon,
                    risk_score, risk_level,
                    weather_score, traffic_score,
                    crowd_score, camera_score, social_score,
                    contributing_factors, model_version, computed_at
                ) VALUES (
                    :zone_id, :city, :lat, :lon,
                    :risk_score, :risk_level,
                    :weather_score, :traffic_score,
                    :crowd_score, :camera_score, :social_score,
                    :contributing_factors::jsonb,
                    :model_version, :computed_at
                )
            """), {
                "zone_id":              zone_id,
                "city":                 settings.default_city,
                "lat":                  lat,
                "lon":                  lon,
                "risk_score":           risk_score,
                "risk_level":           risk_level,
                "weather_score":        weather_score,
                "traffic_score":        traffic_score,
                "crowd_score":          crowd_score,
                "camera_score":         camera_score,
                "social_score":         social_score,
                "contributing_factors": json.dumps(contributing_factors),
                "model_version":        prediction.get("model_version", "1.0.0"),
                "computed_at":          datetime.now(timezone.utc),
            })
            db.commit()
        except Exception as e:
            logger.error(f"[RiskEngine] DB save failed: {e}")
            db.rollback()

        # ── Build full response payload ────────────────────────
        payload = {
            "zone_id":               zone_id,
            "city":                  settings.default_city,
            "lat":                   lat,
            "lon":                   lon,
            "risk_score":            risk_score,
            "risk_level":            risk_level,
            "contributing_factors":  contributing_factors,
            "explanation":           explanation,
            "model_version":         prediction.get("model_version"),
            "data_freshness": {
                "weather_at": str(weather.get("recorded_at", "N/A")),
                "traffic_at": str(traffic.get("recorded_at", "N/A")),
                "camera_at":  camera.get("updated_at", "N/A"),
                "social_at":  social.get("updated_at", "N/A"),
            },
            "computed_at": datetime.now(timezone.utc).isoformat(),
        }

        # ── Cache in Redis for 60 seconds ─────────────────────
        self.redis.setex(
            f"risk:{zone_id}",
            60,
            json.dumps(payload),
        )

        # ── Also update the generic latest key ────────────────
        self.redis.setex(
            "risk:latest",
            60,
            json.dumps(payload),
        )

        return payload

    def get_risk_history(self, db, hours: int = 24) -> list:
        """
        Returns risk score history for trend charts.
        Used by the Analytics page.
        """
        try:
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
                WHERE city = :city
                AND computed_at > NOW() - INTERVAL ':hours hours'
                ORDER BY computed_at ASC
            """), {
                "city":  settings.default_city,
                "hours": hours,
            }).mappings().fetchall()

            return [dict(r) for r in rows]
        except Exception as e:
            logger.error(f"[RiskEngine] History fetch failed: {e}")
            return []

    def get_zone_heatmap_data(self, db) -> list:
        """
        Returns latest risk score per zone
        formatted for Deck.gl heatmap layer.
        """
        try:
            rows = db.execute(text("""
                SELECT DISTINCT ON (zone_id)
                    zone_id, lat, lon,
                    risk_score, risk_level,
                    computed_at
                FROM risk_scores
                WHERE city = :city
                ORDER BY zone_id, computed_at DESC
            """), {"city": settings.default_city}).mappings().fetchall()

            return [
                {
                    "zone_id":    r["zone_id"],
                    "coordinates": [r["lon"], r["lat"]],
                    "weight":     float(r["risk_score"]),
                    "risk_level": r["risk_level"],
                }
                for r in rows
            ]
        except Exception as e:
            logger.error(f"[RiskEngine] Heatmap data fetch failed: {e}")
            return []


# ── Singleton instance ────────────────────────────────────────
_engine_instance: RiskEngine | None = None


def get_risk_engine() -> RiskEngine:
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = RiskEngine()
    return _engine_instance