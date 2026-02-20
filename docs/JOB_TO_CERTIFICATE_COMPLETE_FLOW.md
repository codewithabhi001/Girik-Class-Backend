# Girik Backend — Complete Job to Certificate Flow
### Post-Hardening Reference | Every API, Every Role, Every Guard

> **Base URL:** `http://localhost:3000/api/v1`
> **Auth Header (all requests):** `Authorization: Bearer <JWT_TOKEN>`
> **Content-Type (JSON):** `application/json`
> **Content-Type (file uploads):** `multipart/form-data`

---

## Role Map

| Code | Full Name | What they do |
|:---|:---|:---|
| `CLIENT` | Client | Vessel owner. Creates jobs, tracks progress. |
| `ADMIN` | Administrator | Full access. No job finalization or survey finalization override. |
| `GM` | General Manager | Business approval. Assigns surveyor. Requests rework. |
| `TM` | Technical Manager | Senior technical authority. **Only role that can finalize survey.** |
| `TO` | Technical Officer | Field reviewer. Marks survey work as reviewed. |
| `TA` | Technical Assistant | Finance helper. Can mark payments as paid. |
| `SURVEYOR` | Surveyor | Field engineer. Performs the physical inspection. |

---

## State Machines (Quick Reference)

### Job Statuses (in order)
```
CREATED → APPROVED → ASSIGNED → SURVEY_AUTHORIZED → IN_PROGRESS → SURVEY_DONE
       → REVIEWED → FINALIZED → PAYMENT_DONE → CERTIFIED
                              ↕ REWORK_REQUESTED
                     REJECTED (terminal, reachable from any non-terminal state)
```

### Survey Statuses (in order)
```
NOT_STARTED → STARTED → CHECKLIST_SUBMITTED → PROOF_UPLOADED → SUBMITTED → FINALIZED
                                                                          ↕ REWORK_REQUIRED
```

### Key Invariants (hardened)
- **Job → FINALIZED** is ONLY set automatically when Survey → FINALIZED. No direct API endpoint.
- **Survey FINALIZED** is a permanent lock. Nothing can modify the survey after this.
- **CERTIFIED** and **REJECTED** are terminal. No mutation is ever allowed after these.
- **Only TM** can finalize a survey. ADMIN and GM cannot override this.
- **Certificate** requires: Job `PAYMENT_DONE` + Survey `FINALIZED` + no existing cert + no open NCs.

---

## THE COMPLETE FLOW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 1: JOB INITIATION                                                    │
│  POST /jobs                           [CLIENT / ADMIN / GM]                 │
│  PUT  /jobs/:id/approve-request       [ADMIN / GM]          CREATED→APPROVED│
└──────────────────────────────────────────┬──────────────────────────────────┘
                                           │
┌──────────────────────────────────────────▼──────────────────────────────────┐
│  PHASE 2: ASSIGNMENT & AUTHORIZATION                                        │
│  PUT /jobs/:id/assign                [ADMIN / GM]       APPROVED→ASSIGNED   │
│  PUT /jobs/:id/authorize-survey      [ADMIN / TM]      ASSIGNED→SURVEY_AUTH │
└──────────────────────────────────────────┬──────────────────────────────────┘
                                           │
┌──────────────────────────────────────────▼──────────────────────────────────┐
│  PHASE 3: FIELD EXECUTION  (SURVEYOR ONLY)                                  │
│  POST /surveys/start                 [SURVEYOR]      SURVEY_AUTH→IN_PROGRESS│
│  POST /checklists/:jobId             [SURVEYOR]                             │
│  POST /surveys/:id/proof             [SURVEYOR]                             │
│  POST /surveys                       [SURVEYOR]      IN_PROGRESS→SURVEY_DONE│
└──────────────────────────────────────────┬──────────────────────────────────┘
                        ┌──────────────────┘
                        │ ← REWORK_REQUESTED?
                        │   PUT /surveys/:id/rework  [GM/TM]
                        │   (surveyor re-uploads and re-submits)
                        │
┌───────────────────────▼─────────────────────────────────────────────────────┐
│  PHASE 4: REVIEW                                                            │
│  PUT /jobs/:id/review                [TO]          SURVEY_DONE→REVIEWED     │
└──────────────────────────────────────────┬──────────────────────────────────┘
                                           │
