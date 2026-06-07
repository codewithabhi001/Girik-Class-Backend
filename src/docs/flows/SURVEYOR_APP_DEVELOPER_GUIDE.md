# Surveyor App Developer Guide (Login → Survey Done)

**Audience:** Mobile / Web developers building the SURVEYOR app.

This is a practical, API-first guide sourced **directly from the codebase** (`src/modules/` + `src/models/`). It explains:

- **Why** each API exists
- **When** to call it in the workflow
- **Exact paths, request payloads, and response shapes**
- **What** to store locally

> **Key architecture note:** Every job can have **multiple certificates** (`JobCertificate`).  
> Most survey APIs work on a **`jobCertificateId`** (not `jobId`).  
> The surveyor must complete one survey cycle per certificate.

For the overall system state machine also read:
`src/docs/flows/SURVEY_AUTHORIZE_TO_FINALIZE.md`

---

## 0) Base Setup (required for every call)

### Base URL

```
https://api.<env>.grclass.com/api/v1
```

### Auth Header

All authenticated APIs require:

```
Authorization: Bearer <accessToken>
```

### Common Response Shape

**Success:**
```json
{
  "success": true,
  "message": "optional description",
  "data": { }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Human-readable error message.",
  "error_code": "OPTIONAL_CODE"
}
```

---

## 1) Authentication

### 1.1 `POST /api/v1/auth/login`

**Why:** Starts the session. Returns JWT tokens.

**Request body** (`application/json`):

| Field | Type | Required |
|-------|------|----------|
| `email` | string (email) | ✅ |
| `password` | string | ✅ |

```json
{
  "email": "surveyor@example.com",
  "password": "your-password"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "019c79a4-4930-71fd-aa73-887301791935",
      "name": "John Doe",
      "email": "surveyor@example.com",
      "role": "SURVEYOR",
      "status": "ACTIVE",
      "client_id": null,
      "profile_pic_url": null,
      "force_password_reset": false,
      "last_login_at": "2026-04-28T10:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Store locally:** `accessToken`, `refreshToken`, `user.id`, `user.role`, `user.name`

---

### 1.2 `POST /api/v1/auth/refresh-token`

**Why:** Get a new access token silently when the old one expires.

**Request body:**

| Field | Type | Required |
|-------|------|----------|
| `refreshToken` | string | ✅ |

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** Same shape as login — returns new `accessToken` + `refreshToken` + `user`.

---

### 1.3 `POST /api/v1/auth/logout`

**Why:** Invalidate the current session token.

- **Auth required:** ✅ Bearer token
- **Request body:** none
- **Response:** `{ "success": true, "message": "Logged out successfully." }`

---

### 1.4 `POST /api/v1/auth/forgot-password`

**Request body:**

| Field | Type | Required |
|-------|------|----------|
| `email` | string (email) | ✅ |

```json
{ "email": "surveyor@example.com" }
```

---

### 1.5 `POST /api/v1/auth/reset-password`

**Request body:**

| Field | Type | Required |
|-------|------|----------|
| `token` | string | ✅ |
| `password` | string | ✅ |

```json
{
  "token": "reset-otp-or-link-token",
  "password": "NewPassword123!"
}
```

---

### 1.6 `POST /api/v1/auth/change-password`

**Auth required:** ✅

**Request body:**

| Field | Type | Required |
|-------|------|----------|
| `currentPassword` | string | ✅ |
| `newPassword` | string | ✅ |

```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword456!"
}
```

---

## 2) Home Screen / Dashboard

### `GET /api/v1/dashboard`

**Why:** Quick stats and "what needs attention" cards.

- **Request:** No body, no query params
- **Auth:** ✅ (role-specific response — SURVEYOR sees only their stats)

**Response:**

```json
{
  "success": true,
  "data": {
    "stats": {
      "pendingJobs": 5
    },
    "recentJobs": [],
    "expiringCertificates": [],
    "alerts": []
  }
}
```

---

## 3) Job List

### 3.1 `GET /api/v1/jobs`

**Why:** Surveyor's job inbox. Backend enforces that SURVEYOR only sees assigned jobs.

**Query params (all optional):**

| Param | Type | Example |
|-------|------|---------|
| `page` | number | `1` |
| `limit` | number | `10` |
| `status` | string | `ASSIGNED,SURVEY_AUTHORIZED,IN_PROGRESS,REWORK_REQUESTED` |
| `vessel_id` | uuid | |
| `certificate_type_id` | uuid | |
| `target_port` | string | `Mumbai` |
| `created_from` | date `YYYY-MM-DD` | |
| `created_to` | date `YYYY-MM-DD` | |
| `recent_days` | number | `7` |

**Response:**

```json
{
  "success": true,
  "data": {
    "total": 48,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "status_counts": [
      { "status": "ASSIGNED", "count": 10 },
      { "status": "IN_PROGRESS", "count": 3 }
    ],
    "jobs": [
      {
        "id": "019d3ac5-3464-74f9-891e-f6eda7ee366c",
        "job_request_number": "GRJ-A1B2C3D4",
        "job_status": "SURVEY_AUTHORIZED",
        "vessel_id": "019cbf1d-d9c1-732d-8d10-f866bb6e9dec",
        "target_port": "Mumbai",
        "target_date": "2026-12-31",
        "priority": "NORMAL",
        "is_survey_required": true,
        "createdAt": "2026-03-29T18:04:55.000Z",
        "Vessel": {
          "id": "019cbf1d-d9c1-732d-8d10-f866bb6e9dec",
          "vessel_name": "MV Pacific Guardian",
          "imo_number": "9876501"
        },
        "certificates": [
          {
            "id": "019d7c59-0000-0000-0000-000000000001",
            "certificate_type_id": "019cbf1d-bdc2-75e8-9fc8-3d161ae90ede",
            "status": "SURVEY_AUTHORIZED",
            "assigned_surveyor_id": "019c79a4-4930-71fd-aa73-887301791935",
            "survey": {
              "id": "019d7c59-7f7e-768d-a9a5-00cb91079432",
              "survey_status": "NOT_STARTED"
            },
            "CertificateType": {
              "id": "019cbf1d-bdc2-75e8-9fc8-3d161ae90ede",
              "name": "Safety Equipment Certificate"
            }
          }
        ]
      }
    ]
  }
}
```

> **Important:** Filter for `status=SURVEY_AUTHORIZED,IN_PROGRESS,REWORK_REQUESTED` to show the surveyor's active work queue.

---

### 3.2 `GET /api/v1/jobs/:id`

**Why:** Full job detail including all certificates, documents, and survey status.

**Path params:**

| Param | Type | Required |
|-------|------|----------|
| `id` | uuid (jobId) | ✅ |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "019d3ac5-3464-74f9-891e-f6eda7ee366c",
    "job_request_number": "GRJ-A1B2C3D4",
    "job_status": "SURVEY_AUTHORIZED",
    "vessel_id": "019cbf1d-d9c1-732d-8d10-f866bb6e9dec",
    "requested_by_user_id": "019c79a4-3eee-731a-9eff-b0eed303e215",
    "assigned_surveyor_id": "019c79a4-4930-71fd-aa73-887301791935",
    "target_port": "Mumbai",
    "target_date": "2026-12-31",
    "priority": "NORMAL",
    "is_survey_required": true,
    "reschedule_count": 0,
    "remarks": null,
    "createdAt": "2026-03-29T18:04:55.000Z",
    "updatedAt": "2026-04-01T10:00:00.000Z",
    "Vessel": {
      "id": "019cbf1d-d9c1-732d-8d10-f866bb6e9dec",
      "vessel_name": "MV Pacific Guardian",
      "imo_number": "9876501",
      "vessel_type": "BULK_CARRIER",
      "flag": "Panama"
    },
    "certificates": [
      {
        "id": "019d7c59-0000-0000-0000-000000000001",
        "certificate_type_id": "019cbf1d-bdc2-75e8-9fc8-3d161ae90ede",
        "status": "SURVEY_AUTHORIZED",
        "assigned_surveyor_id": "019c79a4-4930-71fd-aa73-887301791935",
        "rework_remarks": null,
        "generated_certificate_id": null,
        "CertificateType": {
          "id": "019cbf1d-bdc2-75e8-9fc8-3d161ae90ede",
          "name": "Safety Equipment Certificate",
          "issuing_authority": "CLASS",
          "requires_survey": true
        },
        "survey": {
          "id": "019d7c59-7f7e-768d-a9a5-00cb91079432",
          "survey_status": "NOT_STARTED",
          "survey_statement_status": "NOT_PREPARED",
          "started_at": null,
          "submitted_at": null
        },
        "JobDocuments": []
      }
    ],
    "requester": {
      "id": "019c79a4-3eee-731a-9eff-b0eed303e215",
      "name": "Client Admin",
      "email": "client@company.com"
    },
    "surveyor": {
      "id": "019c79a4-4930-71fd-aa73-887301791935",
      "name": "John Doe",
      "email": "surveyor@example.com"
    },
    "pending_action": {
      "role": "SURVEYOR",
      "fallbackRoles": [],
      "message": "Waiting for Surveyor to Complete Survey"
    }
  }
}
```

