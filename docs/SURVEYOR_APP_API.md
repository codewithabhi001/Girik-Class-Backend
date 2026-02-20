# Girik — Surveyor App API Reference
### Complete Guide for Frontend / Mobile Developers
**Last updated:** 2026-02-20 | **Base URL:** `https://api.girikship.com/api/v1`

---

> **For every request:**
> - `Authorization: Bearer <accessToken>` header required
> - The `accessToken` is obtained from Login and must be refreshed using the refresh token
> - All timestamps are **UTC ISO 8601** (e.g., `2026-02-20T08:30:00.000Z`)
> - All IDs are **UUID v7** strings

---

## Table of Contents
1. [Authentication](#1-authentication)
2. [My Jobs — What the Surveyor Sees](#2-my-jobs)
3. [Survey Flow — Step by Step](#3-survey-flow)
   - [Step 1: Check-In (Start Survey)](#step-1-check-in)
   - [Step 2: Submit Checklist](#step-2-submit-checklist)
   - [Step 3: Upload Proof](#step-3-upload-proof)
   - [Step 3b: Stream GPS Location](#step-3b-stream-gps-location)
   - [Step 4: Check-Out (Submit Report)](#step-4-check-out--submit-report)
4. [Non-Conformities (Defects)](#4-non-conformities)
5. [Job Documents](#5-job-documents)
6. [Notifications](#6-notifications)
7. [Rework — What Happens & How to Handle It](#7-rework--what-to-do)
8. [Survey Timeline](#8-survey-timeline)
9. [Status Reference](#9-status-reference)
10. [Error Reference](#10-error-reference)

---

## 1. Authentication

### Login
**`POST /auth/login`** — *No auth header needed*

```http
POST /api/v1/auth/login
Content-Type: application/json
```
```json
{
  "email": "surveyor@girikship.com",
  "password": "your_password"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "user": {
      "id": "019c7a11-aaaa-7000-b000-000000000001",
      "name": "Rajan Mehta",
      "email": "surveyor@girikship.com",
      "role": "SURVEYOR",
      "status": "ACTIVE"
    }
  }
}
```

**Store both tokens.** `accessToken` expires (check `exp` claim in JWT). Use the refresh endpoint when it does.

---

### Refresh Access Token
**`POST /auth/refresh`**

```json
{ "refreshToken": "eyJhbGci..." }
```

**Response `200`:**
```json
{
  "success": true,
  "data": { "accessToken": "eyJhbGci..." }
}
```

---

### Get My Profile
**`GET /auth/me`**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Rajan Mehta",
    "role": "SURVEYOR",
    "email": "surveyor@girikship.com"
  }
}
```

---

## 2. My Jobs

The Surveyor can only see jobs that are **assigned to them**. Filtering is enforced server-side.

### List My Jobs
**`GET /jobs`**

```http
GET /api/v1/jobs
Authorization: Bearer <accessToken>
```

**Optional Query Params:**

| Param | Type | Example | Notes |
|:---|:---|:---|:---|
| `status` | string | `SURVEY_AUTHORIZED` | Filter by job status |
| `page` | number | `1` | Default: 1 |
| `limit` | number | `10` | Default: 10 |

**Surveyor-specific statuses you'll see:**
- `SURVEY_AUTHORIZED` — Ready to start. Show "Start Survey" button.
- `IN_PROGRESS` — Survey is running. Show "Continue" button.
- `SURVEY_DONE` — Submitted. Waiting for office review.
- `REWORK_REQUESTED` — Rework needed. Show alert + reason.
- `FINALIZED` — Done.
- `CERTIFIED` — Certificate issued.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "jobs": [
      {
        "id": "019c7a11-72db-74ed-b8a9-5baeefbaa937",
        "job_status": "SURVEY_AUTHORIZED",
        "target_port": "Singapore",
        "target_date": "2026-03-01T00:00:00.000Z",
        "Vessel": {
          "id": "uuid",
          "vessel_name": "MV Sea Eagle",
          "imo_number": "IMO1234567"
        },
        "CertificateType": {
          "id": "uuid",
          "name": "Annual Survey",
          "issuing_authority": "CLASS"
        }
      }
    ]
  }
}
```

---

### Get Single Job Detail
**`GET /jobs/:jobId`**

```http
GET /api/v1/jobs/019c7a11-72db-74ed-b8a9-5baeefbaa937
Authorization: Bearer <accessToken>
```

**Response includes:** Full vessel info, certificate type, current status, linked certificate (if issued), status history.

```json
{
  "success": true,
  "data": {
    "id": "019c7a11-72db-74ed-b8a9-5baeefbaa937",
    "job_status": "SURVEY_AUTHORIZED",
    "target_port": "Singapore",
    "target_date": "2026-03-01T00:00:00.000Z",
    "Vessel": {
      "id": "uuid",
      "vessel_name": "MV Sea Eagle",
      "imo_number": "IMO1234567"
    },
    "CertificateType": {
      "name": "Annual Survey",
      "issuing_authority": "CLASS"
    },
    "JobStatusHistories": [
      { "new_status": "CREATED", "changed_at": "2026-02-18T05:00:00Z" },
      { "new_status": "APPROVED", "changed_at": "2026-02-18T06:00:00Z" },
      { "new_status": "SURVEY_AUTHORIZED", "changed_at": "2026-02-19T09:00:00Z" }
    ]
  }
}
```

---

## 3. Survey Flow

> ⚠️ **These 4 steps must be done IN ORDER. Each step unlocks the next.**

```
Step 1: POST /surveys/start          → Survey STARTED, Job IN_PROGRESS
Step 2: PUT  /checklists/jobs/:id/checklist → Survey CHECKLIST_SUBMITTED
Step 3: POST /surveys/jobs/:id/proof → Survey PROOF_UPLOADED
Step 4: POST /surveys                → Survey SUBMITTED, Job SURVEY_DONE
```

---

### Step 1: Check-In

> **Trigger:** Surveyor arrives at the vessel location and taps "Start Survey" in the app.
> **Requires:** Job status = `SURVEY_AUTHORIZED`

**`POST /surveys/start`**

```http
POST /api/v1/surveys/start
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```json
{
  "job_id": "019c7a11-72db-74ed-b8a9-5baeefbaa937",
  "latitude": 1.3521,
  "longitude": 103.8198
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Survey started successfully.",
  "data": {
    "survey_id": "019c7a11-cccc-7000-d000-000000000002",
    "job_id": "019c7a11-72db-74ed-b8a9-5baeefbaa937"
  }
}
```

**Save the `survey_id` locally** — you'll need it for the timeline endpoint.

> **After this:** Job becomes `IN_PROGRESS`. Survey becomes `STARTED`.

**Errors:**
| Code | Message | What to show |
|:---|:---|:---|
| `400` | `This action requires job to be in: SURVEY_AUTHORIZED. Current: IN_PROGRESS` | "Survey already started" |
| `400` | `Survey cannot be started: already in STARTED state.` | "Survey already started" |
| `403` | `You are not the assigned surveyor for this job.` | Show error and go back |

---

### Step 2: Submit Checklist

> **Trigger:** Surveyor completes all inspection checklist items.
> **Requires:** Survey status = `STARTED` (or `REWORK_REQUIRED`)

**`PUT /checklists/jobs/:jobId/checklist`**

```http
PUT /api/v1/checklists/jobs/019c7a11-72db-74ed-b8a9-5baeefbaa937/checklist
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```json
{
  "items": [
    {
      "question_code": "HUL-01",
      "question_text": "Hull integrity — no visible damage or deformation",
      "answer": "YES",
      "remarks": "Hull in good condition",
      "file_url": null
    },
    {
      "question_code": "ENG-01",
      "question_text": "Engine room — oil leaks present",
      "answer": "NO",
      "remarks": "Minor seepage near port shaft seal noted"
    },
    {
      "question_code": "NAV-01",
      "question_text": "Navigation lights operational",
      "answer": "NA",
      "remarks": "Not applicable — daytime inspection"
    }
  ]
}
```

**Fields:**
| Field | Type | Required | Values |
|:---|:---|:---|:---|
| `question_code` | string | ✅ | Any string code |
| `question_text` | string | ✅ | Full question text |
| `answer` | string | ✅ | `"YES"` / `"NO"` / `"NA"` |
| `remarks` | string | ❌ | Free text notes |
| `file_url` | string | ❌ | Photo URL if attached |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "question_code": "HUL-01", "answer": "YES" },
    { "id": "uuid", "question_code": "ENG-01", "answer": "NO" }
  ]
}
```

> **After this:** Survey becomes `CHECKLIST_SUBMITTED`.

> 💡 **Re-submission:** You can re-submit the checklist multiple times while in `STARTED` or `REWORK_REQUIRED`. Previous items are replaced.

**Errors:**
| Code | Message | What to show |
|:---|:---|:---|
| `400` | `Checklist can only be submitted when survey is STARTED or REWORK_REQUIRED. Current: SUBMITTED` | "Cannot edit after submission" |
| `400` | `Survey is finalized and cannot be modified.` | "Survey is complete" |

---

### GET Checklist (Read-Only)
**`GET /checklists/jobs/:jobId/checklist`**

```http
GET /api/v1/checklists/jobs/019c7a11-72db-74ed-b8a9-5baeefbaa937/checklist
Authorization: Bearer <accessToken>
```

**Optional query params:** `?answer=NO` or `?search=engine`

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "question_code": "HUL-01", "question_text": "...", "answer": "YES", "remarks": "..." }
  ]
}
```

---

### Step 3: Upload Proof

> **Trigger:** Surveyor takes photos of the vessel / evidence.
> **Requires:** Survey status = `CHECKLIST_SUBMITTED` (or `REWORK_REQUIRED`)

**`POST /surveys/jobs/:jobId/proof`**

```http
POST /api/v1/surveys/jobs/019c7a11-72db-74ed-b8a9-5baeefbaa937/proof
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Form Fields:**
| Field | Type | Required |
|:---|:---|:---|
| `proof` | file (jpg/png/pdf) | ✅ |

```
Form:
  proof: [FILE BINARY]
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Proof uploaded successfully.",
  "data": {
    "url": "https://cdn.girikship.com/surveys/proof/2026-02/proof_abc123.jpg"
  }
}
```

> **After this:** Survey becomes `PROOF_UPLOADED`.

**Errors:**
| Code | Message | What to show |
|:---|:---|:---|
| `400` | `No proof file uploaded.` | "Please select a file" |
| `400` | `Proof can only be uploaded when survey is CHECKLIST_SUBMITTED or REWORK_REQUIRED. Current: STARTED` | "Submit checklist first" |
| `400` | `Survey is finalized and cannot be modified.` | "Survey is already complete" |

---

### Step 3b: Stream GPS Location

> **Trigger:** Call periodically (every 30–60 sec) while on-site. Non-blocking background call.
> **Requires:** Survey in `STARTED`, `CHECKLIST_SUBMITTED`, or `PROOF_UPLOADED`

**`POST /surveys/jobs/:jobId/location`**

```http
POST /api/v1/surveys/jobs/019c7a11-72db-74ed-b8a9-5baeefbaa937/location
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```json
{
  "latitude": 1.3521,
  "longitude": 103.8198
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Location recorded.",
  "data": { "id": "uuid", "latitude": 1.3521, "longitude": 103.8198 }
}
```

> Silently ignore errors from this endpoint in the UI — it's non-critical telemetry.

---

### Step 4: Check-Out / Submit Report

> **Trigger:** Surveyor is done with inspection. Submits final report with GPS checkout and attendance photo.
> **Requires:** Survey status = `PROOF_UPLOADED` (or `REWORK_REQUIRED`)

**`POST /surveys`**

```http
POST /api/v1/surveys
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Form Fields:**
| Field | Type | Required | Notes |
|:---|:---|:---|:---|
| `job_id` | string (UUID) | ✅ | The job being surveyed |
| `gps_latitude` | number | ✅ | Checkout GPS latitude |
| `gps_longitude` | number | ✅ | Checkout GPS longitude |
| `survey_statement` | string | ✅ | Surveyor's written findings and remarks |
| `photo` | file (jpg/png) | Optional | Attendance selfie / site photo |

**Response `201`:**
```json
{
  "success": true,
  "message": "Survey report submitted successfully.",
  "data": {
    "id": "uuid",
    "survey_status": "SUBMITTED",
    "submission_count": 1,
    "submitted_at": "2026-02-20T08:15:00.000Z",
    "gps_latitude": 1.3521,
    "gps_longitude": 103.8198
  }
}
```

> **After this:**
> - Survey → `SUBMITTED`
> - Job → `SURVEY_DONE` *(auto-synced)*
> - Office (TM/TO) is now responsible for review and finalization

**Errors:**
| Code | Message | What to show |
|:---|:---|:---|
| `400` | `Survey cannot be submitted from STARTED state. Upload proof first.` | "Please upload evidence first" |
| `400` | `Checklist must be submitted before the survey report.` | "Please fill in the checklist" |
| `400` | `Survey submission is not allowed when job is PAYMENT_DONE.` | "Job has already been processed" |

---

## 4. Non-Conformities

Non-Conformities (NCs) are defects or findings that need to be recorded during inspection. The surveyor creates them; TM must close them before finalization.

### Create a NC
**`POST /non-conformities`**

```http
POST /api/v1/non-conformities
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```json
{
  "job_id": "019c7a11-72db-74ed-b8a9-5baeefbaa937",
  "description": "Port shaft seal is leaking engine oil. Requires immediate attention.",
  "severity": "MAJOR"
}
```

**Severity values:** `"MINOR"` | `"MAJOR"` | `"CRITICAL"`

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "job_id": "uuid",
    "description": "Port shaft seal is leaking engine oil...",
    "severity": "MAJOR",
    "status": "OPEN"
  }
}
```

> ⚠️ **Important:** If there are any `OPEN` NCs, the survey **cannot be finalized** by TM and a **certificate cannot be generated**. NCs must be `CLOSED` first.

### List NCs for a Job
**`GET /non-conformities?job_id=:jobId`**

```http
GET /api/v1/non-conformities?job_id=019c7a11-72db-74ed-b8a9-5baeefbaa937
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "description": "Port shaft seal is leaking...",
      "severity": "MAJOR",
      "status": "OPEN",
      "created_at": "2026-02-20T08:00:00Z"
    }
  ]
}
```

**NC Status values:** `OPEN` | `CLOSED` | `RESOLVED`

---

## 5. Job Documents

### Upload a Document
**`POST /documents`**

```http
POST /api/v1/documents
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Form Fields:**
| Field | Type | Required |
|:---|:---|:---|
| `entity_type` | string | ✅ — Use `"JOB"` |
| `entity_id` | string (UUID) | ✅ — The job ID |
| `document_type` | string | ✅ — e.g. `"INSPECTION_REPORT"`, `"PHOTO"` |
| `description` | string | ❌ |
| `file` | file | ✅ |

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "file_url": "https://cdn.girikship.com/documents/...",
    "document_type": "INSPECTION_REPORT"
  }
}
```

### Get Documents for a Job
**`GET /documents/job/:jobId`**

```http
GET /api/v1/documents/job/019c7a11-72db-74ed-b8a9-5baeefbaa937
Authorization: Bearer <accessToken>
```

---

## 6. Notifications

### Get My Notifications
**`GET /notifications`**

```http
GET /api/v1/notifications
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "JOB_ASSIGNED",
      "message": "You have been assigned to MV Sea Eagle — Singapore",
      "is_read": false,
      "created_at": "2026-02-19T09:00:00Z"
    },
    {
      "id": "uuid",
      "type": "JOB_FINALIZED",
      "message": "Survey for MV Sea Eagle has been finalized.",
      "is_read": false
    }
  ]
}
```

**Notification types the Surveyor receives:**
| Type | When |
|:---|:---|
| `JOB_ASSIGNED` | When a job is assigned to the surveyor |
| `JOB_SENT_BACK` | When rework is requested |
| `JOB_FINALIZED` | When TM finalizes the survey |

### Mark Notification as Read
**`PUT /notifications/:notificationId/read`**

---

## 7. Rework — What to Do

When the office (TM/GM) is unhappy with the survey submission, they request rework. The surveyor gets a `JOB_SENT_BACK` notification.

**What the surveyor sees:**
- Job status → `REWORK_REQUESTED`
- Survey status → `REWORK_REQUIRED`

**What the surveyor must do (same 3 steps, in order):**

```
1. PUT  /checklists/jobs/:jobId/checklist  ← re-fill checklist
2. POST /surveys/jobs/:jobId/proof         ← re-upload evidence
3. POST /surveys                           ← re-submit report
```

The `submission_count` increments on each re-submission. History tracks every iteration.

**How to detect rework state:**
```JSON
// From GET /jobs/:jobId
{
  "job_status": "REWORK_REQUESTED"
}
// Plus check survey status from GET /surveys/jobs/:jobId/timeline
{
  "survey_details": {
    "survey_status": "REWORK_REQUIRED"
  }
}
```

---

## 8. Survey Timeline

Get the full GPS trace and status history for a job's survey.

**`GET /surveys/jobs/:jobId/timeline`**

```http
GET /api/v1/surveys/jobs/019c7a11-72db-74ed-b8a9-5baeefbaa937/timeline
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "job_id": "019c7a11-72db-74ed-b8a9-5baeefbaa937",
    "gps_trace": [
      { "latitude": 1.3521, "longitude": 103.8198, "timestamp": "2026-02-20T05:00:00Z" },
      { "latitude": 1.3522, "longitude": 103.8199, "timestamp": "2026-02-20T05:30:00Z" }
    ],
    "survey_details": {
      "id": "uuid",
      "survey_status": "SUBMITTED",
      "submission_count": 1,
      "started_at": "2026-02-20T05:00:00Z",
      "submitted_at": "2026-02-20T08:15:00Z",
      "SurveyStatusHistories": [
        { "previous_status": null, "new_status": "STARTED", "created_at": "..." },
        { "previous_status": "STARTED", "new_status": "CHECKLIST_SUBMITTED", "created_at": "..." },
        { "previous_status": "CHECKLIST_SUBMITTED", "new_status": "PROOF_UPLOADED", "created_at": "..." },
        { "previous_status": "PROOF_UPLOADED", "new_status": "SUBMITTED", "created_at": "..." }
      ]
    }
  }
}
```

---

## 9. Status Reference

### Job Status — Surveyor View

| Status | What it means | Surveyor Action |
|:---|:---|:---|
| `SURVEY_AUTHORIZED` | ✅ Ready. Start button active. | `POST /surveys/start` |
| `IN_PROGRESS` | 🔄 Survey running. | Fill checklist, upload proof |
| `SURVEY_DONE` | ⏳ Submitted. Waiting for office. | None — wait |
| `REWORK_REQUESTED` | ⚠️ Rework needed. | Redo steps 2, 3, 4 |
| `REVIEWED` | 📋 Reviewed by TO. Waiting for TM. | None — wait |
| `FINALIZED` | ✅ Approved by TM. | None |
| `PAYMENT_DONE` | 💳 Payment received. | None |
| `CERTIFIED` | 🏆 Certificate issued! | View certificate |
| `REJECTED` | ❌ Job rejected. | No further action |

---

### Survey Status — Surveyor View

| Status | What it means | Next Step |
|:---|:---|:---|
| `NOT_STARTED` | Initialized, not started yet | `POST /surveys/start` |
| `STARTED` | Checked in | `PUT /checklists/jobs/:id/checklist` |
| `CHECKLIST_SUBMITTED` | Checklist done | `POST /surveys/jobs/:id/proof` |
| `PROOF_UPLOADED` | Evidence uploaded | `POST /surveys` (submit) |
| `SUBMITTED` | Report submitted | Wait for office |
| `REWORK_REQUIRED` | Must redo | Redo checklist → proof → submit |
| `FINALIZED` | 🔒 Locked. Done. | Nothing |

---

## 10. Error Reference

### Error Response Format
Every error returns this shape:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Descriptive error message here"
}
```

