import numpy as np
import pandas as pd
from datetime import datetime, timezone
from typing import Optional


# ── Feature column order ──────────────────────────────────────
# This order MUST match exactly between training and inference
FEATURE_COLUMNS = [
    "temperature",
    "rainfall_1h",
    "wind_speed",
    "visibility_norm",      # normalized to 0-1
    "humidity",
    "congestion_ratio",
    "incident_count_norm",  # normalized
    "road_closure",
    "person_count_norm",    # normalized
    "vehicle_count_norm",   # normalized
    "crowd_density",
    "event_attendance_norm",# normalized
    "event_rank_norm",      # normalized
    "social_signal_norm",   # normalized
    "hour_sin",             # cyclical encoding of hour
    "hour_cos",             # cyclical encoding of hour
    "is_weekend",
    "is_peak_hour",         # 8-10am, 5-8pm
    "is_night",             # 10pm - 6am
]


def encode_hour_cyclical(hour: int) -> tuple[float, float]:
    """
    Encode hour as sine/cosine so model understands
    that hour 23 and hour 0 are close together.
    """
    angle = 2 * np.pi * hour / 24
    return np.sin(angle), np.cos(angle)


def normalize_visibility(visibility_meters: float) -> float:
    """
    Normalize visibility from meters to 0-1.
    10000m (clear) = 1.0, 0m = 0.0
    Inverted: low visibility = high risk = high value
    """
    vis = max(0, min(visibility_meters or 10000, 10000))
    return round(1.0 - (vis / 10000), 4)


def extract_features(
    weather:  dict,
    traffic:  dict,
    camera:   dict,
    events:   list,
    social:   dict,
    dt:       Optional[datetime] = None,
) -> pd.DataFrame:
    """
    Combine all data sources into a single feature vector.

    Args:
        weather:  dict from weather_data table
        traffic:  dict from traffic_data table
        camera:   dict from Redis camera:latest
        events:   list of dicts from events_data table
        social:   dict from Redis social:latest
        dt:       datetime for time features (defaults to now)

    Returns:
        pd.DataFrame with one row and FEATURE_COLUMNS columns
    """
    dt = dt or datetime.now(timezone.utc)
    hour       = dt.hour
    weekday    = dt.weekday()   # 0=Monday, 6=Sunday

    hour_sin, hour_cos = encode_hour_cyclical(hour)

    # ── Weather features ──────────────────────────────────────
    temperature  = float(weather.get("temperature",  25.0)  or 25.0)
    rainfall_1h  = float(weather.get("rainfall_1h",   0.0)  or 0.0)
    wind_speed   = float(weather.get("wind_speed",    0.0)  or 0.0)
    visibility   = float(weather.get("visibility", 10000.0) or 10000.0)
    humidity     = float(weather.get("humidity",      50.0) or 50.0)

    # ── Traffic features ──────────────────────────────────────
    congestion_ratio = float(
        traffic.get("congestion_ratio", 1.0) or 1.0
    )
    incident_count = int(
        traffic.get("incident_count", 0) or 0
    )
    road_closure = int(
        bool(traffic.get("road_closure", False))
    )

    # ── Camera features ───────────────────────────────────────
    person_count  = int(camera.get("person_count",  0) or 0)
    vehicle_count = int(camera.get("vehicle_count", 0) or 0)
    crowd_density = float(camera.get("crowd_density", 0.0) or 0.0)

    # ── Event features ────────────────────────────────────────
    total_attendance = sum(
        int(e.get("attendance", 0) or 0) for e in events
    )
    max_rank = max(
        (int(e.get("rank", 0) or 0) for e in events),
        default=0,
    )

    # ── Social features ───────────────────────────────────────
    social_posts = int(
        social.get("summary", {}).get("total_posts", 0) or 0
    )

    # ── Normalize features to 0-1 range ──────────────────────
    features = {
        # Weather — already reasonable ranges
        "temperature":        min(temperature / 50.0, 1.0),
        "rainfall_1h":        min(rainfall_1h / 100.0, 1.0),
        "wind_speed":         min(wind_speed / 30.0, 1.0),
        "visibility_norm":    normalize_visibility(visibility),
        "humidity":           humidity / 100.0,

        # Traffic
        "congestion_ratio":   max(0.0, min(1.0 - congestion_ratio, 1.0)),
        "incident_count_norm":min(incident_count / 20.0, 1.0),
        "road_closure":       float(road_closure),

        # Camera
        "person_count_norm":  min(person_count / 50.0, 1.0),
        "vehicle_count_norm": min(vehicle_count / 30.0, 1.0),
        "crowd_density":      crowd_density,

        # Events
        "event_attendance_norm": min(total_attendance / 100000.0, 1.0),
        "event_rank_norm":       min(max_rank / 100.0, 1.0),

        # Social
        "social_signal_norm": min(social_posts / 50.0, 1.0),

        # Time features
        "hour_sin":           hour_sin,
        "hour_cos":           hour_cos,
        "is_weekend":         float(weekday >= 5),
        "is_peak_hour":       float(hour in range(8, 10) or hour in range(17, 20)),
        "is_night":           float(hour >= 22 or hour < 6),
    }

    # Return as DataFrame with correct column order
    return pd.DataFrame([features])[FEATURE_COLUMNS]


def extract_features_from_db_rows(
    weather_row:  dict,
    traffic_row:  dict,
    camera_data:  dict,
    events_rows:  list,
    social_data:  dict,
    timestamp:    Optional[datetime] = None,
) -> pd.DataFrame:
    """
    Wrapper used by the Celery risk computation task.
    Accepts raw DB row dicts directly.
    """
    return extract_features(
        weather  = weather_row,
        traffic  = traffic_row,
        camera   = camera_data,
        events   = events_rows,
        social   = social_data,
        dt       = timestamp,
    )
