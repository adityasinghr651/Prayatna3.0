import json
import uuid
import logging
from datetime import datetime, timezone
from sqlalchemy import text

from app.workers.celery_app import celery_app
from app.config import settings

logger = logging.getLogger(__name__)


@celery_app.task(
    name="app.workers.alert_dispatcher.check_and_dispatch_alerts",
    bind=True,
    max_retries=3,
    default_retry_delay=15,
)
def check_and_dispatch_alerts(self):
    """
    Reads latest risk score from Redis.
    If risk is HIGH or MEDIUM, creates an alert in DB
    and pushes it via Socket.IO to all connected clients.
    """
    import redis as redis_client

    logger.info("[Alerts] Checking risk thresholds...")

    try:
        r = redis_client.from_url(settings.redis_url)

        # ── Get latest risk from Redis ────────────────────────
        risk_raw = r.get("risk:latest")
        if not risk_raw:
            logger.info("[Alerts] No risk data yet — skipping.")
            return

        risk = json.loads(risk_raw)
        risk_score = risk.get("risk_score", 0.0)
        risk_level = risk.get("risk_level", "SAFE")

        # Only alert on MEDIUM or HIGH
        if risk_level == "SAFE":
            logger.info(f"[Alerts] Risk is SAFE ({risk_score}) — no alert.")
            return

        # ── Check if alert already exists in last 10 minutes ─
        from app.database import SyncSessionLocal
        db = SyncSessionLocal()

        recent = db.execute(text("""
            SELECT id FROM alerts
            WHERE zone_id   = :zone_id
            AND   severity  = :severity
            AND   is_active = TRUE
            AND   created_at > NOW() - INTERVAL '10 minutes'
            LIMIT 1
        """), {
            "zone_id":  risk.get("zone_id", "indore-center"),
            "severity": risk_level,
        }).fetchone()

        if recent:
            logger.info("[Alerts] Duplicate alert suppressed.")
            db.close()
            return

        # ── Build alert ───────────────────────────────────────
        factors   = risk.get("contributing_factors", {})
        alert_id  = str(uuid.uuid4())

        # Generate human-readable description
        reasons = []
        for source, data in factors.items():
            score = data.get("score", 0)
            if score > 0.3:
                reasons.append(
                    f"{source.replace('_', ' ').title()} "
                    f"risk elevated ({round(score * 100)}%)"
                )

        description = ". ".join(reasons) if reasons else "Multiple risk factors detected."

        title = (
            f"{'🔴 HIGH' if risk_level == 'HIGH' else '🟠 MEDIUM'} "
            f"Risk Alert — {risk.get('city', 'Indore')}"
        )

        # ── Save alert to DB ──────────────────────────────────
        db.execute(text("""
            INSERT INTO alerts (
                alert_id, city, zone_id, lat, lon,
                alert_type, severity, title, description,
                risk_score, risk_factors, is_active, created_at
            ) VALUES (
                :alert_id, :city, :zone_id, :lat, :lon,
                :alert_type, :severity, :title, :description,
                :risk_score, :risk_factors::jsonb, TRUE, :created_at
            )
        """), {
            "alert_id":    alert_id,
            "city":        risk.get("city", settings.default_city),
            "zone_id":     risk.get("zone_id", "indore-center"),
            "lat":         risk.get("lat", settings.default_lat),
            "lon":         risk.get("lon", settings.default_lon),
            "alert_type":  "RISK_THRESHOLD",
            "severity":    risk_level,
            "title":       title,
            "description": description,
            "risk_score":  risk_score,
            "risk_factors": json.dumps(factors),
            "created_at":  datetime.now(timezone.utc),
        })
        db.commit()
        db.close()

        # ── Push alert via Redis pub/sub to Socket.IO ─────────
        # FastAPI Socket.IO server listens on this channel
        alert_payload = {
            "alert_id":    alert_id,
            "title":       title,
            "description": description,
            "severity":    risk_level,
            "risk_score":  risk_score,
            "zone_id":     risk.get("zone_id"),
            "lat":         risk.get("lat"),
            "lon":         risk.get("lon"),
            "created_at":  datetime.now(timezone.utc).isoformat(),
        }

        r.publish("alerts:new", json.dumps(alert_payload))

        logger.info(
            f"[Alerts] Alert dispatched — "
            f"Level: {risk_level}, Score: {risk_score}"
        )

    except Exception as exc:
        logger.error(f"[Alerts] Dispatcher failed: {exc}")
        raise self.retry(exc=exc)