import cv2
import uuid
import shutil
import json
from pathlib import Path
from datetime import datetime, timezone

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(prefix="/api/video", tags=["Video Analysis"])

UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("outputs")
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
VIDEO_EXTS = {".mp4", ".avi", ".mov", ".mkv"}


@router.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    import traceback
    try:
        filename = file.filename or "upload.jpg"
        ext      = Path(filename).suffix.lower()

        if ext not in IMAGE_EXTS:
            raise HTTPException(400, f"Use: jpg, png, bmp")

        file_id  = str(uuid.uuid4())[:8]
        in_path  = UPLOAD_DIR / f"{file_id}_input{ext}"
        out_path = OUTPUT_DIR / f"{file_id}_output.jpg"

        # Save file
        content = await file.read()
        with open(in_path, "wb") as f:
            f.write(content)

        # Read image
        frame = cv2.imread(str(in_path))
        if frame is None:
            raise HTTPException(400, "Cannot read image")

        # YOLO detection
        person_count = vehicle_count = car_count = 0
        bike_count   = bus_count     = total     = 0
        risk_score   = crowd_density = 0.0

        try:
            from app.vision.detector import get_detector
            detector  = get_detector()
            result    = detector.detect_frame(frame)
            annotated = detector.draw_detections(frame.copy(), result)
            cv2.imwrite(str(out_path), annotated)

            person_count  = result["person_count"]
            vehicle_count = result["vehicle_count"]
            car_count     = result.get("car_count",  0)
            bike_count    = result.get("bike_count", 0)
            bus_count     = result.get("bus_count",  0)
            risk_score    = result["camera_risk_score"]
            crowd_density = result["crowd_density"]
            total         = result["total_detections"]

        except Exception as e:
            print(f"[Video] YOLO error: {e}")
            cv2.imwrite(str(out_path), frame)

        risk_level = (
            "HIGH"   if risk_score >= 0.7 else
            "MEDIUM" if risk_score >= 0.4 else
            "SAFE"
        )

        return {
            "file_id":       file_id,
            "original_file": filename,
            "detections": {
                "total":         total,
                "person_count":  person_count,
                "vehicle_count": vehicle_count,
                "car_count":     car_count,
                "bike_count":    bike_count,
                "bus_count":     bus_count,
            },
            "risk": {
                "camera_risk_score": risk_score,
                "crowd_density":     crowd_density,
                "risk_level":        risk_level,
            },
            "annotated_image_url": f"/api/video/output/{file_id}_output.jpg",
            "analyzed_at": datetime.now(timezone.utc).isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[Video] Fatal: {traceback.format_exc()}")
        raise HTTPException(500, f"Failed: {str(e)}")


@router.post("/analyze-video")
async def analyze_video(
    file:       UploadFile = File(...),
    max_frames: int        = Form(default=50),
    frame_skip: int        = Form(default=10),
):
    import traceback
    try:
        filename = file.filename or "upload.mp4"
        ext      = Path(filename).suffix.lower()

        if ext not in VIDEO_EXTS:
            raise HTTPException(400, f"Use: mp4, avi, mov")

        file_id  = str(uuid.uuid4())[:8]
        in_path  = UPLOAD_DIR / f"{file_id}_input{ext}"
        out_path = OUTPUT_DIR / f"{file_id}_output.mp4"

        # Save file
        content = await file.read()
        with open(in_path, "wb") as f:
            f.write(content)

        # Open video
        cap = cv2.VideoCapture(str(in_path))
        if not cap.isOpened():
            raise HTTPException(400, "Cannot open video")

        fps    = int(cap.get(cv2.CAP_PROP_FPS)) or 25
        width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total  = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        # Output writer
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(
            str(out_path), fourcc, fps, (width, height)
        )

        # Load YOLO once
        use_yolo = False
        detector = None
        try:
            from app.vision.detector import get_detector
            detector = get_detector()
            use_yolo = True
        except Exception as e:
            print(f"[Video] YOLO not available: {e}")

        frame_results = []
        frame_idx     = 0
        processed     = 0

        while True:
            ret, frame = cap.read()
            if not ret or processed >= max_frames:
                break

            if frame_idx % frame_skip == 0:
                if use_yolo and detector:
                    try:
                        result    = detector.detect_frame(frame)
                        annotated = detector.draw_detections(
                            frame.copy(), result
                        )
                        frame_results.append({
                            "frame":             frame_idx,
                            "person_count":      result["person_count"],
                            "vehicle_count":     result["vehicle_count"],
                            "crowd_density":     result["crowd_density"],
                            "camera_risk_score": result["camera_risk_score"],
                        })
                        writer.write(annotated)
                    except Exception:
                        writer.write(frame)
                else:
                    writer.write(frame)
                processed += 1
            else:
                writer.write(frame)

            frame_idx += 1

        cap.release()
        writer.release()

        # Summary stats
        if frame_results:
            avg_risk  = sum(r["camera_risk_score"] for r in frame_results) / len(frame_results)
            max_risk  = max(r["camera_risk_score"] for r in frame_results)
            avg_crowd = sum(r["crowd_density"]     for r in frame_results) / len(frame_results)
            avg_pers  = sum(r["person_count"]      for r in frame_results) / len(frame_results)
            avg_veh   = sum(r["vehicle_count"]     for r in frame_results) / len(frame_results)
        else:
            avg_risk = max_risk = avg_crowd = avg_pers = avg_veh = 0.0

        return {
            "file_id":       file_id,
            "original_file": filename,
            "video_info": {
                "total_frames":     total,
                "fps":              fps,
                "duration_sec":     round(total / fps, 1),
                "processed_frames": processed,
            },
            "summary": {
                "avg_persons_per_frame":  round(avg_pers,  1),
                "avg_vehicles_per_frame": round(avg_veh,   1),
                "avg_crowd_density":      round(avg_crowd, 3),
                "avg_risk_score":         round(avg_risk,  3),
                "max_risk_score":         round(max_risk,  3),
                "overall_risk_level": (
                    "HIGH"   if avg_risk >= 0.7 else
                    "MEDIUM" if avg_risk >= 0.4 else
                    "SAFE"
                ),
            },
            "frame_by_frame":      frame_results[:20],
            "annotated_video_url": f"/api/video/output/{file_id}_output.mp4",
            "analyzed_at":         datetime.now(timezone.utc).isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[Video] Fatal: {traceback.format_exc()}")
        raise HTTPException(500, f"Failed: {str(e)}")


@router.get("/output/{filename}")
async def get_output_file(filename: str):
    path = OUTPUT_DIR / filename
    if not path.exists():
        raise HTTPException(404, "File not found")
    media_type = "video/mp4" if filename.endswith(".mp4") else "image/jpeg"
    return FileResponse(str(path), media_type=media_type)