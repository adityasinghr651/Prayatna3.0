import json
import asyncio
import logging
import threading
from contextlib import asynccontextmanager

import redis
import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

logger = logging.getLogger(__name__)

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=["http://localhost:3000"],
)

def start_redis_listener():
    r = redis.from_url(settings.redis_url)
    pubsub = r.pubsub()
    pubsub.subscribe("alerts:new")
    for message in pubsub.listen():
        if message["type"] == "message":
            try:
                alert = json.loads(message["data"])
                asyncio.run(sio.emit("new_alert", alert))
            except Exception as e:
                logger.error(f"[Redis] Push failed: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    thread = threading.Thread(target=start_redis_listener, daemon=True)
    thread.start()
    yield

# ── App create ────────────────────────────────────────────────
app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# ── CORS — SABSE PEHLE ADD KARO ───────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ── Health ────────────────────────────────────────────────────
@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "app":    settings.app_name,
        "city":   settings.default_city,
    }

# ── Routes — CORS KE BAAD REGISTER KARO ──────────────────────
from app.routes import risk, camera, data, alerts, video_analysis

app.include_router(risk.router)
app.include_router(camera.router)
app.include_router(data.router)
app.include_router(alerts.router)
app.include_router(video_analysis.router)

# ── Socket.IO ─────────────────────────────────────────────────
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

@sio.event
async def connect(sid, environ):
    await sio.emit("welcome", {"message": "Connected"}, to=sid)

@sio.event
async def disconnect(sid):
    pass