> **Store:** `certificates[].id` as `jobCertificateId` — needed for all survey/checklist calls.

---

### 3.3 `GET /api/v1/jobs/:id/history`

**Why:** Status change history for the job (audit trail / timeline).

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "job_id": "job-uuid",
      "previous_status": "ASSIGNED",
      "new_status": "SURVEY_AUTHORIZED",
      "reason": "Survey authorized by TM",
      "changed_by": "019c79a4-0000-0000-0000-000000000002",
      "createdAt": "2026-04-01T10:00:00.000Z"
    }
  ]
}
```

---

### 3.4 `GET /api/v1/jobs/:id/messages/external`

**Why:** Fetch external messages/communication thread for this job (visible to Client + all internal roles + SURVEYOR).

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "msg-uuid",
      "job_id": "job-uuid",
      "sender_id": "user-uuid",
      "content": "Please re-upload page 3 of the checklist.",
      "attachments": [],
      "createdAt": "2026-04-01T11:00:00.000Z",
      "Sender": { "name": "TM User", "role": "TM" }
    }
  ]
}
```

---

### 3.5 `POST /api/v1/jobs/:id/messages/external`

**Why:** Send a message/reply to the job thread.

**Request body** (`multipart/form-data` or `application/json`):

| Field | Type | Required |
|-------|------|----------|
| `content` | string | ✅ |
| `attachments` | file(s) | optional |

```json
{ "content": "I have re-uploaded the signed checklist. Please review." }
```

**Response:** Created message object.

---

## 4) Survey Workflow Overview

The backend enforces this sequence **per JobCertificate**:

```
Job status: SURVEY_AUTHORIZED
     ↓
1. POST /api/v1/surveys/start            (job_id) → job becomes IN_PROGRESS
     ↓
2. GET  /api/v1/checklists/job-certificates/:jobCertificateId   (load questions)
     ↓
3. PUT  /api/v1/checklists/job-certificates/:jobCertificateId   (save answers)
     ↓
4. GET  .../get-upload-url → PUT to S3 → PUT .../signed-checklist-files (upload signed scan)
     ↓
5. GET  .../get-upload-url → PUT to S3 → POST /surveys/:jobCertificateId/proof (upload evidence)
     ↓
6. POST /api/v1/surveys/:jobCertificateId/submit   (final submission)
     ↓
Job status: SURVEY_DONE (when ALL certificates are submitted)
```

Rework loop: TM marks items REJECTED → job moves to REWORK_REQUESTED → Surveyor corrects and re-submits.

---

## 5) Start Survey (Check-In)

### `POST /api/v1/surveys/start`

**Why:** Marks the on-site start. Creates a `Survey` record per certificate. Moves job to `IN_PROGRESS`.  
**When:** Only call when job status is `SURVEY_AUTHORIZED` or `REWORK_REQUESTED`.

