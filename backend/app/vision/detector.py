import cv2
import json
import logging
import numpy as np
from datetime import datetime, timezone
from pathlib import Path
from ultralytics import YOLO

from app.config import settings

logger = logging.getLogger(__name__)

# ── YOLO class IDs we care about ──────────────────────────────
# Full COCO dataset has 80 classes — we only need these
TRACKED_CLASSES = {
    0:  "person",
    1:  "bicycle",
    2:  "car",
    3:  "motorcycle",
    5:  "bus",
    7:  "truck",
    9:  "traffic light",
    11: "stop sign",
}

# Classes that contribute to crowd density
CROWD_CLASSES = {0}           # person only

# Classes that contribute to vehicle density
VEHICLE_CLASSES = {1, 2, 3, 5, 7}  # bike, car, motorcycle, bus, truck


class URIPDetector:
    """
    YOLOv8-based object detector for urban risk analysis.
    Detects people, vehicles, and computes density scores.
    """

    def __init__(self, model_size: str = "n"):
        """
        model_size options:
          n = nano   (fastest,  6MB,  use for real-time)
          s = small  (fast,    22MB)
          m = medium (slower,  52MB)
        """
        model_path = Path(f"yolov8{model_size}.pt")
        logger.info(f"[Vision] Loading YOLOv8{model_size} model...")
        self.model = YOLO(str(model_path))
        logger.info("[Vision] Model loaded successfully.")

        # Detection thresholds
        self.confidence_threshold = 0.4
        self.iou_threshold        = 0.45

    def detect_frame(self, frame: np.ndarray) -> dict:
        """
        Run YOLO detection on a single frame.
        Returns structured detection results.

        Args:
            frame: OpenCV BGR image (numpy array)

        Returns:
            dict with counts, density scores, and raw detections
        """
        height, width = frame.shape[:2]
        frame_area    = height * width

        # Run inference
        results = self.model(
            frame,
            conf=self.confidence_threshold,
            iou=self.iou_threshold,
            verbose=False,
        )

        # Parse detections
        detections    = []
        person_count  = 0
        car_count     = 0
        bike_count    = 0
        bus_count     = 0
        truck_count   = 0
        vehicle_count = 0

        for result in results:
            boxes = result.boxes
            if boxes is None:
                continue

            for box in boxes:
                class_id   = int(box.cls[0])
                confidence = float(box.conf[0])
                class_name = TRACKED_CLASSES.get(class_id)

                if class_name is None:
                    continue

                # Get bounding box coordinates
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                box_area = (x2 - x1) * (y2 - y1)

                detections.append({
                    "class_id":   class_id,
                    "class_name": class_name,
                    "confidence": round(confidence, 3),
                    "bbox": {
                        "x1": round(x1),
                        "y1": round(y1),
                        "x2": round(x2),
                        "y2": round(y2),
                    },
                    "box_area_pct": round(box_area / frame_area, 4),
                })

                # Count by type
                if class_id == 0:
                    person_count += 1
                elif class_id == 2:
                    car_count += 1
                elif class_id in {1, 3}:
                    bike_count += 1
                elif class_id == 5:
                    bus_count += 1
                elif class_id == 7:
                    truck_count += 1

                if class_id in VEHICLE_CLASSES:
                    vehicle_count += 1

        # ── Compute density scores ────────────────────────────

        # Crowd density: normalize by frame area
        # A person takes ~2-5% of a 640x480 frame
        # 20+ people = high crowd density
        crowd_density = min(person_count / 20.0, 1.0)

        # Vehicle density: normalize
        # 15+ vehicles in frame = high density
        vehicle_density = min(vehicle_count / 15.0, 1.0)

        # Combined camera risk score
        # Crowd matters more than vehicles for safety risk
        camera_risk_score = round(
            (crowd_density * 0.6) + (vehicle_density * 0.4),
            3
        )

        return {
            "timestamp":          datetime.now(timezone.utc).isoformat(),
            "frame_width":        width,
            "frame_height":       height,
            "total_detections":   len(detections),
            "person_count":       person_count,
            "car_count":          car_count,
            "bike_count":         bike_count,
            "bus_count":          bus_count,
            "truck_count":        truck_count,
            "vehicle_count":      vehicle_count,
            "crowd_density":      round(crowd_density, 3),
            "vehicle_density":    round(vehicle_density, 3),
            "camera_risk_score":  camera_risk_score,
            "detections":         detections,
        }

    def draw_detections(self, frame: np.ndarray, result: dict) -> np.ndarray:
        """
        Draw bounding boxes and labels on frame.
        Returns annotated frame for live preview.
        """
        # Color map per class
        COLORS = {
            "person":        (0,   255, 0),     # Green
            "car":           (255, 165, 0),     # Orange
            "motorcycle":    (0,   165, 255),   # Yellow
            "bicycle":       (255, 255, 0),     # Cyan
            "bus":           (0,   0,   255),   # Red
            "truck":         (128, 0,   255),   # Purple
            "traffic light": (0,   255, 255),   # Yellow
            "stop sign":     (0,   0,   128),   # Dark red
        }

        for det in result["detections"]:
            bbox  = det["bbox"]
            color = COLORS.get(det["class_name"], (200, 200, 200))
            label = f"{det['class_name']} {det['confidence']:.2f}"

            # Draw box
            cv2.rectangle(
                frame,
                (bbox["x1"], bbox["y1"]),
                (bbox["x2"], bbox["y2"]),
                color, 2,
            )

            # Draw label background
            (text_w, text_h), _ = cv2.getTextSize(
                label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1
            )
            cv2.rectangle(
                frame,
                (bbox["x1"], bbox["y1"] - text_h - 6),
                (bbox["x1"] + text_w, bbox["y1"]),
                color, -1,
            )

            # Draw label text
            cv2.putText(
                frame, label,
                (bbox["x1"], bbox["y1"] - 4),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5, (0, 0, 0), 1,
            )

        # Draw stats overlay at top-left
        stats = [
            f"Persons:  {result['person_count']}",
            f"Vehicles: {result['vehicle_count']}",
            f"Crowd:    {result['crowd_density']:.2f}",
            f"Risk:     {result['camera_risk_score']:.2f}",
        ]

        for i, stat in enumerate(stats):
            cv2.putText(
                frame, stat,
                (10, 25 + (i * 22)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6, (0, 255, 0), 2,
            )

        return frame


# ── Singleton detector instance ───────────────────────────────
# Loaded once at startup, reused for all frames
_detector_instance: URIPDetector | None = None


def get_detector() -> URIPDetector:
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = URIPDetector(model_size="n")
    return _detector_instance