┌──────────────────────────────────────────▼──────────────────────────────────┐
│  PHASE 5: FINALIZATION  (TM ONLY — locks survey + jobs)                     │
│  PUT /surveys/:id/finalize           [TM ONLY]      SUBMITTED→FINALIZED     │
│                                                      Job auto→FINALIZED      │
└──────────────────────────────────────────┬──────────────────────────────────┘
                                           │
┌──────────────────────────────────────────▼──────────────────────────────────┐
│  PHASE 6: PAYMENT                                                           │
│  POST /payments/invoice              [ADMIN/GM/TM]                          │
│  PUT  /payments/:id/pay              [ADMIN/GM/TM/TA]   FINALIZED→PAYMENT_DONE│
└──────────────────────────────────────────┬──────────────────────────────────┘
                                           │
┌──────────────────────────────────────────▼──────────────────────────────────┐
│  PHASE 7: CERTIFICATE GENERATION                                            │
│  POST /certificates                  [ADMIN/GM/TM]   PAYMENT_DONE→CERTIFIED │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PHASE 1 — Job Initiation

---

### STEP 1 — Create Job Request
**`POST /api/v1/jobs`**

| Field | Value |
|:---|:---|
| **Who** | `CLIENT`, `ADMIN`, `GM` |
| **Job Status After** | `CREATED` |
| **Auth** | Bearer token required |

**Request Body:**
```json
{
  "vessel_id": "uuid",
  "certificate_type_id": "uuid",
  "target_port": "Singapore",
  "target_date": "2026-03-15T00:00:00Z",
  "reason": "Annual Class Renewal"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "job_status": "CREATED",
    "vessel_id": "uuid",
    "certificate_type_id": "uuid"
  }
}
```

**Guards:**
- `CLIENT` can only create jobs for vessels they own.
- `job_status` in body is ignored — always starts as `CREATED`.
- Notifications sent to `ADMIN`, `GM`, `TM` on creation.

---

### STEP 2 — Approve Job Request
**`PUT /api/v1/jobs/:id/approve-request`**

| Field | Value |
|:---|:---|
| **Who** | `ADMIN`, `GM` |
| **Job Status Required** | `CREATED` |
| **Job Status After** | `APPROVED` |

**Request Body:**
```json
{
  "remarks": "All documents verified. Proceeding."
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Job approved.",
  "data": { "id": "uuid", "job_status": "APPROVED" }
}
```

**Guards:**
- Job must be in `CREATED`. Any other state → `400`.
- `REJECTED` or `CERTIFIED` job → `400` terminal guard.

**Error Responses:**
| Code | Message |
|:---|:---|
| `400` | `approveRequest requires job in CREATED state. Current: ASSIGNED` |
| `400` | `Job is in a terminal state (REJECTED) and cannot be modified.` |
| `403` | Unauthorized role |

---

### STEP 3 — Reject Job (Early Exit)
**`PUT /api/v1/jobs/:id/reject`**

| Field | Value |
|:---|:---|
| **Who** | `ADMIN`, `GM`, `TM` |
| **Job Status After** | `REJECTED` *(terminal)* |

**Request Body:**
```json
{ "remarks": "Vessel documents incomplete." }
```

**Role-Specific Rules:**
| Role | Can Reject From |
|:---|:---|
| `ADMIN` | Any non-terminal state |
| `GM` | `CREATED` only |
| `TM` | `ASSIGNED`, `SURVEY_DONE`, `REVIEWED` |

**Error Responses:**
| Code | Message |
|:---|:---|
| `400` | `GM can only reject CREATED jobs.` |
| `400` | `TM can only reject ASSIGNED, SURVEY_DONE, or REVIEWED jobs.` |
| `400` | `Cannot reject a CERTIFIED job.` |

---

## PHASE 2 — Assignment & Authorization

---

### STEP 4 — Assign Surveyor
**`PUT /api/v1/jobs/:id/assign`**

| Field | Value |
|:---|:---|
| **Who** | `ADMIN`, `GM` |
| **Job Status Required** | `APPROVED` |
| **Job Status After** | `ASSIGNED` |