**Request body** (`application/json`):

| Field | Type | Required |
|-------|------|----------|
| `job_id` | uuid | ✅ |
| `latitude` | number (decimal) | ✅ |
| `longitude` | number (decimal) | ✅ |

```json
{
  "job_id": "019d3ac5-3464-74f9-891e-f6eda7ee366c",
  "latitude": 18.9220,
  "longitude": 72.8347
}
```

**Response:**

```json
{
  "success": true,
  "message": "Survey started successfully.",
  "data": {
    "message": "Started 1 surveys for the job.",
    "job_id": "019d3ac5-3464-74f9-891e-f6eda7ee366c"
  }
}
```

**Error cases:**
- `409` — Survey already started for this job (navigate to active survey page)
- `400` — Job not in `SURVEY_AUTHORIZED` or `REWORK_REQUESTED` state
- `403` — You are not the assigned surveyor for this job

---

## 6) Checklist Screen

### 6.1 `GET /api/v1/checklists/job-certificates/:jobCertificateId`

**Why:** Load the complete checklist screen in one call — both the template (questions) and any previously saved answers.

**Path params:**

| Param | Type | Required |
|-------|------|----------|
| `jobCertificateId` | uuid | ✅ |

**Optional query params:**

| Param | Type | Description |
|-------|------|-------------|
| `answer` | `YES\|NO\|NA` | Filter by answer type |
| `question_code` | string | Filter by question code |
| `search` | string | Search question text / remarks |

**Response:**

```json
{
  "success": true,
  "data": {
    "job_certificate_id": "019d7c59-0000-0000-0000-000000000001",
    "certificate_type_id": "019cbf1d-bdc2-75e8-9fc8-3d161ae90ede",
    "items": [
      {
        "id": "act-plan-uuid",
        "job_id": "019d3ac5-3464-74f9-891e-f6eda7ee366c",
        "job_certificate_id": "019d7c59-0000-0000-0000-000000000001",
        "question_code": "LSE001",
        "question_text": "Are life jackets available and accessible?",
        "answer": "YES",
        "remarks": "All 20 jackets verified and tagged.",
        "file_url": "https://s3-signed-url.../evidence_photo.jpg",
        "status": "PENDING",
        "rejection_reason": null,
        "created_at": "2026-04-15T09:00:00.000Z",
        "updated_at": "2026-04-15T09:30:00.000Z"
      },
      {
        "id": "act-plan-uuid-2",
        "job_certificate_id": "019d7c59-0000-0000-0000-000000000001",
        "question_code": "LSE002",
        "question_text": "Fire extinguisher pressure within limits?",
        "answer": "NO",
        "remarks": "Pressure gauge shows red zone on unit #3.",
        "file_url": "https://s3-signed-url.../fire_ext_photo.jpg",
        "status": "REJECTED",
        "rejection_reason": "Photo is blurry. Please re-upload a clear photo.",
        "created_at": "2026-04-15T09:00:00.000Z",
        "updated_at": "2026-04-15T12:00:00.000Z"
      }
    ],
    "signed_checklist_files": [
      {
        "url": "https://s3-signed-url.../signed_checklist.pdf",
        "file_name": "signed_checklist.pdf",
        "status": "PENDING",
        "rejection_reason": null
      }
    ],
    "template_files": [
      "https://s3-signed-url.../blank_template.docx"
    ],
    "template": {
      "id": "template-uuid",
      "name": "SAFETY EQUIPMENT INSPECTION",
      "code": "SAFETY_EQUIPMENT"
    },
    "sections": [
      {
        "title": "Life-Saving Equipment",
        "items": [
          { "code": "LSE001", "text": "Are life jackets available and accessible?", "type": "YES_NO_NA" },
          { "code": "LSE002", "text": "Fire extinguisher pressure within limits?", "type": "YES_NO_NA" }
        ]
      }
    ]
  }
}
```

> **Important:**
> - `items` is empty on first load (no answers saved yet). Use `sections` to build the form.
> - On resume, `items` contains previously saved answers.
> - `file_url` in items is a resolved HTTPS URL (for display). Send S3 **keys** (not URLs) when saving.
> - Items with `status: "REJECTED"` must be highlighted in red for rework.

---

### 6.2 `GET /api/v1/checklist-templates/job/:jobId`

**Why:** Fetch only the checklist template (question structure) without survey answers. Use when you need just the question list.

**Path params:**