### Error Code Guide

| HTTP Code | Meaning | Common Causes |
|:---|:---|:---|
| `400` | Bad Request | Wrong order (e.g. proof before checklist), wrong job state |
| `401` | Unauthorized | Token missing, expired, or invalid |
| `403` | Forbidden | Not the assigned surveyor, or wrong role |
| `404` | Not Found | Job or survey doesn't exist |
| `409` | Conflict | Duplicate action (double start, double submit) |
| `422` | Validation Error | Missing required field, wrong type |
| `500` | Server Error | Report to backend team with timestamp |

### Important 400 Errors & How to Handle Them

| Message | Handle By |
|:---|:---|
| `This action requires job to be in: SURVEY_AUTHORIZED` | Refresh job status, show current state |
| `Survey cannot be started: already in STARTED state.` | Navigate to ongoing survey screen |
| `Checklist can only be submitted when survey is STARTED or REWORK_REQUIRED` | Refresh survey state |
| `Proof can only be uploaded when survey is CHECKLIST_SUBMITTED or REWORK_REQUIRED` | Tell user to submit checklist first |
| `Survey cannot be submitted from STARTED state. Upload proof first.` | Tell user to upload evidence |
| `Checklist must be submitted before the survey report.` | Tell user to fill checklist |
| `Location can only be streamed during an active survey.` | Stop GPS polling silently |

