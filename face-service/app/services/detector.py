"""
Face detection (FR-004 step 1 / Section 35).

Uses OpenCV's built-in Haar Cascade classifier, which ships with
opencv-python and needs no external model download - useful for a scaffold
that must run offline. Swap for cv2.FaceDetectorYN (YuNet) or MTCNN/
RetinaFace for materially better accuracy in production (see README).
"""
import cv2
import numpy as np

_CASCADE_PATH = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"


class HaarFaceDetector:
    def __init__(self):
        self._cascade = cv2.CascadeClassifier(_CASCADE_PATH)
        if self._cascade.empty():
            raise RuntimeError("Failed to load Haar cascade classifier")

    def detect(self, image_bgr: np.ndarray):
        """
        Returns a list of (x, y, w, h) bounding boxes, largest-face-first.
        Detecting >1 or 0 faces is treated as a validation failure by callers
        (Section 35: "Validate exactly one usable face").
        """
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)

        faces = self._cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=6, minSize=(80, 80)
        )
        faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
        return [tuple(map(int, f)) for f in faces]


detector = HaarFaceDetector()
