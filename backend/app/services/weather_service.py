import httpx
from datetime import datetime, timezone
from app.config import settings

BASE_URL ="https://api.openweathermap.org/data/2.5/weather"

async def fetch_weather(lat: float = None, lon: float = None) -> dict:
    """
    Fetch current weather + alerts from OpenWeatherMap One Call API 3.0
    Returns parsed dict ready to insert into weather_data table
    """
    lat = lat or settings.default_lat
    lon = lon or settings.default_lon

    params = {
        "lat": lat,
        "lon": lon,
        "appid": settings.openweather_api_key,
        "units": "metric",          # Celsius, m/s
        "exclude": "minutely,daily" # we only need current + hourly + alerts
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(BASE_URL, params=params)
        response.raise_for_status()
        data = response.json()

    current = data.get("current", {})
    weather_info = current.get("weather", [{}])[0]
    rain = current.get("rain", {})

    parsed = {
        "city":           settings.default_city,
        "lat":            lat,
        "lon":            lon,
        "temperature":    current.get("temp"),
        "feels_like":     current.get("feels_like"),
        "humidity":       current.get("humidity"),
        "pressure":       current.get("pressure"),
        "wind_speed":     current.get("wind_speed"),
        "wind_direction": current.get("wind_deg"),
        "rainfall_1h":    rain.get("1h", 0.0),
        "rainfall_3h":    rain.get("3h", 0.0),
        "weather_main":   weather_info.get("main"),
        "weather_desc":   weather_info.get("description"),
        "visibility":     current.get("visibility"),
        "uv_index":       current.get("uvi"),
        "raw_response":   data,
        "recorded_at":    datetime.now(timezone.utc),
    }

    return parsed


def compute_weather_risk_score(weather: dict) -> float:
    """
    Convert weather data into a 0.0 - 1.0 risk score.
    Higher = more dangerous conditions.
    """
    score = 0.0

    # Heavy rainfall is the biggest risk factor in Indore
    rainfall = weather.get("rainfall_1h", 0.0) or 0.0
    if rainfall > 50:
        score += 0.5        # Extreme rain
    elif rainfall > 20:
        score += 0.35
    elif rainfall > 10:
        score += 0.2
    elif rainfall > 2:
        score += 0.1

    # Low visibility
    visibility = weather.get("visibility", 10000) or 10000
    if visibility < 200:
        score += 0.3
    elif visibility < 500:
        score += 0.2
    elif visibility < 1000:
        score += 0.1

    # Strong winds
    wind = weather.get("wind_speed", 0.0) or 0.0
    if wind > 20:
        score += 0.15
    elif wind > 12:
        score += 0.08

    # Extreme heat (Indore gets very hot summers)
    temp = weather.get("temperature", 25.0) or 25.0
    if temp > 44:
        score += 0.1
    elif temp > 40:
        score += 0.05

    # Cap at 1.0
    return round(min(score, 1.0), 3)


async def save_weather_to_db(db, weather: dict) -> None:
    """
    Insert parsed weather dict into weather_data table.
    Uses raw SQL for speed — no ORM overhead.
    """
    from sqlalchemy import text

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

    import json
    params = {**weather, "raw_response": json.dumps(weather["raw_response"])}
    await db.execute(query, params)


async def get_latest_weather(db) -> dict | None:
    """
    Fetch the most recent weather reading from DB.
    Used by risk engine to avoid duplicate API calls.
    """
    from sqlalchemy import text

    query = text("""
        SELECT * FROM weather_data
        WHERE city = :city
        ORDER BY recorded_at DESC
        LIMIT 1
    """)
    result = await db.execute(query, {"city": settings.default_city})
    row = result.mappings().fetchone()
    return dict(row) if row else None