| Param | Type | Required |
|-------|------|----------|
| `jobId` | uuid | ✅ |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "template-uuid",
    "name": "SAFETY EQUIPMENT INSPECTION",
    "code": "SAFETY_EQUIPMENT",
    "certificate_type_id": "019cbf1d-bdc2-75e8-9fc8-3d161ae90ede",
    "status": "ACTIVE",
    "sections": [
      {
        "title": "Life-Saving Equipment",
        "items": [
          { "code": "LSE001", "text": "Are life jackets available and accessible?", "type": "YES_NO_NA" }
        ]
      }
    ],
    "template_files": ["https://s3-signed-url.../blank_template.docx"]
  }
}
```

---

## 7) Upload Evidence Photo (per checklist question)

### Step A — `GET /api/v1/checklists/job-certificates/:jobCertificateId/get-upload-url`

**Why:** Get a pre-signed S3 PUT URL to upload a photo for a specific checklist question.

**Query params:**

| Param | Type | Required |
|-------|------|----------|
| `fileName` | string | ✅ (e.g. `engine_room.jpg`) |
| `contentType` | string | ✅ (e.g. `image/jpeg`) |

**Response:**

```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/bucket/...?X-Amz-Signature=...",
    "fileKey": "surveys/checklist-evidence/019d7c59-0000-0000-0000-000000000001/1714000000000_engine_room.jpg"
  }
}
```

### Step B — Upload Binary to S3

```
PUT <uploadUrl>
Content-Type: image/jpeg
Body: <binary file>
```

- No backend call needed — upload directly to S3.
- **Store** `fileKey` — you'll send it as `file_url` in the checklist PUT.

---

## 8) Upload Signed Checklist Scan

This is the physically filled + signed checklist document (PDF/scan) that the surveyor uploads after completing the paper form.

### Step A — `GET /api/v1/checklists/job-certificates/:jobCertificateId/signed-checklist-upload-url`

**Query params:**

| Param | Type | Required |
|-------|------|----------|
| `fileName` | string | ✅ (e.g. `signed_checklist.pdf`) |
| `contentType` | string | ✅ (e.g. `application/pdf`) |

**Response:**

```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/bucket/...?X-Amz-Signature=...",
    "fileKey": "surveys/signed-checklists/019d7c59-0000-0000-0000-000000000001/1714000000000_signed_checklist.pdf"
  }
}
```

### Step B — Upload Binary to S3

```
PUT <uploadUrl>
Content-Type: application/pdf
Body: <binary file>
```

**Store** `fileKey` — send it in `PUT /checklists/job-certificates/:jobCertificateId/signed-checklist-files`.

---

## 9) Save Checklist Answers + Attach File Keys

### 9.1 `PUT /api/v1/checklists/job-certificates/:jobCertificateId`

**Why:** The **only** API that persists checklist state: answers, per-item evidence keys, and signed scan keys.

**Path params:**

| Param | Type | Required |
|-------|------|----------|
| `jobCertificateId` | uuid | ✅ |

**Request body** (`application/json`):

| Field | Type | Required |
|-------|------|----------|
| `items` | array | ✅ |
| `signed_checklist_files` | array of S3 key strings | optional |

Each item in `items`:

| Field | Type | Required |
|-------|------|----------|
| `question_code` | string | ✅ |
| `question_text` | string | ✅ |
| `answer` | `YES\|NO\|NA` | ✅ |
| `remarks` | string | optional |
| `file_url` | S3 key string | optional (send key from step 7A, or `""` if no photo) |

```json
{
  "items": [
    {
      "question_code": "LSE001",
      "question_text": "Are life jackets available and accessible?",
      "answer": "YES",
      "remarks": "All 20 jackets verified and tagged.",
      "file_url": ""
    },
    {
      "question_code": "LSE002",
      "question_text": "Fire extinguisher pressure within limits?",
      "answer": "NO",
      "remarks": "Pressure gauge shows red zone on unit #3.",
      "file_url": "surveys/checklist-evidence/019d7c59-0000-0000-0000-000000000001/1714000000000_fire_ext.jpg"
    }
  ],
  "signed_checklist_files": [
    "surveys/signed-checklists/019d7c59-0000-0000-0000-000000000001/1714000000000_signed_checklist.pdf"
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "job_certificate_id": "019d7c59-0000-0000-0000-000000000001",
    "items": [
      {
        "id": "act-plan-uuid",
        "question_code": "LSE001",
        "question_text": "Are life jackets available and accessible?",
        "answer": "YES",
        "remarks": "All 20 jackets verified and tagged.",
        "file_url": null,
        "status": "PENDING",
        "rejection_reason": null
      }
    ],
    "signed_checklist_files": [
      {
        "url": "https://s3-signed-url.../1714000000000_signed_checklist.pdf",
        "file_name": "signed_checklist.pdf",
        "status": "PENDING",
        "rejection_reason": null
      }
    ]
  }
}
```

> **Behavior notes:**
> - You can call this multiple times (intermediate saves).
> - `signed_checklist_files` is a **full replace** — to remove all scans, send `[]`.
> - Re-sending a `REJECTED` item resets its `status` to `PENDING` and clears `rejection_reason`.
> - Survey status advances: `STARTED` → `CHECKLIST_SUBMITTED`.

---

### 9.2 `PUT /api/v1/checklists/job-certificates/:jobCertificateId/signed-checklist-files`

**Why:** Attach/replace signed checklist scan keys **without** re-sending all checklist answers (use for Screen 2 — "attach signed documents").

**Request body:**

| Field | Type | Required |
|-------|------|----------|
| `signed_checklist_files` | array of S3 key strings | ✅ (full replace; send `[]` to clear) |

```json
{
  "signed_checklist_files": [
    "surveys/signed-checklists/019d7c59-0000-0000-0000-000000000001/1714000000000_signed_checklist.pdf"
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "job_certificate_id": "019d7c59-0000-0000-0000-000000000001",
    "signed_checklist_files": [
      {
        "url": "https://s3-signed-url.../1714000000000_signed_checklist.pdf",
        "file_name": "signed_checklist.pdf",
        "status": "PENDING",
        "rejection_reason": null
      }
    ]
  }
}
```

---

## 10) Download Auto-Filled Checklist Template (Optional UX)

### `GET /api/v1/checklist-templates/job/:jobId/download`

**Why:** "Download filled checklist" button — backend generates a pre-filled DOCX using job/vessel data and returns a signed URL.

**Query params:**

| Param | Type | Default |
|-------|------|---------|
| `force` | boolean | `false` (use cached if available) |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "fileName": "SAFETY-EQUIPMENT-FILLED.docx",
      "contentType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "expiresAt": "2026-04-26T10:00:00.000Z",
      "signedUrl": "https://s3-signed-url.../SAFETY-EQUIPMENT-FILLED.docx"
    }
  ]
}
```

---

## 11) Upload Evidence Proof

### Step A — Get upload URL (reuse checklist evidence URL if already done)

Alternative to using `get-upload-url`: if you already have a `fileKey` from a previous upload, go to Step B.

### Step B — `POST /api/v1/surveys/:jobCertificateId/proof`

**Why:** Upload additional evidence after the checklist is complete.

**Path params:**

| Param | Type | Required |
|-------|------|----------|
| `jobCertificateId` | uuid | ✅ |

**Option A — Multipart upload** (send file directly):

```
Content-Type: multipart/form-data
Field: proof (binary file)
```

**Option B — JSON with pre-uploaded S3 key:**

```json
{
  "fileKey": "surveys/proofs/019d7c59-0000-0000-0000-000000000001/1714000000000_proof.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Proof uploaded successfully.",
  "data": {
    "url": "https://s3-signed-url.../1714000000000_proof.jpg"
  }
}
```