**Request Body:**
```json
{ "surveyorId": "uuid-of-surveyor-user" }
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Surveyor assigned.",
  "data": { "id": "uuid", "job_status": "ASSIGNED" }
}
```

**Guards:**
- Job must be `APPROVED`.
- `surveyorId` must belong to a user with role `SURVEYOR`.
- Surveyor receives `JOB_ASSIGNED` push notification.

**Error Responses:**
| Code | Message |
|:---|:---|
| `400` | `Surveyor can only be assigned when job is APPROVED.` |
| `400` | `Invalid surveyorId: user must exist with SURVEYOR role.` |

---

### STEP 4b — Reassign Surveyor *(Optional)*
**`PUT /api/v1/jobs/:id/reassign`**

| Field | Value |
|:---|:---|
| **Who** | `GM`, `TM` |
| **Job Status Required** | Any non-terminal |
| **Job Status After** | Unchanged (only surveyor ID changes) |

**Request Body:**
```json
{
  "surveyorId": "uuid-of-new-surveyor",
  "reason": "Original surveyor fell ill."
}
```

---

### STEP 5 — Authorize Survey
**`PUT /api/v1/jobs/:id/authorize-survey`**

| Field | Value |
|:---|:---|
| **Who** | `ADMIN`, `TM` |
| **Job Status Required** | `ASSIGNED` |
| **Job Status After** | `SURVEY_AUTHORIZED` |

**Request Body:**
```json
{ "remarks": "All pre-inspection checks cleared." }
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Survey authorized. Surveyor can now begin field work.",
  "data": { "id": "uuid", "job_status": "SURVEY_AUTHORIZED" }
}
```

**Guards:**
- Job must be `ASSIGNED`.
- A surveyor must be set (`assigned_surveyor_id` must exist).
- Surveyor and Client both get `JOB_APPROVED` notification.

> ✅ **After this step, the Surveyor can see and act on the job.**

**Error Responses:**
| Code | Message |
|:---|:---|
| `400` | `authorizeSurvey requires job in ASSIGNED state. Current: SURVEY_AUTHORIZED` |
| `400` | `Cannot authorize survey: no surveyor has been assigned yet.` |

---

## PHASE 3 — Field Execution *(Surveyor Only)*

> All 4 steps below are `SURVEYOR`-only. The surveyor must be the one **assigned** to the job.

---

### STEP 6 — Check-In (Start Survey)
**`POST /api/v1/surveys/start`**

| Field | Value |
|:---|:---|
| **Who** | `SURVEYOR` |
| **Job Status Required** | `SURVEY_AUTHORIZED` |
| **Survey Status** | `NOT_STARTED` → `STARTED` |
| **Job Status After** | `IN_PROGRESS` *(auto-synced)* |

**Request Body:**
```json
{
  "job_id": "uuid",
  "latitude": 1.3521,
  "longitude": 103.8198
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Survey started.",
  "survey_id": "uuid",
  "job_id": "uuid"
}
```

**Guards:**
- Job must be `SURVEY_AUTHORIZED` — not `IN_PROGRESS`, not any other status.
- Cannot re-start a survey already in `STARTED` or beyond.
- GPS coordinates are logged to `gps_tracking`.

**Error Responses:**
| Code | Message |
|:---|:---|
| `400` | `This action requires job to be in: SURVEY_AUTHORIZED. Current: IN_PROGRESS` |
| `400` | `Survey cannot be started: already in STARTED state.` |
| `403` | `You are not the assigned surveyor for this job.` |

---

### STEP 7 — Submit Inspection Checklist
**`POST /api/v1/checklists/:jobId`**

| Field | Value |
|:---|:---|
| **Who** | `SURVEYOR` |
| **Survey Status Required** | `STARTED` or `REWORK_REQUIRED` |
| **Survey Status After** | `CHECKLIST_SUBMITTED` |

**Request Body:**
```json
[
  {
    "question_code": "HUL-01",
    "question_text": "Hull integrity check",
    "answer": "YES",
    "remarks": "No visible damage"
  },
  {
    "question_code": "ENG-01",
    "question_text": "Engine room inspection",
    "answer": "NO",
    "remarks": "Minor oil leak near port shaft seal"
  }
]
```

