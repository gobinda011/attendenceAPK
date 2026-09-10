"""
FR-003 (registration) and FR-004/FR-005 (recognition) HTTP endpoints.
Mirrors Section 29 / 30 of the spec exactly.
"""
import json
from fastapi import APIRouter, UploadFile, Form, File
from pydantic import BaseModel

from ..services.detector import detector
from ..services.embedding import embedder
from ..services.quality import assess_quality
from ..services.matcher import find_best_match
from ..utils.image import decode_image

router = APIRouter()


def _extract_single_face(image_bgr):
    """
    Shared pipeline step for both registration and recognition:
    detect -> require exactly one usable face -> quality check -> crop.
    Returns (face_crop, error_message_or_None).
    """
    import cv2

    boxes = detector.detect(image_bgr)
    if len(boxes) == 0:
        return None, "No face detected in the image"
    if len(boxes) > 1:
        return None, "Multiple faces detected - please capture one person at a time"

    x, y, w, h = boxes[0]
    face_crop = image_bgr[y : y + h, x : x + w]

    gray_face = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)
    quality = assess_quality(gray_face)
    if not quality["ok"]:
        return None, quality["reason"]

    return face_crop, None


@router.post("/register")
async def register_face(
    employee_id: str = Form(...),
    label: str = Form("primary"),
    image: UploadFile = File(...),
):
    """FR-003: Face Registration -> detect, validate quality, embed."""
    raw = await image.read()
    try:
        img = decode_image(raw)
    except ValueError as e:
        return {"success": False, "message": str(e)}

    face_crop, error = _extract_single_face(img)
    if error:
        return {"success": False, "message": error}

    embedding = embedder.generate(face_crop)
    return {"success": True, "employeeId": employee_id, "label": label, "embedding": embedding}


@router.post("/recognize")
async def recognize_face(
    image: UploadFile = File(...),
    registered_employees: str = Form(...),
):
    """
    FR-004/FR-005: Face Recognition.
    `registered_employees` is a JSON string:
      [{"employeeId": "EMP001", "embeddings": [[...], [...]]}, ...]
    The backend (not this service) applies the final accept/reject threshold,
    per Section 48's separation of "AI identifies" vs "backend decides" -
    but we still return the raw score so the backend has everything it needs.
    """
    raw = await image.read()
    try:
        img = decode_image(raw)
    except ValueError as e:
        return {"matched": False, "employeeId": None, "confidence": 0.0, "message": str(e)}

    face_crop, error = _extract_single_face(img)
    if error:
        return {"matched": False, "employeeId": None, "confidence": 0.0, "message": error}

    query_embedding = embedder.generate(face_crop)

    try:
        candidates = json.loads(registered_employees)
    except json.JSONDecodeError:
        return {"matched": False, "employeeId": None, "confidence": 0.0, "message": "Invalid candidate list"}

    result = find_best_match(query_embedding, candidates)
    matched = result["employeeId"] is not None

    return {
        "matched": matched,
        "employeeId": result["employeeId"],
        "confidence": round(result["confidence"], 4),
    }