> - Survey status advances: `CHECKLIST_SUBMITTED` → `PROOF_UPLOADED`
> - Multiple proof uploads are allowed before final submission.

---

## 12) GPS Tracking During Survey

### `POST /api/v1/surveys/jobs/:jobId/location`

**Why:** Stream live GPS location while survey is in progress (can be called repeatedly).

**Path params:**

| Param | Type | Required |
|-------|------|----------|
| `jobId` | uuid | ✅ |

**Request body:**

| Field | Type | Required |
|-------|------|----------|
| `latitude` | number | ✅ |
| `longitude` | number | ✅ |
| `job_certificate_id` | uuid | optional (for multi-cert jobs) |

```json
{
  "latitude": 18.9220,
  "longitude": 72.8347,
  "job_certificate_id": "019d7c59-0000-0000-0000-000000000001"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Location recorded.",
  "data": {
    "id": "gps-uuid",
    "surveyor_id": "019c79a4-4930-71fd-aa73-887301791935",
    "job_id": "019d3ac5-3464-74f9-891e-f6eda7ee366c",
    "job_certificate_id": "019d7c59-0000-0000-0000-000000000001",
    "latitude": "18.92200000",
    "longitude": "72.83470000",
    "timestamp": "2026-04-15T10:30:00.000Z",
    "createdAt": "2026-04-15T10:30:00.000Z"
  }
}
```

> Only available when survey is in `STARTED`, `CHECKLIST_SUBMITTED`, `PROOF_UPLOADED`, or `REWORK_REQUIRED` status.

---

## 13) Offline Sync

### `POST /api/v1/surveys/jobs/:jobId/sync`

**Why:** Replay batched offline data (checklist answers + GPS points) when network is restored.

**Path params:**

| Param | Type | Required |
|-------|------|----------|
| `jobId` | uuid | ✅ |

**Request body (all optional — send what you have):**

| Field | Type | Description |
|-------|------|-------------|
| `job_certificate_id` | uuid | optional — scope to specific certificate |
| `checklist` | array | offline checklist answers |
| `gps_points` | array | offline GPS points |

Each `checklist` item:

| Field | Type | Required |
|-------|------|----------|
| `question_code` | string | ✅ |
| `question_text` | string | ✅ |
| `answer` | `YES\|NO\|NA` | ✅ |
| `remarks` | string | optional |

Each `gps_points` item:

| Field | Type | Required |
|-------|------|----------|
| `latitude` | number | ✅ |
| `longitude` | number | ✅ |
| `captured_at` | ISO date-time string | optional |

```json
{
  "job_certificate_id": "019d7c59-0000-0000-0000-000000000001",
  "checklist": [
    {
      "question_code": "LSE001",
      "question_text": "Are life jackets available and accessible?",
      "answer": "YES",
      "remarks": "Verified offline"
    }
  ],
  "gps_points": [
    { "latitude": 18.9220, "longitude": 72.8347, "captured_at": "2026-04-15T10:00:00.000Z" },
    { "latitude": 18.9221, "longitude": 72.8348, "captured_at": "2026-04-15T10:05:00.000Z" }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Offline data synced successfully.",
  "synced": {
    "checklist_items": 1,
    "gps_points": 2
  }
}
```

---

## 14) Draft Survey Statement (Optional Preview)

### `POST /api/v1/surveys/jobs/:jobId/statement/draft`

**Why:** Generate a draft PDF of the survey statement. SURVEYOR sends the statement text; TM triggers PDF generation in the background.

**Path params:**

| Param | Type | Required |
|-------|------|----------|
| `jobId` | uuid | ✅ |

**Request body:**

| Field | Type | Required for SURVEYOR |
|-------|------|----------------------|
| `survey_statement` | string | ✅ (required for SURVEYOR; optional for TM/ADMIN) |
| `job_certificate_id` | uuid | optional (for multi-cert jobs) |

```json
{
  "survey_statement": "Inspection completed. All life-saving equipment in serviceable condition. Minor deficiency noted on fire extinguisher unit #3 — replacement ordered.",
  "job_certificate_id": "019d7c59-0000-0000-0000-000000000001"
}
```

**Response (SURVEYOR):**

```json
{
  "success": true,
  "data": {
    "message": "Survey statement saved.",
    "status": "DRAFTED"
  }
}
```

**Response (TM/ADMIN — PDF generation triggered in background):**

```json
{
  "success": true,
  "data": {
    "message": "Draft request received. Report is being generated in background.",
    "status": "DRAFTED"
  }
}
```

> - Allowed only when job status is in `SURVEY_DONE`, `REVIEWED`, `FINALIZED`, `PAYMENT_DONE`, or `CERTIFIED`.
> - `pdf_url` is **only available for TM/ADMIN** after background generation completes; SURVEYOR does not receive it.

---

## 15) Submit Final Survey Report (Check-Out)

### `POST /api/v1/surveys/:jobCertificateId/submit`

**Why:** Final submission. Moves job to `SURVEY_DONE` when **all** certificates are submitted.

**Path params:**

| Param | Type | Required |
|-------|------|----------|
| `jobCertificateId` | uuid | ✅ |

**Pre-conditions (backend enforced):**
- Checklist must have at least 1 answer saved.
- At least one signed checklist scan must be attached (`signed_checklist_files` not empty).
- **NO REJECTED checklist items** — all must be `PENDING` or `APPROVED`.
- **NO REJECTED signed documents**.
- Attendance photo is mandatory.
- GPS coordinates are mandatory.

**Option A — `multipart/form-data`:**

| Field | Type | Required |
|-------|------|----------|
| `submit_latitude` | number | ✅ |
| `submit_longitude` | number | ✅ |
| `survey_statement` | string | optional |
| `reason_if_outside` | string | optional |
| `photo` | binary file | ✅ (or `photoKey`) |
| `signature` | binary file | optional (or `signatureKey`) |

**Option B — `application/json` (files already on S3):**

