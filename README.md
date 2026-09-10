# AI Face Recognition Attendance Management System

Full implementation per the master specification. Start here:

- **`docs/DOCUMENTATION.md`** — complete point-by-point documentation: what every
  part of the system does, why it's designed that way, and exactly where it's
  implemented. Read this first.
- **`backend/`** — Node.js/Express REST API (auth, employees, attendance, dashboard, reports)
- **`face-service/`** — Python/FastAPI face detection + embedding + matching microservice
- **`admin-dashboard/`** — React web app for administrators
- **`employee-app/`** — React Native/Expo Android app for employees (check-in/check-out)

## Quick start

See `docs/DOCUMENTATION.md` Section 17 ("How to Run Everything Locally") for
full step-by-step setup instructions for all four components.

Short version:
```bash
# 1. MongoDB running locally or via Atlas URI

# 2. AI service
cd face-service && pip install -r requirements.txt --break-system-packages
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 3. Backend
cd backend && cp .env.example .env   # edit values
npm install && npm run dev

# 4. Admin dashboard
cd admin-dashboard && npm install && npm run dev

# 5. Employee app (edit employee-app/api/client.js API_BASE_URL first)
cd employee-app && npm install && npx expo start
```
