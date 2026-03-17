from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
import json
import redis as redis_client

from app.config import settings
from app.vision.stream_handler import get_camera_handler

router = APIRouter(prefix="/api/camera", tags=["Camera"])
r = redis_client.from_url(settings.redis_url)


@router.get("/stream/{camera_id}")
async def stream_camera(
    camera_id: str,
    url: str = Query(default=None),
):
    """
    MJPEG stream endpoint with YOLO detection overlay.
    Frontend <img> tag points to this URL.

    Usage:
        <img src="http://localhost:8000/api/camera/stream/cam-01" />
    """
    handler = get_camera_handler(
        camera_id=camera_id,
        stream_url=url,
    )

    return StreamingResponse(
        handler.get_mjpeg_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@router.get("/list")
async def list_cameras():
    """
    Returns list of all registered cameras with latest stats.
    """
    cameras = []

    # Get all camera keys from Redis
    keys = r.keys("camera:cam-*:latest")

    for key in keys:
        data = r.get(key)
        if data:
            cameras.append(json.loads(data))

    # If no cameras in Redis, return default
    if not cameras:
        cameras = [{
            "camera_id":       "cam-01",
            "camera_name":     "Indore Main Camera",
            "lat":             settings.default_lat,
            "lon":             settings.default_lon,
            "score":           0.0,
            "person_count":    0,
            "vehicle_count":   0,
            "crowd_density":   0.0,
            "vehicle_density": 0.0,
            "status":          "offline",
        }]

    return {"cameras": cameras, "total": len(cameras)}


@router.get("/stats/{camera_id}")
async def get_camera_stats(camera_id: str):
    """
    Returns latest detection stats for a specific camera.
    """
    data = r.get(f"camera:{camera_id}:latest")

    if not data:
        return {
            "camera_id":     camera_id,
            "status":        "offline",
            "message":       "No recent data available",
        }

    return json.loads(data)


@router.get("/snapshot/{camera_id}")
async def get_snapshot(camera_id: str):
    """
    Returns a single annotated JPEG frame.
    Useful for thumbnail previews.
    """
    import cv2

    handler = get_camera_handler(camera_id=camera_id)

    if not handler.connect():
        return {"error": "Camera offline"}

    success, frame = handler.read_frame()
    if not success:
        return {"error": "Failed to capture frame"}

    result    = handler.process_frame(frame)
    annotated = handler.detector.draw_detections(frame.copy(), result)

    _, buffer = cv2.imencode(".jpg", annotated)

    handler.release()

    return StreamingResponse(
        iter([buffer.tobytes()]),
        media_type="image/jpeg",
    )