| Field | Type | Required |
|-------|------|----------|
| `submit_latitude` | number | ✅ |
| `submit_longitude` | number | ✅ |
| `survey_statement` | string | optional |
| `photoKey` | S3 key string | ✅ (or send `photo` file) |
| `signatureKey` | S3 key string | optional |
| `reason_if_outside` | string | optional |

```json
{
  "submit_latitude": 18.9220,
  "submit_longitude": 72.8347,
  "survey_statement": "Inspection completed. All life-saving equipment serviceable. Minor deficiency noted.",
  "photoKey": "surveys/attendance/019d7c59-0000-0000-0000-000000000001/1714000000000_photo.jpg",
  "signatureKey": "surveys/attendance/019d7c59-0000-0000-0000-000000000001/1714000000000_signature.png"
}
```

**Response (success):**

```json
{
  "success": true,
  "message": "Survey report submitted successfully.",
  "data": {
    "id": "survey-uuid",
    "job_certificate_id": "019d7c59-0000-0000-0000-000000000001",
    "surveyor_id": "019c79a4-4930-71fd-aa73-887301791935",
    "survey_status": "SUBMITTED",
    "submission_count": 1,
    "start_latitude": "18.92200000",
    "start_longitude": "72.83470000",
    "submit_latitude": "18.92200000",
    "submit_longitude": "72.83470000",
    "attendance_photo_url": "surveys/attendance/.../photo.jpg",
    "signature_url": "surveys/attendance/.../signature.png",
    "survey_statement": "Inspection completed...",
    "survey_statement_status": "NOT_PREPARED",
    "signed_checklist_files": [
      { "url": "surveys/signed-checklists/.../signed_checklist.pdf", "status": "PENDING", "rejection_reason": null }
    ],
    "started_at": "2026-04-15T09:00:00.000Z",
    "submitted_at": "2026-04-15T12:00:00.000Z",
    "declaration_hash": "a3f9b2c1...",
    "createdAt": "2026-04-15T09:00:00.000Z",
    "updatedAt": "2026-04-15T12:00:00.000Z"
  }
}
```

**Error (rejected items outstanding):**

```json
{
  "success": false,
  "message": "Cannot submit report: 1 checklist items are still marked as REJECTED. Please correct them first."
}
```

**Locking behavior:**
- After `SUBMITTED`, the checklist and proof become **read-only**.
- The surveyor can only edit if the job moves back to `REWORK_REQUESTED`.
- Once TM finalizes, the survey is locked forever.

---

## 16) Read Survey Details

### 16.1 `GET /api/v1/surveys/jobs/:jobId`

**Why:** Survey detail screen — status, proof, statement, checklist summary.

**Path params:**

| Param | Type | Required |
|-------|------|----------|
| `jobId` | uuid | ✅ |

**Response (returns an array — one survey per certificate):**

```json
{
  "success": true,
  "message": "Survey details fetched successfully.",
  "data": [
    {
      "id": "survey-uuid",
      "job_certificate_id": "019d7c59-0000-0000-0000-000000000001",
      "surveyor_id": "019c79a4-4930-71fd-aa73-887301791935",
      "survey_status": "SUBMITTED",
      "submission_count": 1,
      "survey_statement": "Inspection completed.",
      "survey_statement_status": "DRAFTED",
      "survey_statement_pdf_url": "https://s3-signed-url.../survey-draft-abc123.pdf",
      "attendance_photo_url": "https://s3-signed-url.../photo.jpg",
      "signature_url": "https://s3-signed-url.../signature.png",
      "evidence_proof_url": "https://s3-signed-url.../proof.jpg",
      "started_at": "2026-04-15T09:00:00.000Z",
      "submitted_at": "2026-04-15T12:00:00.000Z",
      "finalized_at": null,
      "signed_checklist_files": [
        { "url": "https://s3-signed-url.../signed_checklist.pdf", "file_name": "signed_checklist.pdf", "status": "PENDING", "rejection_reason": null }
      ],
      "JobCertificate": {
        "id": "019d7c59-0000-0000-0000-000000000001",
        "CertificateType": { "name": "Safety Equipment Certificate" }
      },
      "User": { "name": "John Doe", "email": "surveyor@example.com" },
      "SurveyStatusHistories": [
        { "previous_status": "NOT_STARTED", "new_status": "STARTED", "reason": "Surveyor checked in", "createdAt": "2026-04-15T09:00:00.000Z" }
      ]
    }
  ]
}
```

---

### 16.2 `GET /api/v1/surveys/jobs/:jobId/timeline`

**Why:** Show GPS trace and survey event timestamps.

**Response:**

```json
{
  "success": true,
  "message": "Survey timeline fetched successfully.",
  "data": {
    "gps_trace": [
      { "latitude": "18.92200000", "longitude": "72.83470000", "timestamp": "2026-04-15T09:00:00.000Z" },
      { "latitude": "18.92210000", "longitude": "72.83480000", "timestamp": "2026-04-15T10:30:00.000Z" }
    ],
    "survey_statuses": [
      { "previous_status": "NOT_STARTED", "new_status": "STARTED", "reason": "Surveyor checked in", "createdAt": "2026-04-15T09:00:00.000Z" },
      { "previous_status": "STARTED", "new_status": "CHECKLIST_SUBMITTED", "reason": "Checklist items submitted/corrected", "createdAt": "2026-04-15T11:00:00.000Z" },
      { "previous_status": "CHECKLIST_SUBMITTED", "new_status": "SUBMITTED", "reason": "Survey report submitted", "createdAt": "2026-04-15T12:00:00.000Z" }
    ]
  }
}
```

---

## 17) Rework Loop (Granular Rejection System)

When the TM rejects specific items, the job moves to `REWORK_REQUESTED`.

### How the app handles this:

1. **Detect:** Poll `GET /api/v1/jobs` — job moves to `REWORK_REQUESTED`.
2. **Load rejected items:** Call `GET /checklists/job-certificates/:jobCertificateId`.
   - Items with `status: "REJECTED"` must be highlighted in red with `rejection_reason`.
   - Files in `signed_checklist_files` with `status: "REJECTED"` must be highlighted.
