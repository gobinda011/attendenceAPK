# Admin TOTP 2FA — Complete Implementation Documentation

**Project:** Attendance Management System  
**Branch:** `feature/admin-totp-2fa`  
**Scope:** Admin dashboard authentication only  
**Authentication method:** TOTP (Time-based One-Time Password)  
**Status:** Implemented and tested locally

---

## 1. Purpose

The Attendance Management System previously authenticated administrators using email and password only.

This update adds a second authentication factor using a TOTP authenticator application such as:

- Google Authenticator
- Aegis
- Microsoft Authenticator
- Other RFC-compatible TOTP applications

Employees do not use this admin authentication flow. The employee application continues to use the existing attendance/check-in/check-out flow.

The new security model is:

```text
Admin Email + Password
        |
        v
Is 2FA enabled?
   |            |
  No           Yes
   |            |
   v            v
Issue JWT   Create short-lived
            2FA challenge
                 |
                 v
          Enter 6-digit TOTP
                 |
                 v
            Verify TOTP
                 |
                 v
             Issue JWT
                 |
                 v
          Admin Dashboard
```

---

# 2. What Was Added

The implementation includes:

- TOTP enrollment
- QR-code generation
- Encrypted TOTP secret storage
- TOTP verification during login
- Short-lived 2FA login challenge
- 2FA status endpoint
- Security settings page
- Enable 2FA UI
- Disable 2FA UI
- Password + TOTP verification before disabling
- Recovery-code generation
- Recovery-code hashing and storage
- Pending setup expiration
- AES-256-GCM encryption for TOTP secrets
- Dedicated environment variable for encryption
- Frontend login flow supporting the second factor

---

# 3. Important Packages

Backend packages added for the 2FA implementation:

```text
otplib
qrcode
express-rate-limit
```

Purpose:

| Package | Purpose |
|---|---|
| `otplib` | TOTP secret generation and code verification |
| `qrcode` | Converts the TOTP provisioning URI into a QR code |
| `express-rate-limit` | Rate-limiting support |
| Node `crypto` | Encryption, hashing, random values and timing-safe comparison |

---

# 4. Backend File Changes

The main backend files involved are:

```text
backend/src/
├── config/
│   └── environment.js
│
├── controllers/
│   └── authController.js
│
├── models/
│   └── Admin.js
│
├── routes/
│   └── authRoutes.js
│
├── services/
│   └── twoFactorService.js
│
└── utils/
    ├── crypto.js
    └── twoFactorChallenge.js
```

---

# 5. Admin Database Model

The existing administrator model was extended with a `twoFactor` object.

Conceptually:

```text
Admin
├── name
├── email
├── passwordHash
├── role
├── status
├── createdAt
├── updatedAt
└── twoFactor
    ├── enabled
    ├── secret
    ├── pendingSecret
    ├── pendingExpiresAt
    ├── recoveryCodes[]
    │   ├── codeHash
    │   └── usedAt
    └── enabledAt
```

## 5.1 `enabled`

```text
Boolean
default: false
```

Determines whether the administrator must provide a TOTP code during login.

---

## 5.2 `secret`

The actual TOTP secret is stored in encrypted form.

It is not stored as plaintext.

The value is encrypted using AES-256-GCM.

---

## 5.3 `pendingSecret`

During enrollment, the generated secret is temporarily stored here.

It is used until the administrator proves that the authenticator application was configured correctly.

After successful verification:

```text
pendingSecret
      |
      v
secret
```

and the pending value is cleared.

---

## 5.4 `pendingExpiresAt`

The setup process has a limited lifetime.

If the administrator starts enrollment but does not verify it before expiration, the pending setup is rejected and cleared.

Current setup lifetime:

```text
10 minutes
```

---

## 5.5 `recoveryCodes`

Recovery codes are generated during successful enrollment.

Only hashes of the codes are stored.

Each record contains:

```text
codeHash
usedAt
```

A recovery code is intended to be single-use.

---

## 5.6 `enabledAt`

Stores the timestamp at which 2FA was successfully enabled.

---

# 6. TOTP Secret Encryption

File:

```text
backend/src/utils/crypto.js
```

Algorithm:

```text
AES-256-GCM
```

Parameters:

```text
Key: 32 bytes
IV: 12 bytes
Authentication tag: 16 bytes
```

Stored encrypted format:

```text
IV : AuthenticationTag : Ciphertext
```

The encryption key is supplied through:

```text
TOTP_ENCRYPTION_KEY
```

The key must be a 32-byte hexadecimal value.

## Important

The real `.env` file must never be committed.

The project `.gitignore` excludes `.env`.

Do not expose the following in source control:

- TOTP encryption key
- JWT secret
- database credentials
- passwords
- API keys
- access tokens

---

# 7. TOTP Service

File:

```text
backend/src/services/twoFactorService.js
```

Responsibilities include:

### Create setup

Generates a TOTP secret and provisioning URI.

```text
createTotpSetup(email)
```

The provisioning information identifies the application and administrator account.

---

### Verify TOTP

```text
verifyTotp(secret, token)
```

The supplied six-digit authenticator code is checked against the secret.

---

### Encrypt/decrypt secret

The service uses the crypto utility to encrypt and decrypt the TOTP secret.

---

### Generate recovery codes

The service generates random recovery codes.

The plaintext codes are returned only at enrollment time.

---

### Hash recovery codes

Recovery codes are hashed using SHA-256 before being stored.

---

### Verify recovery codes

The service includes comparison logic using timing-safe comparison.

---

# 8. QR Code Flow

The setup flow is:

```text
Administrator
     |
     v
Security Page
     |
     v
Enable 2FA
     |
     v
Backend generates TOTP secret
     |
     v
Secret encrypted
     |
     v
Pending secret stored
     |
     v
Provisioning URI generated
     |
     v
QR code generated
     |
     v
Frontend displays QR
     |
     v
Authenticator scans QR
     |
     v
Authenticator generates 6-digit code
     |
     v
Administrator enters code
     |
     v
Backend verifies code
```

After successful verification, 2FA becomes enabled.

---

# 9. 2FA Challenge

File:

```text
backend/src/utils/twoFactorChallenge.js
```

When the administrator enters a valid email/password combination and 2FA is enabled, the server does not immediately issue the normal admin JWT.

Instead it creates a special JWT challenge.

The challenge contains:

```text
id
type: "2fa_pending"
```

Current challenge lifetime:

```text
5 minutes
```

The challenge is intentionally different from the final authentication token.

The frontend receives:

```json
{
  "requiresTwoFactor": true,
  "challengeToken": "...",
  "admin": {
    "id": "...",
    "name": "...",
    "role": "admin"
  }
}
```

The challenge token is then sent to the dedicated 2FA verification endpoint.

---

# 10. Admin Login Flow

## Step 1 — Email and password

Frontend sends:

```http
POST /api/auth/login
```

Body:

```json
{
  "email": "admin@example.com",
  "password": "..."
}
```

---

## Step 2 — Backend validates credentials

The backend:

1. Finds the administrator.
2. Confirms the account is active.
3. Compares the password using bcrypt.
4. Checks the administrator's 2FA status.

---

## Step 3A — 2FA disabled

If:

```text
twoFactor.enabled === false
```

the backend issues the normal JWT.

---

## Step 3B — 2FA enabled

If:

```text
twoFactor.enabled === true
```

the backend creates the short-lived challenge.

No final admin JWT is issued yet.

---

# 11. Login 2FA Verification

Endpoint:

```http
POST /api/auth/2fa/verify
```

Body:

```json
{
  "challengeToken": "...",
  "token": "123456"
}
```

Backend process:

```text
Receive challenge
      |
      v
Verify challenge signature
      |
      v
Check challenge type
      |
      v
Check expiration
      |
      v
Find active admin
      |
      v
Load encrypted TOTP secret
      |
      v
Decrypt secret
      |
      v
Verify 6-digit TOTP
      |
      v
If valid → issue final admin JWT
```

The final JWT is then stored by the frontend as:

```text
admin_token
```

---

# 12. Frontend Login Changes

File:

```text
admin-dashboard/src/pages/Login.jsx
```