---

## Complete API List (Surveyor Role)

| # | Method | Endpoint | Action |
|:---|:---|:---|:---|
| 1 | POST | `/auth/login` | Login |
| 2 | POST | `/auth/refresh` | Refresh token |
| 3 | GET | `/auth/me` | My profile |
| 4 | GET | `/jobs` | My assigned jobs |
| 5 | GET | `/jobs/:id` | Job details |
| 6 | **POST** | **`/surveys/start`** | **Step 1: Check-in** |
| 7 | **PUT** | **`/checklists/jobs/:jobId/checklist`** | **Step 2: Checklist** |
| 8 | GET | `/checklists/jobs/:jobId/checklist` | Get checklist |
| 9 | **POST** | **`/surveys/jobs/:jobId/proof`** | **Step 3: Upload proof** |
| 10 | POST | `/surveys/jobs/:jobId/location` | GPS ping |
| 11 | **POST** | **`/surveys`** | **Step 4: Check-out** |
| 12 | GET | `/surveys/jobs/:jobId/timeline` | Survey timeline |
| 13 | POST | `/non-conformities` | Log a NC / defect |
| 14 | GET | `/non-conformities?job_id=` | List NCs for job |
| 15 | POST | `/documents` | Upload document |
| 16 | GET | `/documents/job/:jobId` | Get job documents |
| 17 | GET | `/notifications` | Get notifications |
| 18 | PUT | `/notifications/:id/read` | Mark notification read |

