import httpx
from datetime import datetime, timezone
from app.config import settings

FLOW_URL      = "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json"
INCIDENT_URL  = "https://api.tomtom.com/traffic/services/5/incidentDetails"

# Bounding box around Indore city
INDORE_BBOX = "75.7,22.6,76.0,22.9"


async def fetch_traffic_flow(lat: float = None, lon: float = None) -> dict:
    """
    Fetch real-time traffic flow at a specific point.
    Returns current speed vs free-flow speed.
    """
    lat = lat or settings.default_lat
    lon = lon or settings.default_lon

    params = {
        "point":  f"{lat},{lon}",
        "unit":   "KMPH",
        "key":    settings.tomtom_api_key,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(FLOW_URL, params=params)
        response.raise_for_status()
        data = response.json()

    flow = data.get("flowSegmentData", {})
    current_speed   = flow.get("currentSpeed", 0)
    free_flow_speed = flow.get("freeFlowSpeed", 1)   # avoid div by zero

    # Congestion ratio: 1.0 = completely free, 0.0 = standstill
    congestion_ratio = round(current_speed / free_flow_speed, 4) if free_flow_speed else 1.0

    return {
        "current_speed":    current_speed,
        "free_flow_speed":  free_flow_speed,
        "congestion_ratio": congestion_ratio,
        "confidence":       flow.get("confidence", 0),
        "raw_flow":         data,
    }


async def fetch_traffic_incidents(bbox: str = None) -> dict:
    """
    Fetch traffic incidents in bounding box around Indore.
    Returns incident count and types.
    """
    bbox = bbox or INDORE_BBOX

    params = {
        "bbox":        bbox,
        "fields":      "{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,code,iconCategory},startTime,endTime,from,to,length,delay,roadNumbers,timeValidity}}}",
        "language":    "en-GB",
        "categoryFilter": "0,1,2,3,4,5,6,7,8,9,10,11",
        "timeValidityFilter": "present",
        "key":         settings.tomtom_api_key,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(INCIDENT_URL, params=params)
        response.raise_for_status()
        data = response.json()

    incidents = data.get("incidents", [])
    incident_count = len(incidents)

    # Categorize incident types
    incident_types = {}
    road_closure = False

    for inc in incidents:
        props = inc.get("properties", {})
        category = props.get("iconCategory", "Unknown")
        incident_types[category] = incident_types.get(category, 0) + 1

        # Check for road closures (category 0)
        if props.get("iconCategory") == 0:
            road_closure = True

    return {
        "incident_count":  incident_count,
        "incident_types":  incident_types,
        "road_closure":    road_closure,
        "raw_incidents":   data,
    }


async def fetch_full_traffic(lat: float = None, lon: float = None) -> dict:
    """
    Combine flow + incidents into one dict.
    This is what gets saved to traffic_data table.
    """
    lat = lat or settings.default_lat
    lon = lon or settings.default_lon

    flow      = await fetch_traffic_flow(lat, lon)
    incidents = await fetch_traffic_incidents()

    import json
    raw_combined = {
        "flow":      flow["raw_flow"],
        "incidents": incidents["raw_incidents"],
    }

    return {
        "city":             settings.default_city,
        "lat":              lat,
        "lon":              lon,
        "current_speed":    flow["current_speed"],
        "free_flow_speed":  flow["free_flow_speed"],
        "congestion_ratio": flow["congestion_ratio"],
        "incident_count":   incidents["incident_count"],
        "incident_types":   incidents["incident_types"],
        "road_closure":     incidents["road_closure"],
        "confidence":       flow["confidence"],
        "raw_response":     raw_combined,
        "recorded_at":      datetime.now(timezone.utc),
    }


def compute_traffic_risk_score(traffic: dict) -> float:
    """
    Convert traffic data into a 0.0 - 1.0 risk score.
    """
    score = 0.0

    # Congestion ratio (lower ratio = more congested = higher risk)
    congestion = traffic.get("congestion_ratio", 1.0) or 1.0
    if congestion < 0.2:
        score += 0.5    # Near standstill
    elif congestion < 0.4:
        score += 0.35
    elif congestion < 0.6:
        score += 0.2
    elif congestion < 0.8:
        score += 0.1

    # Incident count
    incidents = traffic.get("incident_count", 0) or 0
    if incidents >= 10:
        score += 0.3
    elif incidents >= 5:
        score += 0.2
    elif incidents >= 2:
        score += 0.1
    elif incidents >= 1:
        score += 0.05

    # Road closure is a hard boost
    if traffic.get("road_closure", False):
        score += 0.2

    return round(min(score, 1.0), 3)


async def save_traffic_to_db(db, traffic: dict) -> None:
    from sqlalchemy import text
    import json

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

    params = {
        **traffic,
        "incident_types": json.dumps(traffic["incident_types"]),
        "raw_response":   json.dumps(traffic["raw_response"]),
    }
    await db.execute(query, params)


async def get_latest_traffic(db) -> dict | None:
    from sqlalchemy import text

    query = text("""
        SELECT * FROM traffic_data
        WHERE city = :city
        ORDER BY recorded_at DESC
        LIMIT 1
    """)
    result = await db.execute(query, {"city": settings.default_city})
    row = result.mappings().fetchone()
    return dict(row) if row else None