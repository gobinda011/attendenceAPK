"""
Basic face-image quality checks (Section 15 / FR-003 registration workflow).

A production system would check things like blur (Laplacian variance),
brightness histogram, face size relative to frame, and eye-openness/pose.
This scaffold implements blur + brightness + minimum-face-size checks, which
are cheap, meaningful, and enough to reject obviously unusable captures
before they ever reach the embedding step.
"""
import cv2
import numpy as np


def assess_quality(gray_face: np.ndarray) -> dict:
    if gray_face.size == 0:
        return {"ok": False, "reason": "Empty face region"}

    h, w = gray_face.shape[:2]
    if h < 60 or w < 60:
        return {"ok": False, "reason": "Face is too small in the frame"}

    brightness = float(np.mean(gray_face))
    if brightness < 40:
        return {"ok": False, "reason": "Image is too dark"}
    if brightness > 220:
        return {"ok": False, "reason": "Image is overexposed"}

    blur_score = float(cv2.Laplacian(gray_face, cv2.CV_64F).var())
    if blur_score < 30:
        return {"ok": False, "reason": "Image is too blurry"}

    return {"ok": True, "brightness": brightness, "blur_score": blur_score}