---

## Surveyor App State Machine

Use this to decide which screen/buttons to show based on job status:

```
┌─────────────────────────────────────────────────────────┐
│ Job Status        │ Show Screen              │ CTA       │
├───────────────────┼──────────────────────────┼───────────┤
│ SURVEY_AUTHORIZED │ Ready to Start           │ Start     │
│ IN_PROGRESS       │ Survey in Progress       │ Continue  │
│   survey=STARTED  │   → Show checklist form  │           │
│   survey=CHECKLIST│   → Show proof upload    │           │
│   survey=PROOF    │   → Show checkout form   │           │
│ SURVEY_DONE       │ Submitted — Awaiting     │ (read)    │
│ REWORK_REQUESTED  │ ⚠️ Rework Needed         │ Fix & Re- │
│                   │   Show rework reason     │  submit   │
│ REVIEWED          │ Under Final Review       │ (read)    │
│ FINALIZED         │ ✅ Approved              │ (read)    │
│ PAYMENT_DONE      │ Payment Cleared          │ (read)    │
│ CERTIFIED         │ 🏆 Certificate Issued    │ View Cert │
│ REJECTED          │ ❌ Job Rejected          │ (read)    │
└───────────────────┴──────────────────────────┴───────────┘
```

---

## Suggested UI Flow