**Response `200`:**
```json
{
  "success": true,
  "data": [{ "id": "uuid", "question_code": "HUL-01", "answer": "YES" }, "..."]
}
```

**Guards:**
- Survey must be `STARTED` or `REWORK_REQUIRED`. Cannot submit before starting.
- Cannot submit if survey is `FINALIZED` or job is `PAYMENT_DONE`/`CERTIFIED`.
- Previous checklist entries are replaced (idempotent within same phase).

**Error Responses:**
| Code | Message |
|:---|:---|
| `400` | `Checklist can only be submitted when survey is STARTED or REWORK_REQUIRED. Current: NOT_STARTED` |
| `400` | `Survey is finalized and cannot be modified.` |
| `400` | `Checklist cannot be updated when job is PAYMENT_DONE.` |
| `403` | `You are not the assigned surveyor for this job.` |

---

### STEP 8 — Upload Evidence / Proof
**`POST /api/v1/surveys/:survey_id/proof`**

| Field | Value |
|:---|:---|
| **Who** | `SURVEYOR` |
| **Survey Status Required** | `CHECKLIST_SUBMITTED` or `REWORK_REQUIRED` |
| **Survey Status After** | `PROOF_UPLOADED` |
| **Content-Type** | `multipart/form-data` |

**Form Fields:**
| Field | Type | Required |
|:---|:---|:---|
| `proof` | file (image/pdf) | ✅ Yes |

**Response `200`:**
```json
{
  "success": true,
  "data": { "url": "https://cdn.girikship.com/surveys/proof/..." }
}
```

**Guards:**
- Survey must be `CHECKLIST_SUBMITTED` or `REWORK_REQUIRED`.
- Cannot upload after `FINALIZED`.
- File is uploaded to S3 before transaction begins (non-transactional, safe to retry).

**Error Responses:**
| Code | Message |
|:---|:---|
| `400` | `Proof can only be uploaded when survey is CHECKLIST_SUBMITTED or REWORK_REQUIRED. Current: STARTED` |
| `400` | `Survey is finalized and cannot be modified.` |

---

### STEP 9 — Check-Out (Submit Survey Report)
**`POST /api/v1/surveys`**

| Field | Value |
|:---|:---|
| **Who** | `SURVEYOR` |
| **Survey Status Required** | `PROOF_UPLOADED` or `REWORK_REQUIRED` |
| **Survey Status After** | `SUBMITTED` |
| **Job Status After** | `SURVEY_DONE` *(auto-synced)* |
| **Content-Type** | `multipart/form-data` |

