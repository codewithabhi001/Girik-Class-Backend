# GR-CLASS Marine Certification — Role-wise API Documentation

**Base URL:** `/api/v1`

## 📁 Files by Role

| File | Role | Description |
|------|------|-------------|
| [PUBLIC.md](./PUBLIC.md) | 🌍 No Auth | Login, Certificate/Vessel verify, Contact, Surveyor apply |
| [ADMIN.md](./ADMIN.md) | 👑 Super Admin (Part 1) | Auth, Users, Clients, Vessels, Jobs |
| [ADMIN_PART2.md](./ADMIN_PART2.md) | 👑 Super Admin (Part 2) | Surveys, Certificates, Payments, Surveyors |
| [ADMIN_PART3.md](./ADMIN_PART3.md) | 👑 Super Admin (Part 3) | Checklists, Dashboard, Reports, System, Everything Else |
| [GM.md](./GM.md) |  General Manager | Job approval, Assign surveyors, Payments, Clients |
| [TM.md](./TM.md) | ⚙️ Technical Manager | Survey finalize, TOCA, Surveyor MGMT, Cert suspend/renew |
| [TO.md](./TO.md) | 📋 Technical Officer | Document verify, Technical review, NC create/close |
| [.md](./.md) | 📎 Technical Assistant | Jobs (read), Payment processing |
| [SURVEYOR.md](./SURVEYOR.md) | 🔍 Field Surveyor | Full survey workflow, GPS, availability |
| [CLIENT.md](./CLIENT.md) | 🚢 Ship Owner | Job create, Own vessels/certs, Feedback, Incidents |
| [FLAG_ADMIN.md](./FLAG_ADMIN.md) | 🏴 Flag State | Jobs (read only), Dashboard |

## 🔐 Authentication

All protected endpoints require:
```
Authorization: Bearer <accessToken>
```
Tokens obtained via `POST /api/v1/auth/login`.

## ❌ Standard Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error_code": "VALIDATION_ERROR",
  "errors": { "field_name": "error message" }
}
```

| Code | Meaning |
|------|---------|
| `200` | OK |
| `201` | Created |
| `204` | No Content |
| `400` | Bad Request / Validation Error |
| `401` | Unauthorized (missing/invalid token) |
| `403` | Forbidden (insufficient role) |
| `404` | Not Found |
| `409` | Conflict (duplicate) |
| `429` | Rate Limited |
| `500` | Server Error |

## 📋 Job Status Flow
```
CREATED → DOCUMENT_VERIFIED → APPROVED → ASSIGNED → SURVEY_AUTHORIZED
→ IN_PROGRESS → SURVEY_DONE → REVIEWED → FINALIZED → PAYMENT_DONE → CERTIFIED
         ↘ REWORK_REQUESTED (loops back)
         ↘ REJECTED (terminal)
```
