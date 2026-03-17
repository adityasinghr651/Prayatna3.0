import cv2
import json
import logging
import asyncio
import threading
import numpy as np
from datetime import datetime, timezone
from typing import Generator

import redis as redis_client
from sqlalchemy import text

from app.config import settings
from app.vision.detector import get_detector

logger = logging.getLogger(__name__)


class CameraStreamHandler:
    """
    Handles reading frames from IP Webcam,
    running YOLO detection, saving results to DB and Redis.
    """

    def __init__(
        self,
        camera_id:   str   = "cam-01",
        camera_name: str   = "Indore Main Camera",
        stream_url:  str   = None,
        lat:         float = None,
        lon:         float = None,
    ):
        self.camera_id   = camera_id
        self.camera_name = camera_name
        self.stream_url  = stream_url or settings.phone_camera_url
        self.lat         = lat  or settings.default_lat
        self.lon         = lon  or settings.default_lon

        self.cap          = None
        self.is_running   = False
        self.latest_result = {}

        self.detector = get_detector()
        self.redis    = redis_client.from_url(settings.redis_url)

    def connect(self) -> bool:
        """
        Open connection to IP Webcam stream.
        Returns True if successful.
        """
        logger.info(f"[Camera] Connecting to {self.stream_url}")
        self.cap = cv2.VideoCapture(self.stream_url)

        # Set buffer size small for low latency
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        if self.cap.isOpened():
            logger.info("[Camera] Connected successfully.")
            return True

        logger.error("[Camera] Failed to connect to stream.")
        return False

    def read_frame(self) -> tuple[bool, np.ndarray | None]:
        """
        Read one frame from the stream.
        Returns (success, frame).
        """
        if self.cap is None or not self.cap.isOpened():
            return False, None

        # Grab to clear buffer, then retrieve latest frame
        self.cap.grab()
        success, frame = self.cap.retrieve()
        return success, frame

    def process_frame(self, frame: np.ndarray) -> dict:
        """
        Run YOLO detection on frame.
        Save result to DB and Redis.
        """
        result = self.detector.detect_frame(frame)

        # Add camera metadata
        result["camera_id"]   = self.camera_id
        result["camera_name"] = self.camera_name
        result["lat"]         = self.lat
        result["lon"]         = self.lon

        # Save to Redis for instant API access
        self.redis.setex(
            f"camera:{self.camera_id}:latest",
            60,                     # expires in 60 seconds
            json.dumps({
                "camera_id":         self.camera_id,
                "camera_name":       self.camera_name,
                "lat":               self.lat,
                "lon":               self.lon,
                "score":             result["camera_risk_score"],
                "person_count":      result["person_count"],
                "vehicle_count":     result["vehicle_count"],
                "crowd_density":     result["crowd_density"],
                "vehicle_density":   result["vehicle_density"],
                "summary": {
                    "persons":  result["person_count"],
                    "vehicles": result["vehicle_count"],
                    "cars":     result["car_count"],
                    "bikes":    result["bike_count"],
                    "buses":    result["bus_count"],
                },
                "updated_at": result["timestamp"],
            }),
        )

        # Update aggregate camera score for risk engine
        self.redis.setex(
            "camera:latest",
            60,
            json.dumps({
                "score":   result["camera_risk_score"],
                "summary": {
                    "persons":  result["person_count"],
                    "vehicles": result["vehicle_count"],
                    "crowd_density": result["crowd_density"],
                },
                "updated_at": result["timestamp"],
            }),
        )

        self.latest_result = result
        return result

    def save_to_db(self, result: dict) -> None:
        """
        Save detection result to camera_events table.
        Uses sync DB session (called from background thread).
        """
        from app.database import SyncSessionLocal

        db = SyncSessionLocal()
        try:
            db.execute(text("""
                INSERT INTO camera_events (
                    camera_id, camera_name, lat, lon,
                    vehicle_count, person_count,
                    bike_count, bus_count, car_count,
                    crowd_density, detections, recorded_at
                ) VALUES (
                    :camera_id, :camera_name, :lat, :lon,
                    :vehicle_count, :person_count,
                    :bike_count, :bus_count, :car_count,
                    :crowd_density, :detections::jsonb, :recorded_at
                )
            """), {
                "camera_id":     result["camera_id"],
                "camera_name":   result["camera_name"],
                "lat":           result["lat"],
                "lon":           result["lon"],
                "vehicle_count": result["vehicle_count"],
                "person_count":  result["person_count"],
                "bike_count":    result["bike_count"],
                "bus_count":     result["bus_count"],
                "car_count":     result["car_count"],
                "crowd_density": result["crowd_density"],
                "detections":    json.dumps(result["detections"]),
                "recorded_at":   datetime.now(timezone.utc),
            })
            db.commit()
        except Exception as e:
            logger.error(f"[Camera] DB save failed: {e}")
            db.rollback()
        finally:
            db.close()

    def get_mjpeg_frames(self) -> Generator[bytes, None, None]:
        """
        Generator that yields MJPEG frames for live streaming
        to the frontend CameraFeed component.

        Usage in FastAPI route:
            return StreamingResponse(
                handler.get_mjpeg_frames(),
                media_type="multipart/x-mixed-replace;boundary=frame"
            )
        """
        if not self.connect():
            return

        frame_count  = 0
        save_every   = 30   # Save to DB every 30 frames (~1 per second at 30fps)

        while True:
            success, frame = self.read_frame()

            if not success:
                logger.warning("[Camera] Frame read failed — retrying...")
                self.connect()
                continue

            # Run detection every frame
            result = self.process_frame(frame)
            frame_count += 1

            # Save to DB every Nth frame
            if frame_count % save_every == 0:
                self.save_to_db(result)

            # Draw detections on frame
            annotated = self.detector.draw_detections(frame.copy(), result)

            # Encode as JPEG
            _, buffer = cv2.imencode(
                ".jpg", annotated,
                [cv2.IMWRITE_JPEG_QUALITY, 70]
            )
            frame_bytes = buffer.tobytes()

            # Yield as MJPEG chunk
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n"
                + frame_bytes
                + b"\r\n"
            )

    def release(self):
        if self.cap:
            self.cap.release()
        logger.info("[Camera] Stream released.")


# ── Camera registry ───────────────────────────────────────────
# Stores active camera handlers by camera_id
_camera_registry: dict[str, CameraStreamHandler] = {}


def get_camera_handler(
    camera_id:   str   = "cam-01",
    stream_url:  str   = None,
    camera_name: str   = "Indore Main Camera",
    lat:         float = None,
    lon:         float = None,
) -> CameraStreamHandler:
    """
    Returns existing handler or creates new one.
    Ensures only one handler per camera_id.
    """
    global _camera_registry

    if camera_id not in _camera_registry:
        _camera_registry[camera_id] = CameraStreamHandler(
            camera_id=camera_id,
            camera_name=camera_name,
            stream_url=stream_url or settings.phone_camera_url,
            lat=lat,
            lon=lon,
        )

    return _camera_registry[camera_id]