3. **Fix checklist item:** Surveyor corrects the answer/remarks/photo and calls `PUT /checklists/job-certificates/:jobCertificateId` — this resets `status` to `PENDING`.
4. **Fix signed file:** Re-upload → new S3 key → call `PUT .../signed-checklist-files` with the new key.
5. **Re-check-in:** Call `POST /surveys/start` again (allowed when `REWORK_REQUESTED`).
6. **Re-submit:** Once all `REJECTED` items are cleared, call `POST /surveys/:jobCertificateId/submit` again.

---

## 18) Non-Conformities

### 18.1 `POST /api/v1/non-conformities`

**Why:** Report a safety/technical violation found during survey. Immediately alerts TM.

**Request body:**

| Field | Type | Required |
|-------|------|----------|
| `job_id` | uuid | ✅ |
| `vessel_id` | uuid | ✅ |
| `description` | string | ✅ |
| `severity` | `LOW\|MEDIUM\|HIGH\|CRITICAL` | ✅ |

```json
{
  "job_id": "019d3ac5-3464-74f9-891e-f6eda7ee366c",
  "vessel_id": "019cbf1d-d9c1-732d-8d10-f866bb6e9dec",
  "description": "Lifeboat engine failing to start after 3 attempts.",
  "severity": "HIGH"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "nc-uuid",
    "job_id": "019d3ac5-3464-74f9-891e-f6eda7ee366c",
    "vessel_id": "019cbf1d-d9c1-732d-8d10-f866bb6e9dec",
    "description": "Lifeboat engine failing to start after 3 attempts.",
    "severity": "HIGH",
    "status": "OPEN",
    "createdAt": "2026-04-15T10:00:00.000Z",
    "updatedAt": "2026-04-15T10:00:00.000Z"
  }
}
```

---

### 18.2 `GET /api/v1/non-conformities/job/:jobId`

**Why:** See all NCs currently active for this job.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "nc-uuid",
      "severity": "HIGH",
      "status": "OPEN",
      "description": "Lifeboat engine failing to start after 3 attempts.",
      "createdAt": "2026-04-15T10:00:00.000Z"
    }
  ]
}
```

---

## 19) Vessel Documents

### `GET /api/v1/documents/vessel/:vesselId`

**Why:** View vessel's existing certificates and documents to prepare for survey.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "doc-uuid",
      "vessel_id": "vessel-uuid",
      "document_type": "CERTIFICATE",
      "file_url": "https://s3-signed-url.../doc.pdf",
      "description": "Previous Safety Equipment Certificate",
      "expiry_date": "2025-12-31",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## 20) Notifications

### 20.1 `GET /api/v1/notifications`

**Why:** Show rework requests, new assignments, status changes.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "notif-uuid",
      "user_id": "019c79a4-4930-71fd-aa73-887301791935",
      "title": "Rework Requested",
      "message": "Please re-upload photos for the Safety Equipment checklist. Some photos are blurry.",
      "type": "REWORK",
      "is_read": false,
      "created_at": "2026-04-15T13:00:00.000Z"
    },
    {
      "id": "notif-uuid-2",
      "title": "New Job Assigned",
      "message": "You have been assigned to MV Pacific Guardian — Safety Equipment Certificate.",
      "type": "JOB_ASSIGNED",
      "is_read": true,
      "created_at": "2026-04-10T09:00:00.000Z"
    }
  ]
}
```

---

### 20.2 `PUT /api/v1/notifications/:id/read`

**Why:** Mark a single notification as read.

**Response:**

```json
{ "success": true, "message": "Request successful" }
```

---

### 20.3 `PUT /api/v1/notifications/read-all`

**Why:** Mark all notifications as read.

**Response:**

```json
{ "success": true, "message": "Request successful" }
```

---

### 20.4 `GET /api/v1/notifications/preferences`

**Response:**

```json
{
  "success": true,
  "data": {
    "email_notifications": true,
    "push_notifications": true,
    "sms_notifications": false
  }
}
```

---

### 20.5 `PUT /api/v1/notifications/preferences`

**Request body:**

```json
{
  "email_notifications": true,
  "push_notifications": false
}
```

---

## 21) Generic Documents Module

For uploading/registering documents not tied to checklist evidence.

### 21.1 `GET /api/v1/documents/get-upload-url`

**Query params:**

| Param | Type | Required |
|-------|------|----------|
| `fileName` | string | ✅ |
| `fileType` | string (MIME) | ✅ |
| `folder` | string | optional (e.g. `surveys`) |

**Response:**

```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://s3-presigned-put-url",
    "fileKey": "surveys/1714000000000_report.pdf"
  }
}
```

---

### 21.2 `POST /api/v1/documents/register`

**Why:** Register an already-uploaded S3 document in the backend.

**Request body:**

| Field | Type | Required |
|-------|------|----------|
| `fileKey` | string (S3 key) | ✅ |
| `fileType` | string (MIME) | optional |
| `document_type` | string | optional |
| `description` | string | optional |

```json
{
  "fileKey": "surveys/1714000000000_report.pdf",
  "fileType": "application/pdf",
  "document_type": "EVIDENCE",
  "description": "Survey attachment"
}
```

**Response:**

```json
{ "success": true, "message": "Request successful" }
```

---

## 22) Surveyor Self-Utilities

### 22.1 `POST /api/v1/surveyors/availability`

**Why:** Mark yourself available/unavailable for new assignments.

**Request body:**

| Field | Type | Required |
|-------|------|----------|
| `is_available` | boolean | ✅ |

```json
{ "is_available": true }
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "profile-uuid",
    "user_id": "019c79a4-4930-71fd-aa73-887301791935",
    "is_available": true,
    "license_number": "SRV-2024-001",
    "updatedAt": "2026-04-15T08:00:00.000Z"
  }
}
```

---

### 22.2 `POST /api/v1/surveyors/location`

**Why:** Passive background location updates (separate from in-survey GPS streaming).

