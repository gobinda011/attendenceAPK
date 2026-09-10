"""Shared image-decoding helpers used across the face service."""
import numpy as np
import cv2


def decode_image(raw_bytes: bytes) -> np.ndarray:
    """Decode raw uploaded bytes into a BGR OpenCV image array."""
    array = np.frombuffer(raw_bytes, dtype=np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Could not decode image - unsupported or corrupted file")
    return image