```
App Launch
  └─→ Login Screen → POST /auth/login
        └─→ Home Screen / Job List → GET /jobs?status=SURVEY_AUTHORIZED,IN_PROGRESS,REWORK_REQUESTED

Tap a Job
  └─→ Job Detail Screen → GET /jobs/:id
        ├─→ if SURVEY_AUTHORIZED: Show [Start Survey] button
        ├─→ if IN_PROGRESS: Show [Continue Survey] based on survey_status from timeline
        ├─→ if REWORK_REQUESTED: Show rework banner + [Re-submit] flow
        └─→ if CERTIFIED: Show [View Certificate] button

Survey Flow
  └─→ Step 1: Check-in Screen
        ├─→ Get GPS coordinates from device
        └─→ POST /surveys/start → { job_id, latitude, longitude }
  └─→ Step 2: Checklist Screen
        ├─→ GET /checklists/jobs/:id/checklist (load existing if any)
        └─→ PUT /checklists/jobs/:id/checklist → { items: [...] }
  └─→ Step 3: Proof Upload Screen
        └─→ POST /surveys/jobs/:id/proof → multipart file
  └─→ Step 4: Checkout Screen
        ├─→ Get GPS coordinates from device
        ├─→ Type findings in survey_statement field
        ├─→ Take/upload attendance photo
        └─→ POST /surveys → multipart form
```
