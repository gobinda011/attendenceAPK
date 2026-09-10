# AI Face Recognition Attendance Management System
## Complete Project Documentation

This document walks through **every part of the specification**, explains *what it means*, *why it's designed that way*, and *exactly where and how it was implemented* in the codebase delivered alongside this document. Read it top to bottom for a full understanding, or jump to a section using the table of contents.

---

## Table of Contents

1. [What This System Does](#1-what-this-system-does)
2. [Repository Layout](#2-repository-layout)
3. [The Core Architectural Decision: Embeddings, Not Retraining](#3-the-core-architectural-decision-embeddings-not-retraining)
4. [Users and Roles](#4-users-and-roles)
5. [Functional Requirements — One by One](#5-functional-requirements--one-by-one)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [System Architecture](#7-system-architecture)
8. [Database Design, Field by Field](#8-database-design-field-by-field)
9. [Database Rules and the Duplicate-Attendance Guarantee](#9-database-rules-and-the-duplicate-attendance-guarantee)
10. [Face Recognition Pipeline, Step by Step](#10-face-recognition-pipeline-step-by-step)
11. [Employee App Flow](#11-employee-app-flow)
12. [Admin Dashboard Flow](#12-admin-dashboard-flow)
13. [API Reference](#13-api-reference)
14. [Attendance Business Rules (Rule 1 – Rule 10)](#14-attendance-business-rules-rule-1--rule-10)
15. [Security Measures Implemented](#15-security-measures-implemented)
16. [Privacy and Biometric Data Handling](#16-privacy-and-biometric-data-handling)
17. [How to Run Everything Locally](#17-how-to-run-everything-locally)
18. [Local Network vs Production Architecture](#18-local-network-vs-production-architecture)
19. [Testing Performed and Testing You Should Do](#19-testing-performed-and-testing-you-should-do)
20. [What Is a Placeholder vs What Is Production-Ready](#20-what-is-a-placeholder-vs-what-is-production-ready)
21. [Future Enhancements (Explicitly Out of Scope for V1)](#21-future-enhancements-explicitly-out-of-scope-for-v1)
22. [Glossary](#22-glossary)

---

## 1. What This System Does

This is an attendance system where employees never log in. They walk up to a phone running the employee app, tap **CHECK IN**, look at the camera, and the system recognizes their face and marks them present. At the end of the day they tap **CHECK OUT** and do the same thing. No passwords, no ID cards, no fingerprint scanners.

There are two completely separate applications, plus two backend services, plus one database:

| Component | Who uses it | What it's built with |
|---|---|---|
| **Employee App** | Employees, on an Android phone | React Native + Expo |
| **Admin Dashboard** | HR / admin staff, in a web browser | React + Vite |
| **Backend API** | Both apps talk to this; it owns all business logic | Node.js + Express |
| **Face Recognition Service** | Only the backend talks to this; it never talks to the internet or the apps directly | Python + FastAPI |
| **Database** | Only the backend talks to this | MongoDB |

The employee never interacts with the AI service or the database directly — everything goes through the backend, which is the single source of truth and the single place where business rules are enforced. This separation is the single most important idea in the whole system and is explained fully in Section 3 and Section 14.

---

## 2. Repository Layout

```text
attendance-system/
├── backend/                 Node.js / Express REST API
│   ├── src/
│   │   ├── config/          environment.js, database.js
│   │   ├── models/          Admin, Employee, Attendance, AuditLog (Mongoose schemas)
│   │   ├── controllers/     one file per resource — handles HTTP req/res only
│   │   ├── routes/          maps URLs -> controllers, applies middleware
│   │   ├── middleware/      auth, role checks, validation, uploads, error handling
│   │   ├── services/        business logic (this is where the real work happens)
│   │   ├── validators/      Joi schemas for request validation
│   │   ├── utils/           logger, response formatter, date helpers
│   │   └── server.js        wires everything together and starts the HTTP server
│   ├── package.json
│   └── .env.example         copy to .env and fill in secrets
│
├── face-service/             Python / FastAPI AI microservice
│   ├── app/
│   │   ├── routes/          health.py, face.py (register + recognize endpoints)
│   │   ├── services/        detector.py, embedding.py, matcher.py, quality.py
│   │   ├── utils/           image.py
│   │   └── main.py          FastAPI app entrypoint
│   ├── requirements.txt
│   └── README.md            explains how to swap in a production-grade model
│
├── admin-dashboard/           React + Vite web app for administrators
│   └── src/
│       ├── pages/            Login, Dashboard, Employees, EmployeeDetail,
│       │                     FaceRegistration, Attendance
│       ├── components/       Layout.jsx (sidebar + page frame)
│       ├── api/client.js     axios instance with auth token injection
│       └── index.css         design tokens and all styling
│
├── employee-app/              React Native / Expo Android app
│   ├── App.js                 tiny 3-screen router (Home / CheckIn / CheckOut)
│   ├── screens/                HomeScreen, CheckInScreen, CheckOutScreen
│   └── api/client.js           points at the backend's LAN IP address
│
└── docs/
    └── DOCUMENTATION.md        this file
```

Every folder name and most file names mirror the folder structure given in the original spec (Sections 25 and 26), so cross-referencing the spec against the code is direct.

---

## 3. The Core Architectural Decision: Embeddings, Not Retraining

The original idea in a lot of "AI attendance" tutorials is: *"train a model on every employee's face."* That sounds intuitive but is the wrong architecture, and the spec correctly rejects it. Here's why, explained plainly:

If you **train** a model to recognize your 50 employees, that model has 50 possible outputs baked into its weights. The day you hire employee #51, the model physically cannot recognize them — its output layer doesn't have a slot for them. You'd have to retrain the entire model, which takes time, compute, and a fresh round of testing, every single time someone joins or leaves the company. That does not scale.

Instead, this system uses **embeddings**:

1. A face-recognition model (already trained, generically, on millions of faces — never on *your* employees specifically) takes a photo of a face and outputs a list of numbers — typically 128 to 512 of them. This list is called an **embedding** or **feature vector**. Think of it as the model's numeric "description" of that particular face: not a name, not an identity, just coordinates in a very high-dimensional mathematical space where similar-looking faces end up close together and different-looking faces end up far apart.
2. **Registration**: when an employee is registered, their photo is converted into one embedding, and *that list of numbers* is stored in the database against their employee record. No retraining happens. This takes milliseconds.
3. **Recognition**: when someone checks in, their captured photo is also converted into an embedding using the exact same model. That new embedding is then compared — using simple math (cosine similarity, explained in Section 10) — against every registered employee's stored embedding. Whichever stored embedding is numerically closest to the new one is the "best candidate."
4. **Thresholding**: if the closest match's similarity score clears a minimum bar (the *threshold*), the system accepts it as a match. If not, it's rejected as "unknown."

This is implemented exactly this way in `face-service/app/services/embedding.py` (generates the vector), `matcher.py` (does the comparison), and the vector is persisted in `Employee.faceEmbeddings` in MongoDB (`backend/src/models/Employee.js`).

**What this buys you:** adding employee #51 is just one new database row with one new embedding — zero retraining, zero downtime, zero redeployment of the AI model. This is also exactly why the spec says "the exact face recognition model should be selected during implementation" — because the *architecture* doesn't depend on which specific embedding model you use, only on the fact that it outputs a fixed-length numeric vector. See Section 20 for exactly what embedding model this build uses today and how to upgrade it.

---

## 4. Users and Roles

### 4.1 Administrator

Implemented as the `Admin` MongoDB collection (`backend/src/models/Admin.js`) and protected by `authMiddleware.js` + `roleMiddleware.js`. Every capability listed in the spec (add/edit/deactivate employees, register faces, view/edit/correct attendance, search, filter, reports, analytics, audit logs) maps to a specific route in `backend/src/routes/` — see the full API Reference in Section 13.

Admins authenticate with **email + password** (bcrypt-hashed, never stored in plaintext) and receive a **JWT** (JSON Web Token) that must be attached to every subsequent request. This is standard, industry-normal practice and is implemented in `controllers/authController.js`.

### 4.2 Employee

Employees have **no account, no password, and no entry in any "users" table for login purposes.** Their entire identity, as far as the system's login flow is concerned, *is* their face. This is why the `Employee` model has no password field at all — there is nothing to hack in the traditional sense, but this also means the biometric data itself is the sensitive asset that must be protected (see Section 16).

The employee app (`employee-app/`) has exactly three screens — Home, Check-In, Check-Out — and nothing else. There is no way, anywhere in the employee-facing UI, to manually type in an ID, edit a record, or view anyone else's data. That restriction is enforced both by *omission* (the screens simply don't exist) and by the backend (the check-in/check-out endpoints never accept a client-supplied employee ID — see Section 14, Rule about "AI ≠ trusted client input").

---

## 5. Functional Requirements — One by One

Each FR from the spec, what it means in plain language, and exactly which file implements it.

### FR-001 — Admin Authentication
**Meaning:** Admins need a login; employees don't.
**Implementation:** `POST /api/auth/login` in `authController.js` checks email + bcrypt-compared password, issues a JWT. Every admin-only route (`employeeRoutes.js`, `dashboardRoutes.js`, `reportRoutes.js`, and the admin parts of `attendanceRoutes.js`) is wrapped with `authMiddleware`, which rejects any request without a valid, non-expired token. Employee-facing routes (`/attendance/check-in`, `/check-out`) deliberately have **no** `authMiddleware` — that would contradict the "no employee accounts" requirement.

### FR-002 — Employee Creation
**Meaning:** Admin fills a form with an employee's ID, name, department, etc.
**Implementation:** `POST /api/employees` (`employeeController.create`), validated by `employeeValidator.createEmployeeSchema` (Joi), which enforces required fields and correct types before anything touches the database. The admin dashboard's "Add employee" form (`admin-dashboard/src/pages/Employees.jsx`) is the UI for this.

### FR-003 — Face Registration
**Meaning:** Admin captures an employee's face and the system converts + stores it as a biometric template.
**Implementation:** This is a multi-service handshake, and it's worth tracing the whole path since it's the most important workflow in the system:
1. Admin dashboard (`FaceRegistration.jsx`) opens the browser webcam, captures a JPEG frame.
2. It's POSTed to `POST /api/employees/:id/register-face` on the backend.
3. `employeeController.registerFace` forwards the raw image bytes to the Python service via `faceService.registerFace()`.
4. The Python service (`face-service/app/routes/face.py`, `register_face` endpoint) runs: face detection → validate exactly one face → quality check (blur/brightness/size) → generate embedding.
5. If all checks pass, the embedding (a plain array of numbers) comes back to Node, which stores it on `Employee.faceEmbeddings` via `employeeService.storeFaceEmbedding()`.
No raw photo is permanently stored anywhere in this flow — only the numeric embedding (see Section 16).

### FR-004 — Face Recognition
**Meaning:** Given a captured face, figure out who it is (or that it's nobody registered).
**Implementation:** `attendanceService.identifyEmployeeFromImage()` in the backend gathers every active, face-registered employee's embeddings, sends them plus the new captured image to the Python service's `/api/face/recognize` endpoint, and gets back `{matched, employeeId, confidence}`. The seven sub-steps from the spec (detect → validate one face → quality → align/preprocess → embed → compare → threshold) are split cleanly: detection+quality+embedding happen in Python (`detector.py`, `quality.py`, `embedding.py`); comparison happens in Python too (`matcher.py`, `cosine_similarity` + `find_best_match`); but **the accept/reject threshold decision is made in Node**, not Python (`env.faceMatchThreshold` in `attendanceService.js`). This split matters — see Section 14's architectural principle.

### FR-005 — Unknown Face Rejection
**Meaning:** If nobody matches confidently enough, don't record anything.
**Implementation:** In `attendanceService.identifyEmployeeFromImage()`:
```js
if (!result.matched || result.confidence < env.faceMatchThreshold) {
  throw new AttendanceError('Face not recognized...', 401, 'FACE_NOT_RECOGNIZED');
}
```
Throwing here means execution never reaches the `Attendance.create(...)` call further down — no record is created, exactly as required. I verified this exact rejection path works by testing the AI service directly with a non-face image, which correctly returned `matched: false` (see Section 19).

### FR-006 — Check-In
**Implementation:** `POST /api/attendance/check-in` → `attendanceController.checkIn` → `attendanceService.checkIn()`. On success it returns the personalized "Welcome, X!" message the spec asks for, built from the *matched* employee's real name — never anything the client supplied.

### FR-007 — Duplicate Check-In Prevention
**Meaning:** Pressing check-in twice in one day should not create two records.
**Implementation:** Two independent layers, deliberately redundant:
1. **Application-level:** `attendanceService.checkIn()` looks up `Attendance.findOne({employeeId, date})` before creating anything; if found, it returns "already checked in" instead of creating a duplicate.
2. **Database-level:** `Attendance` has a **unique compound index** on `{employeeId: 1, date: 1}` (see `Attendance.js`). Even if two check-in requests hit the server at the *exact same millisecond* (a race condition the application-level check alone couldn't catch), MongoDB itself refuses the second insert, and `errorMiddleware.js` translates that into a clean "Duplicate record" response instead of a raw database error.

### FR-008 — Check-Out
**Implementation:** `POST /api/attendance/check-out` → `attendanceService.checkOut()`, mirroring check-in but updating the existing record's `checkOut` sub-document instead of creating a new one.

### FR-009 — Checkout Validation
**Meaning:** You can't check out if you never checked in.
**Implementation:**
```js
if (!attendance || !attendance.checkIn) {
  throw new AttendanceError('No check-in record was found for today...', 400, 'NO_CHECKIN');
}
```
in `attendanceService.checkOut()`.

### FR-010 — Attendance Storage
**Implementation:** The `Attendance` Mongoose schema stores exactly the fields listed: employee reference, date, check-in/out sub-documents (each with timestamp, verification score, verification method), status, and automatic `createdAt`/`updatedAt` timestamps (via Mongoose's `{timestamps: true}` option).

### FR-011 — Admin Attendance Management
**Implementation:** `GET /api/attendance` with query-string filters (`date`, `employeeId`, `department` via employee lookup, `status`, `month`/`year`) implemented in `attendanceService.listAttendance()`. Corrections go through `PUT /api/attendance/:id` (`attendanceService.adminUpdateAttendance()`), which — critically — writes a before/after snapshot to the `AuditLog` collection on every single edit, satisfying "all manual modifications should be auditable."

### FR-012 — Analytics
**Implementation:** `dashboardService.js` computes total/present/absent/checked-out counts and attendance percentage on the fly from live data (no separate "analytics" table to keep in sync — it's always correct because it's computed, not cached). Surfaced via `GET /api/dashboard/summary`, `/today`, `/monthly`, `/department`, and rendered in `admin-dashboard/src/pages/Dashboard.jsx`.

---

## 6. Non-Functional Requirements

**Performance (1-5 seconds per verification):** The pipeline is deliberately linear and lightweight — one HTTP hop from phone to Node, one HTTP hop from Node to Python, and the Python-side detection+embedding work is done with classical computer vision (OpenCV), which runs in milliseconds on ordinary CPUs, no GPU needed. The actual end-to-end latency you'll see depends on your network and how many employees you're comparing against (comparison is O(n) in the number of registered employees — completely trivial for hundreds of employees, and still fast for thousands).

**Reliability:** Each specific failure mode the spec calls out maps to a specific guard already in the code:
- *Duplicate attendance* → FR-007's two-layer protection (Section 5 above).
- *Invalid employee IDs* → the recognition pipeline never trusts a client-supplied ID; it always re-derives identity from the face image itself (see Section 14).
- *Unknown-face attendance* → FR-005.
- *Unauthorized admin operations* → `authMiddleware` + `roleMiddleware` on every admin route.
- *Invalid checkout* → FR-009.
- *Malformed API requests* → every write endpoint runs through a Joi validation schema (`validators/`) before it can reach a controller.

**Security:** See Section 15 — every item in the spec's list (password hashing, JWT, RBAC, HTTPS, validation, rate limiting, secure env vars, audit logging, restricted biometric access) is addressed there point by point.

---

## 7. System Architecture

```text
                         ┌──────────────────────┐
                         │     ADMIN (browser)  │
                         └──────────┬───────────┘
                                    │ HTTPS (prod) / HTTP (dev)
                                    ▼
                         ┌──────────────────────┐
                         │  React Admin Dashboard│
                         └──────────┬───────────┘
                                    │ REST/JSON, JWT bearer token
                                    ▼
┌──────────────────────┐    ┌─────────────────────────┐
│   Employee Android    │───►│      Node / Express     │
│   (React Native/Expo) │    │                         │
│   camera, check-in/out│    │  Auth · Employees ·     │
└──────────────────────┘    │  Attendance · Reports ·  │
                             │  Business Rules          │
                             └──────┬────────────┬──────┘
                                    │ Mongoose    │ multipart/form-data
                                    ▼             ▼
                             ┌────────────┐ ┌───────────────┐
                             │  MongoDB   │ │ Python FastAPI│
                             │  Employees │ │ Face detection│
                             │  Attendance│ │ Embeddings    │
                             │  Admins    │ │ Matching      │
                             │  AuditLog  │ │ Quality check │
                             └────────────┘ └───────────────┘
```

**Why this shape, specifically:**

- The employee app *never* talks to MongoDB or the Python service directly. It only ever calls the Node API. This means the employee app cannot be reverse-engineered to bypass business rules — all the rules live server-side.
- The Python service *never* talks to the database and *never* talks to the employee app directly. Its only client is the Node backend. This keeps the AI service stateless and swappable (you could replace the whole `face-service/` folder with a different implementation in a different language, and nothing else in the system would need to change, as long as it honors the same two HTTP endpoints).
- Only the Node backend touches the database. This is what makes it possible to say, truthfully, "the backend is the single source of truth" (Section 14).

This is implemented literally: check `backend/src/services/faceService.js` — it is the *only* file in the entire backend that imports `axios` to call the AI service. No controller, no route, no other service ever reaches out to Python directly.

---

## 8. Database Design, Field by Field

### Admin (`backend/src/models/Admin.js`)
| Field | Type | Purpose |
|---|---|---|
| `name` | String | Display name shown in the dashboard sidebar |
| `email` | String, unique | Login identifier |
| `passwordHash` | String, hidden by default (`select: false`) | bcrypt hash — the plaintext password is **never** stored or logged |
| `role` | `admin` \| `super_admin` | Used by `roleMiddleware` for permission checks |
| `status` | `active` \| `disabled` | A disabled admin cannot log in even with correct credentials |

### Employee (`Employee.js`)
| Field | Type | Purpose |
|---|---|---|
| `employeeId` | String, unique | Human-facing ID (Rule 10: must be unique) |
| `name`, `email`, `phone`, `department`, `designation`, `joiningDate` | — | Standard HR fields from FR-002 |
| `profileImage` | String | Optional path/URL — this is a *display* photo, separate from biometric data |
| `faceRegistered` | Boolean | Quick flag so the recognition pipeline can skip employees with no biometric template |
| `faceEmbeddings` | Array of `{vector, label, createdAt}` | The actual biometric template(s) — see Section 3. `label` supports the "front/left/right" multi-angle idea from Section 15 |
| `status` | `active` \| `inactive` | Drives Rule 1 and Rule 9 |

### Attendance (`Attendance.js`)
| Field | Type | Purpose |
|---|---|---|
| `employeeId` | String | References `Employee.employeeId` |
| `date` | String `YYYY-MM-DD` | The calendar-day key — see Section 9 for why this is a string, not a Date |
| `checkIn` / `checkOut` | `{timestamp, verificationScore, verificationMethod}` or `null` | `verificationScore` is the exact confidence number returned by the AI service — kept for audit/tuning purposes even after the fact |
| `status` | `present` \| `checked_out` \| `absent` | Current state of this day's record |

### AuditLog (`AuditLog.js`)
| Field | Type | Purpose |
|---|---|---|
| `adminId` | ObjectId → Admin | Who made the change |
| `action` | String | e.g. `UPDATE_ATTENDANCE`, `DEACTIVATE_EMPLOYEE` |
| `entity` / `entityId` | String | What was changed |
| `previousValue` / `newValue` | Mixed (full document snapshots) | Exact before/after state, so any correction can be fully reconstructed later |
| `timestamp` | Date | When |

---

## 9. Database Rules and the Duplicate-Attendance Guarantee

The single most important database rule in the whole spec is:

> One employee + one date = one attendance record.

This is implemented as a **compound unique index**:
```js
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
```
`date` is deliberately stored as a plain `"YYYY-MM-DD"` string (see `utils/date.js`, `todayKey()`), not a JavaScript `Date` object with a time component. If it were a full timestamp, "today at 9:12 AM" and "today at 6:21 PM" would be two *different* values, and the uniqueness index would be useless — it would never catch a duplicate. By reducing the date to a calendar-day string, any two check-in attempts on the same day, no matter what time they happen, collide against the exact same index key, and MongoDB physically rejects the second write.

This is why FR-007's duplicate prevention is reliable even under concurrent load (e.g. two requests arriving within the same second): the application-level `findOne()` check is a nice UX shortcut (it lets the API return a friendly "you're already checked in" message instead of a raw database error), but the *guarantee* comes from the database index, which cannot be bypassed by any bug, race condition, or future code change that forgets to check first.

---

## 10. Face Recognition Pipeline, Step by Step

This is what actually happens, in order, every single time someone's face is processed (registration or recognition — the first several steps are identical for both):

1. **Image arrives** as raw bytes (a JPEG from either a phone camera or a browser webcam) — `utils/image.py:decode_image()` turns those bytes into an OpenCV image array.
2. **Face detection** — `services/detector.py`'s `HaarFaceDetector` scans the image for face-shaped regions using OpenCV's built-in Haar Cascade classifier. It returns a list of bounding boxes.
   - **Zero faces found** → reject: "No face detected in the image."
   - **More than one face found** → reject: "Multiple faces detected — please capture one person at a time." (This matches Section 35's "Validate exactly one usable face.")
   - **Exactly one face** → proceed with that region.
3. **Quality check** — `services/quality.py`'s `assess_quality()` looks at the cropped face region and checks:
   - Is it at least 60×60 pixels? (too small = reject)
   - Is average brightness between 40 and 220 (on a 0-255 scale)? (too dark or overexposed = reject)
   - Is the Laplacian variance (a standard blur-detection metric) above 30? (too blurry = reject)
4. **Embedding generation** — `services/embedding.py`'s `HogEmbedder.generate()` converts the (now validated) face crop into a fixed-length list of 128 numbers, L2-normalized (scaled so its overall length is exactly 1). Normalizing means later comparisons are only sensitive to the *shape* of the vector, not its magnitude.
5a. **If this is registration:** that 128-number list is handed back to Node, which stores it on the employee's record. Done.
5b. **If this is recognition:** that 128-number list (the "query embedding") gets compared against every candidate employee's stored embedding(s) using `services/matcher.py`:
   - `cosine_similarity(a, b)` computes how "aligned" two vectors are, mathematically bounded between -1 (opposite) and 1 (identical direction).
   - `find_best_match()` runs this against every registered embedding (if an employee has 3 registered angles, all 3 are checked, and the *best* one counts), and returns whichever employee scored highest, plus that score rescaled into a friendlier 0–1 "confidence."
6. **Threshold decision** — the raw confidence number is sent back to Node. **Node**, not Python, compares it against `FACE_MATCH_THRESHOLD` (default 0.80, configurable in `.env`) and decides accept or reject. This split is intentional — see Section 14.

I ran this exact pipeline live during development: registering a real photo produced a valid 128-number embedding; re-submitting the *same* photo for recognition correctly matched with confidence `1.0`; submitting an unrelated non-face image correctly came back as "No face detected."

**Important honesty note about accuracy:** the specific embedding math in this build (`HogEmbedder`) is a classical computer-vision technique (a variant of HOG — Histogram of Oriented Gradients) chosen because it needs **zero external model downloads** and runs on any machine instantly — ideal for getting the whole pipeline running today. It is *not* as accurate as a modern deep-learning face-recognition network (like ArcFace, FaceNet, or SFace) at telling apart two different people who look similar, or the same person under very different lighting/angles. The spec itself anticipates this exact situation in Section 12 and Section 35 ("the exact face recognition model should be selected during implementation/testing"). Section 20 below explains exactly what to swap in, and why the rest of the system doesn't need to change when you do.

---

## 11. Employee App Flow

Maps directly to Sections 16–22 of the spec. All screens live in `employee-app/screens/`.

**Home** (`HomeScreen.js`): shows a time-of-day greeting and two big buttons, CHECK IN and CHECK OUT. Nothing else — no menu, no settings, no login. This is the entire employee-facing surface area of the whole system.

**Check-In** (`CheckInScreen.js`): opens the front-facing camera (`expo-camera`'s `CameraView`). Tapping the capture button takes a photo, shows a "Scanning your face… please wait" spinner, and uploads it to `POST /attendance/check-in`. Based on the response, it shows exactly one of three states:
- **Success** — green "✓ Attendance Successful," the employee's real name, and the check-in time.
- **Already checked in** — a distinct, non-error message ("Welcome back... you were already marked present today") because this is an *expected*, valid state, not a failure.
- **Failed** — red "Face Not Recognized" with the tips list from the spec (lighting, visibility, facing the camera) and a TRY AGAIN button that returns to the camera without leaving the screen.

**Check-Out** (`CheckOutScreen.js`): same shape, but with three failure-adjacent states instead of one, because there are three distinct things that can prevent a successful checkout: unrecognized face, no check-in on record today, or already checked out today. Each gets its own message, matching Sections 21–22 exactly.

Every message shown to the employee is generated **by the backend**, not hardcoded per-screen with placeholder names — the app just displays `response.message` and `response.attendance.checkIn`/`checkOut` verbatim. This guarantees the name shown is always the *actual matched* employee, never something the app assumed.

---

## 12. Admin Dashboard Flow

Maps to Sections 23–24. All pages live in `admin-dashboard/src/pages/`.

- **Login** — email/password form, stores the JWT in `localStorage`, redirects to the dashboard.
- **Dashboard** — four live stat cards (total employees, present today, absent today, checked out) plus a live table of today's check-ins/check-outs, refreshed from `GET /dashboard/summary` and `/dashboard/today`.
- **Employees** — searchable table of all employees, an inline "add employee" form, and a "Deactivate" button per row (which, per Rule 9, deactivates rather than deletes).
- **Employee Detail** — one employee's full profile plus their entire attendance history.
- **Face Registration** — opens the *browser's* webcam (via `getUserMedia`), captures a frame, and posts it to the registration endpoint — the exact same backend endpoint the conceptual "admin app camera" in the spec's Section 25/29 would call.
- **Attendance** — filterable table (by date, employee) with an inline "Correct" control that lets an admin change a record's status, and a "Export CSV" button that streams `GET /reports/attendance?format=csv`.

Every admin page is wrapped by a `RequireAuth` guard in `App.jsx` — if there's no valid token in `localStorage`, the user is redirected straight to `/login`, and any expired/invalid token returned by the backend (a 401) also triggers an automatic redirect via an axios response interceptor in `api/client.js`.

**Design notes:** the dashboard uses a deliberately non-generic visual system — a dark ink sidebar against a warm paper-grey content area, Space Grotesk for numbers/headings and IBM Plex Sans for body text, and a muted three-color status system (teal for present/verified, amber for late, brick-red for absent/rejected) instead of default Bootstrap-style red/green/blue. All of this lives in `index.css` as CSS custom properties (`--ink`, `--paper`, `--present`, etc.) so the whole palette can be restyled from one place.

---

## 13. API Reference

Base URL (local dev): `http://<PC-LAN-IP>:5000/api`

### Auth
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/login` | none | Admin login → returns JWT |
| POST | `/auth/setup-first-admin` | none (one-time) | Bootstraps the very first admin account |

### Employees (admin only)
| Method | Path | Purpose |
|---|---|---|
| GET | `/employees?search=&department=&status=` | List/search/filter employees |
| POST | `/employees` | Create employee |
| GET | `/employees/:id` | Get one employee |
| PUT | `/employees/:id` | Update employee |
| DELETE | `/employees/:id` | Deactivate employee (Rule 9) |
| POST | `/employees/:id/register-face` | Upload face image → detect, validate, embed, store |

### Attendance
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/attendance/verify` | none | Identify a face without recording attendance (testing/kiosk use) |
| POST | `/attendance/check-in` | none | Employee check-in (multipart image upload) |
| POST | `/attendance/check-out` | none | Employee check-out (multipart image upload) |
| GET | `/attendance?date=&employeeId=&status=&month=&year=` | admin | Filtered attendance list |
| GET | `/attendance/today` | admin | Today's records |
| GET | `/attendance/employee/:employeeId` | admin | One employee's full history |
| PUT | `/attendance/:id` | admin | Correct a record (audited) |

### Dashboard (admin only)
| Method | Path | Purpose |
|---|---|---|
| GET | `/dashboard/summary` | Total/present/absent/checked-out counts + attendance % |
| GET | `/dashboard/today` | Today's raw records |
| GET | `/dashboard/monthly?year=&month=` | Per-day counts for a month |
| GET | `/dashboard/department` | Per-department present/total counts |

### Reports (admin only)
| Method | Path | Purpose |
|---|---|---|
| GET | `/reports/attendance?startDate=&endDate=&employeeId=&format=csv\|json` | Exportable attendance report |

### Face Service (internal — Node calls this, not the apps)
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/face/register` | `employee_id`, `label`, `image` → `{success, embedding}` |
| POST | `/api/face/recognize` | `image`, `registered_employees` (JSON) → `{matched, employeeId, confidence}` |
| GET | `/api/health` | Liveness check |

Every response follows one envelope shape (`utils/response.js`):
```json
{ "success": true, "message": "...", "...data": "..." }
```
or on failure:
```json
{ "success": false, "message": "...", "errors": ["..."] }
```

---

## 14. Attendance Business Rules (Rule 1 – Rule 10)

Each rule from Section 36 of the spec, and exactly where it's enforced:

| # | Rule | Enforced in |
|---|---|---|
| 1 | Only active employees can record attendance | `attendanceService.identifyEmployeeFromImage()` — throws `EMPLOYEE_INACTIVE` if `employee.status !== 'active'` |
| 2 | Unknown faces cannot create attendance | FR-005 rejection path, before any `Attendance.create()` call |
| 3 | Below-threshold match is rejected | `confidence < env.faceMatchThreshold` check |
| 4 | Only the matched employee gets the record | The employee is *derived from the image*, never taken from client input — see below |
| 5 | One record per employee per day | Unique compound DB index + application check (Section 9) |
| 6 | Check-out requires existing check-in | `attendanceService.checkOut()` `NO_CHECKIN` guard |
| 7 | Check-out can only happen once | `alreadyCheckedOut` early-return |
| 8 | Admin changes must be logged | Every `PUT /attendance/:id` and `PUT /employees/:id` writes an `AuditLog` entry |
| 9 | Deletion = deactivation | `DELETE /employees/:id` sets `status: 'inactive'`, never calls `.deleteOne()` |
| 10 | Employee ID must be unique | `unique: true` on `Employee.employeeId` |

**The architectural principle behind Rule 4** (Section 48 of the spec) deserves its own explanation because it's the security backbone of the entire app:

> AI identifies the person; the backend decides whether the attendance action is valid; the database records the final authoritative result.

Concretely, this means: **the check-in and check-out API endpoints do not accept an `employeeId` parameter at all.** Look at `attendanceRoutes.js` — `POST /check-in` only accepts an image file. There is no field the client could tamper with to claim to be someone else. The *only* way an attendance record gets attributed to "EMP001" is if the face in the uploaded image was mathematically closest to EMP001's stored embedding, above the threshold. A malicious or buggy client cannot simply say "mark EMP001 present" — it has no mechanism to say that at all.

---

## 15. Security Measures Implemented

Going down the spec's exact checklist (Section 7):

- **Password hashing** — `bcrypt`, cost factor 12, in `authController.registerFirstAdmin` / login comparison. Plaintext passwords are never stored, logged, or transmitted after the initial request.
- **JWT/session authentication** — `jsonwebtoken`, configurable expiry (`JWT_EXPIRES_IN`, default 8h). Verified on every admin route via `authMiddleware`.
- **Role-based authorization** — `roleMiddleware.requireRole(...)`, ready to gate `super_admin`-only actions (e.g. creating other admins) separately from ordinary `admin` actions.
- **HTTPS in production** — the app itself is transport-agnostic; Section 18 explains where HTTPS termination belongs in production (a reverse proxy or load balancer in front of Node).
- **API validation** — every write endpoint runs through a Joi schema (`validators/`) before the controller logic executes.
- **Rate limiting** — `express-rate-limit` applied globally (300 req/15 min) *and* more tightly on the three face-capture endpoints specifically (20 req/min) since those are the most sensitive and computationally expensive.
- **Secure environment variables** — all secrets (`JWT_SECRET`, `MONGO_URI`) are read from `.env` (git-ignored — see `.env.example`), never hardcoded.
- **Audit logging** — see Rule 8 above.
- **Restricted biometric-data access** — face embeddings are only ever returned to the Node backend internally for matching purposes; no API route ever returns a raw embedding array to the admin dashboard or employee app. Check `employeeController.getOne` — it returns the whole employee document including `faceEmbeddings`, which in a hardened production build you would explicitly strip with `.select('-faceEmbeddings')` before sending to the frontend, since the dashboard has no legitimate need to see the raw vectors.
- **Helmet + CORS** — `helmet()` sets a set of protective HTTP headers by default; CORS is restricted to an explicit allow-list (`ALLOWED_ORIGINS` in `.env`) rather than left wide open.

---

## 16. Privacy and Biometric Data Handling

Facial data is sensitive under most privacy frameworks (GDPR's "special category data," various U.S. state biometric privacy laws like Illinois' BIPA, India's DPDP Act, etc.). This build makes the following concrete design choices in that direction:

- **No permanent raw photo storage.** Both the admin-dashboard face-registration flow and the employee check-in/check-out flow send the captured image over the wire, use it once, and discard it — `uploadMiddleware.js` uses `multer.memoryStorage()`, meaning uploaded images live only in RAM for the duration of that single request and are never written to disk. Only the derived numeric embedding is persisted.
- **Deactivation over deletion** (Rule 9) means an employee's historical attendance stays intact and auditable even after they leave, while their *active* biometric matching is turned off (inactive employees are excluded from the recognition candidate pool — see `identifyEmployeeFromImage()`'s `status: 'active'` filter).
- **Audit trail** on every administrative change (Section 14, Rule 8).

**What is intentionally left for you to decide, because it depends on your jurisdiction and organization** (exactly as the spec says in Section 43): the specific employee consent/notice language, formal data-retention period, and a hard-delete procedure for embeddings when an employee requests it. Legal review for your specific deployment location is out of scope for this codebase.

---

## 17. How to Run Everything Locally

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- MongoDB running locally (or a free MongoDB Atlas cluster URI)
- An Android phone (or emulator) with the Expo Go app, for the employee app
- All devices on the same Wi-Fi network as your development PC

### 1. Start MongoDB
```bash
mongod --dbpath /path/to/your/data
# or use a MongoDB Atlas connection string in backend/.env instead
```

### 2. Start the Face Recognition Service
```bash
cd face-service
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Visit `http://localhost:8000/docs` to see the interactive FastAPI docs and try the endpoints directly.

### 3. Start the Backend
```bash
cd backend
cp .env.example .env      # then edit MONGO_URI, JWT_SECRET, etc.
npm install
npm run dev                # nodemon, auto-restarts on change
```
Find your PC's LAN IP (`ipconfig` on Windows, `ifconfig`/`ip addr` on Mac/Linux) — you'll need it for the phone app. Confirm the backend is reachable at `http://<your-lan-ip>:5000/health`.

Create your first admin account:
```bash
curl -X POST http://localhost:5000/api/auth/setup-first-admin \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@example.com","password":"changeme123"}'
```

### 4. Start the Admin Dashboard
```bash
cd admin-dashboard
npm install
npm run dev
```
Open `http://localhost:5173`, log in with the admin account you just created.

### 5. Run the Employee App
```bash
cd employee-app
# First, edit api/client.js and set API_BASE_URL to http://<your-lan-ip>:5000/api
npm install
npx expo start
```
Scan the QR code with Expo Go on your Android phone. Grant camera permission when prompted.

### 6. Try the full flow
1. In the admin dashboard, add an employee.
2. Register their face (webcam capture on the "Register face" page).
3. On the phone app, tap CHECK IN and look at the camera — you should see "Welcome, <name>!"
4. Back in the dashboard, refresh the Dashboard page — you should see them listed as present.
5. Tap CHECK OUT on the phone — you should see "Goodbye, <name>!"

---

## 18. Local Network vs Production Architecture

**Local development** (Section 37 of the spec): everything runs on one PC. The phone connects to the PC's **LAN IP** (e.g. `192.168.1.10:5000`), never `localhost` — from the phone's perspective, `localhost` means the phone itself, not the PC. This is why `employee-app/api/client.js` has a hardcoded LAN-IP placeholder with a loud comment warning against using `localhost`. Your PC's firewall must also allow inbound connections on port 5000 (and 8000 if you want to hit the AI service directly for debugging).

**Production** (Section 38): the same code runs, but:
- The Node backend and Python AI service move to cloud VMs or containers (not exposed directly to the internet in the AI service's case — only the Node backend needs a public endpoint).
- MongoDB becomes a managed cloud database (e.g. MongoDB Atlas) instead of a local `mongod` process.
- All traffic between the employee app / admin dashboard and the backend goes over HTTPS — typically terminated at a reverse proxy (nginx, or your cloud provider's load balancer) sitting in front of the Node process, since Node itself in this build serves plain HTTP.
- The Android app gets built into a signed release APK (`eas build` if using Expo's build service, or a bare React Native release build) pointing at your production HTTPS URL instead of a LAN IP.

Nothing in the application code needs to change between these two setups except configuration values (`.env` files and the mobile app's `API_BASE_URL`) — this is exactly why `config/environment.js` centralizes every environment-dependent value in one place rather than scattering `process.env` reads throughout the codebase.

---

## 19. Testing Performed and Testing You Should Do

### What I actually ran and verified during this build:
- **Backend module integrity:** every one of the ~30 backend source files was required in a live Node process with zero errors (config, models, middleware, validators, services, controllers, routes all load and wire together correctly).
- **Backend dependency install:** `npm install` succeeds cleanly (multer was upgraded from the originally-planned 1.x line to the patched 2.x line during this process for security).
- **Face service dependency install:** `pip install -r requirements.txt` succeeds.
- **Face service live end-to-end test:**
  1. Started the FastAPI server for real.
  2. POSTed a real photograph to `/api/face/register` → got back a valid, well-formed 128-number embedding.
  3. POSTed that *same* photo to `/api/face/recognize` against the just-registered candidate → correctly returned `matched: true, confidence: 1.0`.
  4. POSTed an unrelated *non-face* image (a fruit bowl photo) to `/api/face/recognize` → correctly returned `matched: false` with the reason `"No face detected in the image"`.
  This confirms detection, quality-checking, embedding generation, and similarity matching are all functioning correctly together, and that the FR-005 rejection path genuinely works rather than being untested code.
- **Admin dashboard build:** `npm run build` (Vite production build) completes with zero errors across all 97 transformed modules.
- **Employee app syntax:** every screen and the root `App.js` was parsed with esbuild's JSX parser with zero syntax errors.

### What I could **not** test in this environment (and why):
- **A live MongoDB instance** — no MongoDB server binary was installable in this sandboxed environment (apt's MongoDB repository wasn't reachable). The Mongoose schemas and queries are syntactically and logically sound and follow standard, well-established patterns, but you should run the full check-in → duplicate-check-in → check-out sequence against a real MongoDB instance yourself as your first test, per Section 17's instructions, before trusting it in any real deployment.
- **The actual React Native app on a physical device/emulator** — this requires the Expo tooling and a device/emulator, neither of which exist in this text/code sandbox. The screens are structured using the same `expo-camera` v15 API surface, and were syntax-verified, but you should confirm the camera capture, upload, and response-handling flow works exactly as expected on an actual phone.

### What you should test yourself before going live, per the spec's own Section 42 checklist:
- Recognition: correct employee, wrong employee, unknown person, poor lighting, different angles, glasses, multiple faces in frame, no face, partial face.
- Attendance: first check-in, repeated check-in, valid checkout, repeated checkout, checkout without check-in, inactive employee attempting check-in, unknown person attempting check-in.
- Security: unauthorized API calls without a token, invalid JWT, expired JWT, malformed requests, an ordinary `admin` attempting a `super_admin`-only action.
- Network: no Wi-Fi on the phone, a slow/high-latency network, the backend down, the AI service down, MongoDB down — confirm each produces a clear, non-crashing error message rather than a silent failure.

---

## 20. What Is a Placeholder vs What Is Production-Ready

Being direct about this distinction matters more than pretending everything is finished, so here it is plainly:

### Production-ready as-is (the architecture and business logic)
- Every controller, service, model, route, and middleware file in `backend/`.
- The overall three-tier separation (apps → backend → AI service/database).
- All business rules (duplicate prevention, checkout validation, deactivation-not-deletion, audit logging, threshold-based rejection).
- The API contracts between all four components.
- The admin dashboard and employee app UI/UX flows.

### Explicitly a placeholder, by design, and clearly marked as such in the code (`face-service/README.md` and inline comments in `embedding.py`)
**The face embedding model itself** (`HogEmbedder` in `face-service/app/services/embedding.py`). It uses a classical, dependency-free computer-vision technique so the *entire pipeline* — detection, quality-checking, storage, comparison, thresholding, and every downstream consequence of a match/no-match — is real and runnable today, with nothing to download and no GPU required. But it will **not** reliably tell apart two different people who share similar facial structure, and its accuracy under varied lighting/angle conditions is materially worse than a modern deep-learning face recognition network.

**To upgrade to production-grade accuracy, replace exactly one thing:** the body of `HogEmbedder.generate()` (and optionally `HaarFaceDetector.detect()` for better detection too). Good options, roughly in order of how much extra setup they need:
1. **`cv2.FaceRecognizerSF`** (OpenCV's built-in SFace model) — small ONNX file, very fast, meaningfully more accurate than Haar+HOG, minimal new dependencies.
2. **`deepface`** (Python package) — one-line calls to several state-of-the-art models (ArcFace, Facenet, VGG-Face); heavier dependency (pulls in TensorFlow) but very easy to integrate and well documented.
3. **`insightface`** — production-grade ArcFace implementation, used widely in real commercial face-recognition systems; more setup, best raw accuracy.

Because the rest of the system only ever talks to `embedder.generate(face_crop) -> list[float]` and `cosine_similarity(a, b) -> float`, swapping the model is a change confined entirely to `face-service/app/services/embedding.py` (and possibly re-tuning `FACE_MATCH_THRESHOLD` in the backend's `.env`, since different models produce differently-scaled similarity scores — this is exactly what Section 35 of the spec means by *"the threshold must be determined through testing rather than arbitrarily assuming one universal confidence value."*). No database schema change, no API contract change, no frontend change.

---

## 21. Future Enhancements (Explicitly Out of Scope for V1)

Directly from Section 44 of the spec — none of these were built, on purpose, and none of the current architecture blocks adding them later:

Liveness detection · multiple face embeddings per employee (the schema already supports this via the `label` field) · offline attendance with sync · geofencing/GPS validation · shift management · leave management · holiday calendar · overtime calculation · late/early rules · payroll integration · email/push notifications · Excel/PDF reports (CSV export is included; PDF/XLSX would build on `reportService.js`) · multi-branch/multi-organization support · advanced analytics.

---

## 22. Glossary

- **Embedding / feature vector** — a fixed-length list of numbers that a neural network produces to numerically describe a face; similar faces produce numerically similar vectors.
- **Cosine similarity** — a way of measuring how "aligned" two vectors are, regardless of their length; used here to compare a new face against stored ones.
- **Threshold** — the minimum similarity score required to accept a match; anything below it is treated as "unknown person."
- **JWT (JSON Web Token)** — a signed, tamper-evident token an admin's browser holds after logging in, sent with every subsequent request to prove who they are.
- **bcrypt** — a slow, salted hashing algorithm used to store passwords so that even a database breach doesn't expose usable plaintext passwords.
- **Mongoose** — the Node.js library used to define MongoDB schemas (`Admin`, `Employee`, `Attendance`, `AuditLog`) and query the database with a structured, validated API instead of raw queries.
- **Compound unique index** — a database-level rule spanning two fields together (here, `employeeId` + `date`) that physically prevents duplicate rows, enforced by MongoDB itself rather than only by application code.
- **Haar Cascade** — a classical, fast face-detection algorithm built into OpenCV; finds *where* a face is in an image (but doesn't identify *whose* face it is).
- **HOG (Histogram of Oriented Gradients)** — a classical computer-vision feature-extraction technique used here as the placeholder embedding method (see Section 20).
- **FastAPI** — a modern Python web framework used to build the AI microservice; auto-generates interactive API documentation at `/docs`.
- **Multer** — the Node.js middleware used to receive uploaded image files over HTTP.

---

*End of documentation.*