**Form Fields:**
| Field | Type | Required | Notes |
|:---|:---|:---|:---|
| `job_id` | string (UUID) | ✅ | |
| `gps_latitude` | number | ✅ | Checkout location |
| `gps_longitude` | number | ✅ | Checkout location |
| `survey_statement` | string | ✅ | Surveyor's written findings |
| `photo` | file (image) | ✅ | Attendance photo at checkout |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "survey_status": "SUBMITTED",
    "submission_count": 1,
    "submitted_at": "2026-02-20T08:15:00Z"
  }
}
```

**Guards:**
- Survey must be `PROOF_UPLOADED` or `REWORK_REQUIRED`.
- A checklist must exist (at least one item).
- Job must not be `FINALIZED`, `PAYMENT_DONE`, or `CERTIFIED`.
- `submission_count` increments on every submission (tracks rework iterations).

**Error Responses:**
| Code | Message |
|:---|:---|
| `400` | `Survey cannot be submitted from STARTED state. Upload proof first.` |
| `400` | `Checklist must be submitted before the survey report.` |
| `400` | `Survey submission is not allowed when job is PAYMENT_DONE.` |

---

## PHASE 4 — Review

---

### STEP 10 — Technical Review
**`PUT /api/v1/jobs/:id/review`**

| Field | Value |
|:---|:---|
| **Who** | `TO` **only** |
| **Job Status Required** | `SURVEY_DONE` |
| **Job Status After** | `REVIEWED` |

**Request Body:**
```json
{ "remarks": "Survey findings verified. Report is consistent with field observations." }
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Job marked as reviewed.",
  "data": { "id": "uuid", "job_status": "REVIEWED" }
}
```

**Guards:**
- Only `TO` role can call this endpoint.
- Job must be in `SURVEY_DONE`.

**Error Responses:**
| Code | Message |
|:---|:---|
| `403` | `Only Technical Officer (TO) can mark a job as REVIEWED.` |
| `400` | `reviewJob requires job in SURVEY_DONE state. Current: REVIEWED` |

---

### STEP 11 — Request Rework *(If Corrections Needed)*

Two options. Use **Option A** when the issue is in the survey; **Option B** for general job send-back.

#### Option A — Survey Rework *(preferred)*
**`PUT /api/v1/surveys/:survey_id/rework`**

| Field | Value |
|:---|:---|
| **Who** | `GM`, `TM` |
| **Survey Status Required** | `SUBMITTED` |
| **Survey Status After** | `REWORK_REQUIRED` |
| **Job Status After** | `REWORK_REQUESTED` *(auto-synced)* |

**Request Body:**
```json
{ "reason": "Engine room photo is blurry. Please re-shoot and re-upload." }
```

#### Option B — Job Send-Back
**`PUT /api/v1/jobs/:id/send-back`**

| Field | Value |
|:---|:---|
| **Who** | `ADMIN`, `TM`, `TO` |
| **Job Status After** | `REWORK_REQUESTED` |

**Role-Specific From-States:**
| Role | Valid From |
|:---|:---|
| `ADMIN` | Any non-terminal |
| `TM` | `SURVEY_DONE`, `REVIEWED` |
| `TO` | `SURVEY_DONE` only |

**Guards (both options):**
- Rework is blocked if job is `FINALIZED`, `PAYMENT_DONE`, or `CERTIFIED`.

**Error Responses:**
| Code | Message |
|:---|:---|
| `400` | `Rework cannot be requested when job is FINALIZED.` |
| `400` | `Rework can only be requested when survey is SUBMITTED. Current: REWORK_REQUIRED` |

> **After rework:** Surveyor re-does Step 7 (checklist) → Step 8 (proof) → Step 9 (submit). `submission_count` increments. History tracks every iteration.

---

## PHASE 5 — Finalization *(Point of No Return)*

---

### STEP 12 — Finalize Survey
**`PUT /api/v1/surveys/:survey_id/finalize`**

| Field | Value |
|:---|:---|
| **Who** | **`TM` ONLY** — hardcoded in lifecycle.service |
| **Survey Status Required** | `SUBMITTED` |
| **Survey Status After** | `FINALIZED` 🔒 |
| **Job Status After** | `FINALIZED` *(auto-synced inside same transaction)* |

**Request Body:** *(none required)*

**Response `200`:**
```json
{
  "success": true,
  "message": "Survey finalized. Job is now FINALIZED."
}
```

**Guards (all enforced atomically in one transaction):**
- Caller must be `TM` — checked against DB user record, not just middleware role.
- Survey must be `SUBMITTED`.
- No open Non-Conformities (status not `CLOSED` or `RESOLVED`).
- Uses `SELECT ... FOR UPDATE` to prevent race conditions.

**What happens after:**
| Entity | Effect |
|:---|:---|
| Survey | `survey_status = FINALIZED`, `finalized_at` timestamp set, permanently locked |
| Job | `job_status = FINALIZED` (auto, same transaction) |
| Surveyor | Receives `JOB_FINALIZED` notification |
| Checklist | Read-only forever |
| Proof/photos | Read-only forever |

**Error Responses:**
| Code | Message |
|:---|:---|
| `403` | `Only Technical Manager (TM) can finalize a survey.` |
| `400` | `Survey can only be FINALIZED from SUBMITTED status.` |
| `400` | `Cannot finalize: 2 open Non-Conformities must be resolved first.` |
| `400` | `Survey is finalized and cannot be modified.` *(if already done)* |

> 🔒 **No endpoint allows Job → FINALIZED directly. The only path is through this endpoint.**

---

## PHASE 6 — Payment

---

### STEP 13 — Create Invoice
**`POST /api/v1/payments/invoice`**

| Field | Value |
|:---|:---|
| **Who** | `ADMIN`, `GM`, `TM` |
| **Job Status Required** | `FINALIZED` |

**Request Body:**
```json
{
  "job_id": "uuid",
  "amount": 12500.00,
  "currency": "USD"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "invoice_number": "INV-3F8A2C1B",
    "amount": 12500.00,
    "payment_status": "UNPAID"
  }
}
```

**Guards:**
- Job must be `FINALIZED`. Cannot invoice an unfinalized job.
- Only one invoice per job allowed (prevents double invoicing → `409`).

**Error Responses:**
| Code | Message |
|:---|:---|
| `400` | `Invoice can only be created for a FINALIZED job. Current status: REVIEWED` |
| `409` | `An invoice already exists for this job.` |

---

### STEP 14 — Mark Payment as Paid
**`PUT /api/v1/payments/:payment_id/pay`**

| Field | Value |
|:---|:---|
| **Who** | `ADMIN`, `GM`, `TM`, `TA` |
| **Job Status Required** | `FINALIZED` |
| **Job Status After** | `PAYMENT_DONE` *(via lifecycle.service in same transaction)* |
| **Content-Type** | `multipart/form-data` |

**Form Fields:**
| Field | Type | Required |
|:---|:---|:---|
| `receipt` | file (image/pdf) | Optional |
| `remarks` | string | Optional |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "payment_status": "PAID",
    "payment_date": "2026-02-20T08:30:00Z",
    "receipt_url": "https://cdn.../payments/receipt.pdf"
  }
}
```

