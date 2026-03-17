import httpx
from datetime import datetime, timezone, timedelta
from app.config import settings

PREDICTHQ_URL = "https://api.predicthq.com/v1/events/"

# Fallback: Ticketmaster API (completely free, 5000 calls/day)
TICKETMASTER_URL = "https://app.ticketmaster.com/discovery/v2/events.json"


async def fetch_events_predicthq(lat: float = None, lon: float = None) -> list:
    """
    Fetch upcoming crowd events near Indore from PredictHQ.
    Falls back to empty list if API is unavailable.
    """
    lat = lat or settings.default_lat
    lon = lon or settings.default_lon

    headers = {
        "Authorization": f"Bearer {settings.predicthq_api_key}",
        "Accept":        "application/json",
    }

    # Get events within 20km of Indore center, starting today
    params = {
        "within":       f"20km@{lat},{lon}",
        "active.gte":   datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "active.lte":   (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d"),
        "limit":        20,
        "sort":         "-rank",    # highest impact first
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                PREDICTHQ_URL,
                headers=headers,
                params=params,
            )
            response.raise_for_status()
            data = response.json()

        events = []
        for event in data.get("results", []):
            loc = event.get("location", [0, 0])
            events.append({
                "event_id":   event.get("id"),
                "city":       settings.default_city,
                "lat":        loc[1] if len(loc) > 1 else lat,
                "lon":        loc[0] if len(loc) > 0 else lon,
                "title":      event.get("title"),
                "category":   event.get("category"),
                "rank":       event.get("rank", 0),
                "attendance": event.get("phq_attendance", 0),
                "start_time": event.get("start"),
                "end_time":   event.get("end"),
                "raw_response": event,
                "recorded_at":  datetime.now(timezone.utc),
            })
        return events

    except Exception as e:
        print(f"[PredictHQ] Error: {e} — returning empty events list")
        return []


def compute_events_risk_score(events: list) -> float:
    """
    Convert event list into a 0.0 - 1.0 crowd risk score.
    Based on total expected attendance near the city.
    """
    if not events:
        return 0.0

    total_attendance = sum(
        e.get("attendance", 0) or 0
        for e in events
    )
    max_rank = max(
        (e.get("rank", 0) or 0 for e in events),
        default=0
    )

    score = 0.0

    # Attendance-based score
    if total_attendance > 50000:
        score += 0.4
    elif total_attendance > 10000:
        score += 0.25
    elif total_attendance > 1000:
        score += 0.15
    elif total_attendance > 100:
        score += 0.05

    # PredictHQ rank (0-100, higher = more impactful event)
    if max_rank > 80:
        score += 0.3
    elif max_rank > 60:
        score += 0.2
    elif max_rank > 40:
        score += 0.1

    return round(min(score, 1.0), 3)


async def save_events_to_db(db, events: list) -> None:
    from sqlalchemy import text
    import json

    if not events:
        return

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
        params = {
            **event,
            "raw_response": json.dumps(event["raw_response"]),
        }
        await db.execute(query, params)