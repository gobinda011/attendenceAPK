from fastapi import FastAPI
from .routes import health, face

app = FastAPI(
    title="Attendance Face Recognition Service",
    description="Face detection, embedding generation, and matching for the "
                "AI Face Recognition Attendance Management System.",
    version="1.0.0",
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(face.router, prefix="/api/face", tags=["face"])


@app.get("/")
def root():
    return {"service": "face-recognition-ai-service", "docs": "/docs"}
