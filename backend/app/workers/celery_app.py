from celery import Celery
from celery.schedules import crontab
from app.config import settings

# ── Create Celery app ─────────────────────────────────────────
celery_app = Celery(
    "urbanrisk",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=[
        "app.workers.data_collector",
        "app.workers.alert_dispatcher",
    ],
)

# ── Celery configuration ──────────────────────────────────────
celery_app.conf.update(
    # Serialization
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],

    # Timezone
    timezone="Asia/Kolkata",
    enable_utc=True,

    # Task behavior
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,

    # Result expiry — keep results for 1 hour
    result_expires=3600,

    # Retry policy
    task_max_retries=3,
    task_default_retry_delay=30,
)

# ── Periodic task schedule (Beat scheduler) ───────────────────
celery_app.conf.beat_schedule = {

    # Weather — every 2 minutes (stays under 1000/day free limit)
    "collect-weather": {
        "task": "app.workers.data_collector.collect_weather",
        "schedule": 120.0,  # seconds
    },

    # Traffic — every 90 seconds
    "collect-traffic": {
        "task": "app.workers.data_collector.collect_traffic",
        "schedule": 90.0,
    },

    # Events — every 10 minutes (events don't change fast)
    "collect-events": {
        "task": "app.workers.data_collector.collect_events",
        "schedule": 600.0,
    },

    # Social signals — every 3 minutes
    "collect-social": {
        "task": "app.workers.data_collector.collect_social",
        "schedule": 180.0,
    },

    # Risk engine — every 60 seconds (combines all latest data)
    "compute-risk": {
        "task": "app.workers.data_collector.compute_and_store_risk",
        "schedule": 60.0,
    },

    # Alert checker — every 30 seconds
    "check-alerts": {
        "task": "app.workers.alert_dispatcher.check_and_dispatch_alerts",
        "schedule": 30.0,
    },
}