**Guards (all inside one transaction with `SELECT FOR UPDATE`):**
- Payment must be `UNPAID` — cannot mark paid twice.
- Job must be `FINALIZED` — not any other status.
- Job must not be in a terminal state.

**Error Responses:**
| Code | Message |
|:---|:---|
| `409` | `Payment has already been marked as paid.` |
| `400` | `Payment can only be marked as paid when job is FINALIZED. Current: SURVEY_DONE` |
| `400` | `Cannot process payment: Job is in a terminal state (CERTIFIED).` |

---

## PHASE 7 — Certificate Generation *(Final Step)*

---

### STEP 15 — Generate Certificate
**`POST /api/v1/certificates`**

| Field | Value |
|:---|:---|
| **Who** | `ADMIN`, `GM`, `TM` |
| **Job Status Required** | `PAYMENT_DONE` |
| **Survey Status Required** | `FINALIZED` |
| **Job Status After** | `CERTIFIED` 🔒 *(permanent terminal)* |

**Request Body:**
```json
{
  "job_id": "uuid",
  "validity_years": 1
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "certificate_number": "CERT-A1B2C3D4",
    "issue_date": "2026-02-20",
    "expiry_date": "2027-02-20",
    "status": "VALID",
    "pdf_url": "https://cdn.girikship.com/certificates/CERT-A1B2C3D4.pdf"
  }
}
```

**Guards (all enforced inside one transaction with `SELECT FOR UPDATE`):**

| # | Guard | Error |
|:---|:---|:---|
| 1 | Job must be `PAYMENT_DONE` | `400` |
| 2 | Survey must be `FINALIZED` | `400` |
| 3 | `job.generated_certificate_id` must be null | `409` |
| 4 | No open Non-Conformities | `400` |

**What happens atomically:**
1. Certificate row created in `certificates` table
2. Job status → `CERTIFIED` via `lifecycle.service.updateJobStatus` (history written)
3. `job_requests.generated_certificate_id` → linked to new cert
4. AuditLog entry created
5. Transaction committed
6. PDF generated and uploaded to S3 *(best-effort, outside transaction)*

**Error Responses:**
| Code | Message |
|:---|:---|
| `400` | `Certificate can only be generated when job is PAYMENT_DONE. Current: FINALIZED` |
| `400` | `Cannot generate certificate: Survey must be FINALIZED first.` |
| `409` | `Certificate already issued for this job.` |
| `400` | `Cannot generate certificate: 1 open Non-Conformity must be resolved first.` |

---

## POST-CERTIFICATION — Certificate Management

