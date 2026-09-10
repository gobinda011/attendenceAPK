"""
Similarity comparison + best-candidate selection (FR-004 steps 4-6 / Section 35).

Cosine similarity is used because embeddings are L2-normalized, so cosine
similarity and dot product are equivalent and bounded in [-1, 1]. The
"confidence" returned to the backend is this similarity score, re-scaled to
[0, 1] for a more intuitive 0-100% reading in the admin dashboard.
"""
import numpy as np


def cosine_similarity(a, b) -> float:
    a = np.asarray(a, dtype=np.float64)
    b = np.asarray(b, dtype=np.float64)
    denom = (np.linalg.norm(a) * np.linalg.norm(b)) or 1e-9
    return float(np.dot(a, b) / denom)


def find_best_match(query_embedding, registered_employees: list) -> dict:
    """
    registered_employees: [{"employeeId": str, "embeddings": [[float,...], ...]}]
    An employee can have multiple embeddings (front/left/right, Section 15);
    we take the MAX similarity across all of an employee's embeddings, since
    any one good angle-match is sufficient evidence of identity.
    """
    best_employee_id = None
    best_score = -1.0

    for entry in registered_employees:
        for vector in entry.get("embeddings", []):
            score = cosine_similarity(query_embedding, vector)
            if score > best_score:
                best_score = score
                best_employee_id = entry["employeeId"]

    # Rescale cosine similarity [-1, 1] -> confidence [0, 1] for readability.
    confidence = max(0.0, min(1.0, (best_score + 1) / 2))
    return {"employeeId": best_employee_id, "confidence": confidence, "raw_score": best_score}
