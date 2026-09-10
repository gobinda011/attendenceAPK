# Face Recognition AI Service (FastAPI)

Responsible for: face detection, quality checking, embedding generation, and
similarity comparison (Section 12 / 26 / 35 of the spec).

## Run locally

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Swapping in a production-grade recognition model

This scaffold ships with a **dependency-free, OpenCV-only** detector/embedder
(Haar-cascade detection + a HOG-based embedding) so the whole pipeline runs
end-to-end with nothing to download and no GPU. It is intentionally isolated
behind `services/detector.py` and `services/embedding.py` so it can be
swapped for a real model without touching any other file:

- **Detection**: replace `HaarFaceDetector` with `cv2.FaceDetectorYN` (YuNet)
  or MTCNN/RetinaFace.
- **Embedding**: replace `HogEmbedder` with a proper face-embedding network:
  `cv2.FaceRecognizerSF` (SFace, 128-d, lightweight, ONNX), FaceNet, ArcFace
  (via `insightface`), or `deepface`.

The spec explicitly calls this out in Section 12 / 35: *"the exact face
recognition model should be selected during implementation/testing based on
recognition accuracy, CPU performance, licensing, model size, and deployment
requirements."* Everything downstream (matcher, threshold, API contract)
is independent of which model you plug in, as long as it returns a fixed-
length numeric vector.