The job is now `CERTIFIED`. No further lifecycle changes allowed on the job or survey.

| Action | Method | Endpoint | Roles | Notes |
|:---|:---|:---|:---|:---|
| **View** | GET | `/certificates/:id` | All + CLIENT | Returns metadata + signed PDF URL |
| **Download** | GET | `/certificates/:id/download` | All + CLIENT | Streams PDF |
| **Preview** | GET | `/certificates/:id/preview` | All + CLIENT | HTML preview |
| **Verify** *(public)* | GET | `/certificates/verify/:number` | **No auth needed** | Public cert verification |
| **Sign** | POST | `/certificates/:id/sign` | `ADMIN`, `GM` | Digital signature |
| **Suspend** | PUT | `/certificates/:id/suspend` | `ADMIN`, `TM` | Temporarily invalid |
| **Revoke** | PUT | `/certificates/:id/revoke` | `ADMIN`, `TM` | Permanent cancellation |
| **Restore** | PUT | `/certificates/:id/restore` | `ADMIN`, `TM` | Unsuspend |
| **Renew** | PUT | `/certificates/:id/renew` | `ADMIN`, `TM` | Issue new + expire old |
| **Reissue** | POST | `/certificates/:id/reissue` | `ADMIN`, `TM` | Duplicate with new number |
| **Transfer** | POST | `/certificates/:id/transfer` | `ADMIN`, `GM` | Move to different vessel |
| **Extend** | POST | `/certificates/:id/extend` | `ADMIN`, `GM` | Extend expiry date |

---

## SURVEY STATUS — Standalone Reference

| From | To | Who | Endpoint | Job Sync |
|:---|:---|:---|:---|:---|
| `NOT_STARTED` | `STARTED` | `SURVEYOR` | `POST /surveys/start` | → `IN_PROGRESS` |
| `STARTED` | `CHECKLIST_SUBMITTED` | `SURVEYOR` | `POST /checklists/:jobId` | — |
| `CHECKLIST_SUBMITTED` | `PROOF_UPLOADED` | `SURVEYOR` | `POST /surveys/:id/proof` | — |
| `PROOF_UPLOADED` | `SUBMITTED` | `SURVEYOR` | `POST /surveys` | → `SURVEY_DONE` |
| `SUBMITTED` | `REWORK_REQUIRED` | `GM`, `TM` | `PUT /surveys/:id/rework` | → `REWORK_REQUESTED` |
| `SUBMITTED` | `FINALIZED` | **`TM` ONLY** | `PUT /surveys/:id/finalize` | → `FINALIZED` |
| `REWORK_REQUIRED` | `CHECKLIST_SUBMITTED` | `SURVEYOR` | `POST /checklists/:jobId` | — |
| `REWORK_REQUIRED` | `PROOF_UPLOADED` | `SURVEYOR` | `POST /surveys/:id/proof` | — |
| `REWORK_REQUIRED` | `SUBMITTED` | `SURVEYOR` | `POST /surveys` | → `SURVEY_DONE` |
| `FINALIZED` | *(nothing)* | **NOBODY** | Blocked — `400` | — |

---

## JOB STATUS — Standalone Reference

| From | To | Who | Endpoint | Notes |
|:---|:---|:---|:---|:---|
| `CREATED` | `APPROVED` | `ADMIN`, `GM` | `PUT /jobs/:id/approve-request` | |
| `APPROVED` | `ASSIGNED` | `ADMIN`, `GM` | `PUT /jobs/:id/assign` | Requires `surveyorId` in body |
| `ASSIGNED` | `SURVEY_AUTHORIZED` | `ADMIN`, `TM` | `PUT /jobs/:id/authorize-survey` | |
| `SURVEY_AUTHORIZED` | `IN_PROGRESS` | *lifecycle auto* | via `POST /surveys/start` | |
| `IN_PROGRESS` | `SURVEY_DONE` | *lifecycle auto* | via `POST /surveys` | |
| `SURVEY_DONE` | `REVIEWED` | `TO` | `PUT /jobs/:id/review` | |
| `SURVEY_DONE` / `REVIEWED` | `REWORK_REQUESTED` | `ADMIN`,`TM`,`TO` | `PUT /jobs/:id/send-back` | |
| `REWORK_REQUESTED` | `IN_PROGRESS` | *lifecycle auto* | via `POST /surveys/start` | |
| `SURVEY_DONE` / `REVIEWED` | `FINALIZED` | *lifecycle auto* | via `PUT /surveys/:id/finalize` | **TM trigger only** |
| `FINALIZED` | `PAYMENT_DONE` | *lifecycle auto* | via `PUT /payments/:id/pay` | |
| `PAYMENT_DONE` | `CERTIFIED` | *lifecycle auto* | via `POST /certificates` | Terminal |
| *any non-terminal* | `REJECTED` | `ADMIN`,`GM`,`TM` | `PUT /jobs/:id/reject` | Terminal |