The login screen now has two stages.

### Stage 1

```text
Email
Password
Sign in
```

### Stage 2

When the backend responds with:

```text
requiresTwoFactor: true
```

the frontend displays:

```text
Two-factor authentication

Authenticator code
[ 000000 ]

Verify and sign in
```

The challenge token remains in frontend state during the flow.

After successful verification, the final admin JWT is saved.

---

# 13. Security Page

File:

```text
admin-dashboard/src/pages/Security.jsx
```

The page is available through:

```text
/security
```

The sidebar contains:

```text
Dashboard
Employees
Attendance
Security
```

The Security page obtains the actual 2FA state from the backend.

Endpoint:

```http
GET /api/auth/2fa/status
```

Example response:

```json
{
  "enabled": true
}
```

Therefore the UI does not rely on hard-coded state.

---

# 14. Enabling 2FA

Endpoint:

```http
POST /api/auth/2fa/setup
```

Requires an authenticated administrator.

The response contains the QR code and expiration information.

The frontend displays the QR code.

The administrator scans it using an authenticator application.

---

# 15. Confirming 2FA Enrollment

Endpoint:

```http
POST /api/auth/2fa/setup/verify
```

Body:

```json
{
  "token": "123456"
}
```

If the token is valid:

```text
twoFactor.enabled = true
```

The pending secret becomes the active encrypted secret.

Recovery codes are generated.

The recovery codes are returned once.

---

# 16. Recovery Codes

Recovery codes are backup credentials.

They exist for the situation where an administrator cannot access the authenticator application.

Example concept:

```text
A91F72B8C1
3E6D90A4F2
...
```

Each code is intended to be used once.

The database stores hashes rather than plaintext codes.

The plaintext codes are shown during successful 2FA enrollment.

Important:

The current implementation generates and stores recovery codes, but the login flow still needs a dedicated recovery-code login endpoint/UI before recovery codes can be used as an alternate login factor.

That should be treated as a future hardening/feature task rather than assuming it is already implemented.

---

# 17. Disabling 2FA

Endpoint:

```http
POST /api/auth/2fa/disable
```

The administrator must provide:

```json
{
  "password": "...",
  "token": "123456"
}
```

Both are verified.

The backend then clears:

```text
enabled
secret
pendingSecret
pendingExpiresAt
recoveryCodes
enabledAt
```

The administrator can subsequently log in using only the password.

---

# 18. Why the Authenticator Entry Can Remain After Disabling

Disabling 2FA on the Attendance System does not automatically remove the entry from Google Authenticator or Aegis.

The authenticator application has its own local copy of the TOTP secret.

Therefore:

```text
Attendance System
       |
       X  secret removed
       |
MongoDB
```

while:

```text
Google Authenticator
       |
       └── old TOTP entry still exists
```

The old entry must be manually removed from the authenticator application.

This does not mean the Attendance System still has 2FA enabled.

---

# 19. Security Properties

The implementation provides the following protections:

### Password protection

Administrator passwords continue to use bcrypt.

### Secret encryption

TOTP secrets are encrypted using AES-256-GCM.

### Environment-based key

The encryption key is supplied through environment configuration.

### Short-lived challenge

The login challenge expires after five minutes.

### Purpose-specific challenge

The challenge contains:

```text
type: "2fa_pending"
```

and is verified by the dedicated 2FA login endpoint.

### Recovery-code hashing

Recovery codes are stored as hashes rather than plaintext.

### Password confirmation before disabling

Disabling 2FA requires the admin password.

### TOTP confirmation before disabling

Disabling 2FA also requires the current authenticator code.

---

# 20. API Summary

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | No | Email/password login |
| POST | `/api/auth/2fa/verify` | 2FA challenge | Verify login TOTP |
| GET | `/api/auth/2fa/status` | Admin JWT | Read 2FA status |
| POST | `/api/auth/2fa/setup` | Admin JWT | Start enrollment |
| POST | `/api/auth/2fa/setup/verify` | Admin JWT | Confirm enrollment |
| POST | `/api/auth/2fa/disable` | Admin JWT | Disable 2FA |