**Request body:**

| Field | Type | Required |
|-------|------|----------|
| `latitude` | number | ✅ |
| `longitude` | number | ✅ |

```json
{ "latitude": 18.9220, "longitude": 72.8347 }
```

**Response:**

```json
{ "success": true, "data": { "success": true } }
```

---

### 22.3 `GET /api/v1/surveyors/:id/profile`

**Why:** Profile screen — authorized certificates, license info, contact details.

**Path params:**

| Param | Type | Required |
|-------|------|----------|
| `id` | uuid (user id) | ✅ |

**Response:**

```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "id": "profile-uuid",
    "user_id": "019c79a4-4930-71fd-aa73-887301791935",
    "license_number": "SRV-2024-001",
    "authorized_ship_types": ["BULK_CARRIER", "TANKER"],
    "authorized_certificates": ["Safety Equipment Certificate", "Load Line Certificate"],
    "valid_from": "2024-01-01T00:00:00.000Z",
    "valid_to": "2027-12-31T00:00:00.000Z",
    "is_available": true,
    "nationality": "Indian",
    "qualification": "Master Mariner",
    "years_of_experience": 12,
    "cv_url": "https://s3-signed-url.../cv.pdf",
    "id_proof_url": "https://s3-signed-url.../id_proof.pdf",
    "license_copy_url": "https://s3-signed-url.../license.pdf",
    "User": {
      "id": "019c79a4-4930-71fd-aa73-887301791935",
      "name": "John Doe",
      "email": "surveyor@example.com",
      "phone": "+919876543210",
      "role": "SURVEYOR",
      "status": "ACTIVE"
    },
    "application": null
  }
}
```

---

### 22.4 `GET /api/v1/surveyors/:id/authorization-checklist`

**Why:** See which vessel types and certificate types this surveyor is authorized for.

**Response:**

```json
{
  "success": true,
  "data": {
    "vessel_types": [
      { "type": "BULK_CARRIER", "is_authorized": true },
      { "type": "TANKER", "is_authorized": false }
    ],
    "certificate_types": [
      { "id": "cert-type-uuid", "name": "Safety Equipment Certificate", "is_authorized": true },
      { "id": "cert-type-uuid-2", "name": "Load Line Certificate", "is_authorized": true }
    ]
  }
}
```

---

## 23) Survey Status Reference

### Job Statuses (relevant to SURVEYOR)

| Status | Meaning |
|--------|---------|
| `ASSIGNED` | Surveyor assigned, waiting for survey authorization |
| `SURVEY_AUTHORIZED` | Surveyor can check-in and start |
| `IN_PROGRESS` | Survey started (check-in done) |
| `SURVEY_DONE` | All certificates submitted |
| `REWORK_REQUESTED` | TM rejected some items — surveyor must fix |

### Survey Statuses (per JobCertificate)

| Status | Meaning |
|--------|---------|
| `NOT_STARTED` | Survey not yet started |
| `STARTED` | Checked in (GPS + timestamp recorded) |
| `CHECKLIST_SUBMITTED` | Checklist answers saved |
| `PROOF_UPLOADED` | Evidence proof uploaded |
| `SUBMITTED` | Final report submitted |
| `REWORK_REQUIRED` | This certificate needs correction |
| `FINALIZED` | TM finalized — locked forever |

### JobCertificate Statuses

| Status | Meaning |
|--------|---------|
| `PENDING` | Awaiting document verification |
| `DOCUMENT_VERIFIED` | Documents verified |
| `SURVEY_AUTHORIZED` | Ready for survey |
| `REWORK_REQUESTED` | Specific certificate needs rework |
| `SURVEY_DONE` | Certificate survey complete |
| `ISSUED` | Certificate issued |
| `REJECTED` | Rejected (terminal) |

---

## 24) Multi-Certificate Jobs: Practical Notes

When a job has **multiple certificates**, each certificate has its own `jobCertificateId`:

1. After `POST /surveys/start`, surveys are created for **all** survey-required certificates.
2. The surveyor must complete checklist/proof/submit for **each** `jobCertificateId`.
3. The job only moves to `SURVEY_DONE` when **all** certificates are submitted.
4. Use `GET /api/v1/jobs/:id` to see the `certificates` array and track which ones are done.

**Certificate loop for multi-cert flow:**

```
FOR EACH certificate IN job.certificates WHERE certificate.status == "SURVEY_AUTHORIZED":
  1. GET  /checklists/job-certificates/<certificate.id>
  2. PUT  /checklists/job-certificates/<certificate.id>         (save answers)
  3. GET  /checklists/job-certificates/<certificate.id>/get-upload-url → S3
  4. PUT  /checklists/job-certificates/<certificate.id>/signed-checklist-files
  5. GET  /checklists/job-certificates/<certificate.id>/signed-checklist-upload-url → S3
  6. POST /surveys/<certificate.id>/proof                        (upload evidence)
  7. POST /surveys/<certificate.id>/submit                       (submit)
END FOR
```

---

## 25) Error Code Quick Reference

| HTTP | Error Scenario | Typical Message |
|------|---------------|-----------------|
| `400` | Job not in correct state | `This action can only be performed when the job is in ... state.` |
| `400` | No checklist answers | `Please complete the inspection checklist before submitting.` |
| `400` | No signed checklist scan | `Please upload the filled and signed checklist document.` |
| `400` | Rejected items outstanding | `Cannot submit report: N checklist items are still marked as REJECTED.` |
| `400` | No attendance photo | `Attendance photo is mandatory before submitting survey.` |
| `400` | No GPS on submit | `GPS location must be recorded onsite before submission.` |
| `400` | Survey finalized | `Survey is finalized and cannot be modified.` |
| `400` | Survey not started | `The survey has not been started yet. Please check-in first.` |
| `403` | Wrong surveyor | `You are not the assigned surveyor for this job.` |
| `404` | Job not found | `Job not found` |
| `404` | Certificate not found | `Job certificate not found` |
| `409` | Survey already started | `Survey already started for this job. Please continue the survey in progress.` |
