from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # App
    app_name: str = "Urban Risk Intelligence Platform"
    app_env: str = "development"
    debug: bool = True
    secret_key: str = "changeme"

    # Database
    database_url: str
    sync_database_url: str

    # Redis / Celery
    redis_url: str
    celery_broker_url: str
    celery_result_backend: str

    # External APIs
    openweather_api_key: str
    tomtom_api_key: str
    predicthq_api_key: str
    bluesky_username: str
    bluesky_password: str

    # Camera
    phone_camera_url: str = "http://192.168.1.1:8080/video"

    # City defaults
    default_city: str = "Indore"
    default_lat: float = 22.7196
    default_lon: float = 75.8577

    # Risk thresholds
    high_risk_threshold: float = 0.7
    medium_risk_threshold: float = 0.4

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# Cache settings so .env is only read once
@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()