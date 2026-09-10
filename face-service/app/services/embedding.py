"""
Face embedding generation (FR-004 step 3 / Section 3 & 35).

This scaffold uses a lightweight, dependency-free HOG-style descriptor
(gradient histogram over a normalized face crop) purely so the end-to-end
pipeline - registration, storage, comparison, thresholding - is fully
runnable without downloading any external model weights.

*** This is NOT production-accurate face recognition. *** It is a stand-in
that respects the exact same interface a real embedding model would expose:
`generate(face_image) -> list[float]` of fixed length, L2-normalized. Replace
the body of `generate()` with a call to a real model (SFace/ArcFace/FaceNet/
deepface) and nothing else in the system needs to change - not the database
schema, not the matcher, not the API contract (see Section 3: "generate and
store a biometric face embedding ... compare using a defined similarity
threshold").
"""
import cv2
import numpy as np

EMBEDDING_SIZE = 128
_FACE_SIZE = (96, 96)


class HogEmbedder:
    def __init__(self):
        win_size = _FACE_SIZE
        block_size = (16, 16)
        block_stride = (8, 8)
        cell_size = (8, 8)
        nbins = 9
        self._hog = cv2.HOGDescriptor(win_size, block_size, block_stride, cell_size, nbins)

    def generate(self, face_bgr: np.ndarray) -> list:
        gray = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2GRAY)
        resized = cv2.resize(gray, _FACE_SIZE)
        resized = cv2.equalizeHist(resized)

        raw = self._hog.compute(resized).flatten()

        # Reduce to a fixed EMBEDDING_SIZE via block-averaging, then
        # L2-normalize so cosine similarity behaves consistently regardless
        # of raw feature-vector magnitude.
        if raw.size < EMBEDDING_SIZE:
            raw = np.pad(raw, (0, EMBEDDING_SIZE - raw.size))
        chunks = np.array_split(raw[: raw.size - (raw.size % EMBEDDING_SIZE) or raw.size], EMBEDDING_SIZE)
        vector = np.array([chunk.mean() for chunk in chunks], dtype=np.float64)

        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm

        return vector.tolist()


embedder = HogEmbedder()