---

## SUPPORT ACTIONS *(Available throughout)*

| Action | Method | Endpoint | Roles |
|:---|:---|:---|:---|
| **List Jobs** | GET | `/jobs` | All roles |
| **Job Detail** | GET | `/jobs/:id` | All except `TA` |
| **Job History** | GET | `/jobs/:id/history` | `ADMIN`, `GM`, `TM`, `TO` |
| **Add Internal Note** | POST | `/jobs/:id/notes` | `ADMIN`, `GM`, `TM`, `TO` |
| **Survey Timeline** | GET | `/surveys/:id/timeline` | `ADMIN`, `GM`, `TM` |
| **All Survey Reports** | GET | `/surveys` | `ADMIN`, `GM`, `TM`, `TO` |
| **External Chat** | GET | `/jobs/:id/messages/external` | All roles |
| **Internal Chat** | GET | `/jobs/:id/messages/internal` | `ADMIN`, `GM`, `TM`, `TO` |
| **Send Message** | POST | `/jobs/:id/messages` | All roles |
| **Flag Violation** | POST | `/surveys/:id/violation` | `ADMIN`, `TM` |
| **Update Priority** | PUT | `/jobs/:id/priority` | `ADMIN`, `GM`, `TM` |
| **Cancel Job** | PUT | `/jobs/:id/cancel` | `CLIENT`, `GM`, `TM`, `ADMIN` |
| **List Payments** | GET | `/payments` | `CLIENT`, `ADMIN`, `GM`, `TM` |
| **Financial Summary** | GET | `/payments/summary` | `CLIENT`, `ADMIN`, `GM` |
| **Ledger** | GET | `/payments/:id/ledger` | `ADMIN`, `GM` |

---

## ERROR REFERENCE

| HTTP Code | When | Message Pattern |
|:---|:---|:---|
| `400` | Illegal state transition | `Invalid status transition: SURVEY_DONE → CREATED` |
| `400` | Action on terminal job | `Job is in a terminal state (CERTIFIED)...` |
| `400` | Survey locked | `Survey is finalized and cannot be modified.` |
| `400` | Wrong job state for action | `This action requires job to be in: SURVEY_AUTHORIZED` |
| `400` | Survey order violated | `Proof can only be uploaded when survey is CHECKLIST_SUBMITTED...` |
| `400` | Rework post-payment | `Rework cannot be requested when job is FINALIZED.` |
| `400` | Payment wrong state | `Payment can only be marked as paid when job is FINALIZED.` |
| `400` | Cert without payment | `Certificate can only be generated when job is PAYMENT_DONE.` |
| `400` | Cert without finalized survey | `Cannot generate certificate: Survey must be FINALIZED first.` |
| `400` | Open NCs blocking finalize | `Cannot finalize: 2 open Non-Conformities must be resolved first.` |
| `403` | Wrong role for action | `Only Technical Manager (TM) can finalize a survey.` |
| `403` | Not assigned surveyor | `You are not the assigned surveyor for this job.` |
| `403` | Direct job FINALIZED attempt | `Job cannot be finalized directly. Finalize the survey via...` |
| `409` | Duplicate submission | `Survey is already in SUBMITTED state.` |
| `409` | Duplicate certificate | `Certificate already issued for this job.` |
| `409` | Double payment | `Payment has already been marked as paid.` |
| `409` | Double invoice | `An invoice already exists for this job.` |