---

# 21. Environment Configuration

Required environment variable:

```text
TOTP_ENCRYPTION_KEY
```

Example placeholder only:

```text
TOTP_ENCRYPTION_KEY=<32-byte-hex-secret>
```

Never put the real value in documentation.

Never commit the real `.env`.

---

# 22. Testing Performed

The implementation was tested locally through the following sequence:

1. Backend started successfully.
2. MongoDB connection succeeded.
3. TOTP encryption/decryption utility loaded successfully.
4. TOTP service loaded successfully.
5. QR code generation worked.
6. 2FA setup QR was scanned by an authenticator application.
7. Authenticator generated valid six-digit codes.
8. 2FA enrollment succeeded.
9. Admin login correctly requested the TOTP code.
10. Correct TOTP code successfully authenticated the admin.
11. Security page correctly reported 2FA as enabled.
12. Disable-2FA flow was implemented with password + TOTP verification.
13. After disabling, the server removes the stored TOTP secret and recovery-code data.

---

# 23. Important Files and Responsibilities

## `Admin.js`

Stores administrator information and 2FA state.

## `authController.js`

Handles:

- password login
- TOTP enrollment
- enrollment verification
- login-time TOTP verification
- 2FA status
- 2FA disable

## `authRoutes.js`

Maps authentication endpoints to controllers.

## `twoFactorService.js`

Contains TOTP and recovery-code operations.

## `crypto.js`

Encrypts and decrypts the TOTP secret.

## `twoFactorChallenge.js`

Creates and validates the temporary login challenge.

## `environment.js`

Loads the TOTP encryption key from environment configuration.

## `Login.jsx`

Implements the two-stage admin login UI.

## `Security.jsx`

Implements 2FA management in the admin dashboard.

---

# 24. End-to-End Architecture

```text
                    ADMIN
                      |
                      v
              React Admin Dashboard
                      |
                      | HTTP/JSON
                      v
              Node / Express API
                      |
          +-----------+-----------+
          |                       |
          v                       v
      MongoDB                 2FA Service
          |                       |
          |                       v
          |                otplib / crypto
          |                       |
          |                       v
          |                TOTP Secret
          |                encrypted with
          |                AES-256-GCM
          |
          v
     Admin Document
          |
          └── twoFactor
               ├── enabled
               ├── secret
               ├── pendingSecret
               ├── recoveryCodes
               └── enabledAt

Authenticator App
(Google Authenticator / Aegis)
          |
          | 6-digit TOTP
          v
     React Dashboard
          |
          v
     Express API
          |
          v
     Verify TOTP
          |
          v
      Issue JWT
          |
          v
    Admin Dashboard
```

---

# 25. Current Git State

The 2FA implementation belongs to:

```text
feature/admin-totp-2fa
```

The implementation was committed and pushed to that branch.

Do not recreate the branch for future documentation changes.

Documentation updates should be committed to the same branch unless a separate branch is intentionally requested.

---

# 26. Suggested Future Hardening

The following items should be reviewed before production deployment:

1. Add dedicated rate limiting for:
   - password login
   - TOTP verification
   - recovery-code verification

2. Add one-time/replay protection for the 2FA challenge.

3. Implement recovery-code login.

4. Add recovery-code regeneration.

5. Add audit logs for:
   - 2FA enabled
   - 2FA disabled
   - successful 2FA login
   - failed 2FA verification
   - recovery-code use

6. Consider security notifications for important authentication changes.

7. Review JWT/session lifetime and revocation strategy.

8. Add automated integration tests for the complete authentication flow.

9. Review authenticator clock-drift handling and TOTP configuration.

10. Review secret/key management for deployment environments.

---

# 27. Final State

The system now has a two-layer administrator authentication process:

```text
Layer 1
Email + Password

        +

Layer 2
Time-based One-Time Password

        =

Authenticated Administrator
```

The TOTP secret is encrypted at rest, the administrator must prove possession of the authenticator during login, and disabling 2FA requires both the administrator password and current TOTP code.

This implementation is isolated to administrator authentication and does not alter the employee attendance check-in/check-out authentication flow.
