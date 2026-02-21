# Job Request Creation — Complete Frontend Developer Guide

> **Base URL:** `http://localhost:3000/api/v1` (dev) / `https://api.girikship.com/api/v1` (prod)  
> **Auth:** All API calls (except `/auth/login`) require `Authorization: Bearer <token>` header.  
> **Who can create a job:** `CLIENT`, `ADMIN`, `GM` roles only.

---

## Overview — 4 Steps to Create a Job

```
Step 1 → Pick a Vessel         (GET /vessels)
Step 2 → Pick a Certificate    (GET /certificates/types → GET /certificates/types/:id)
Step 3 → Upload Documents      (POST /documents/upload  — for each required doc)
Step 4 → Submit Job Request    (POST /jobs)
```

---

## Step 1 — Load User's Vessels

Fetch the list of vessels the logged-in user can submit a job for.

### `GET /api/v1/vessels`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 3,
    "vessels": [
      {
        "id": "019c574f-0991-7758-b696-03bb416c7433",
        "vessel_name": "MV Pacific Star",
        "imo_number": "9123456",
        "ship_type": "Cargo",
        "flag_administration_id": "...",
        "class_status": "ACTIVE"
      }
    ]
  }
}
```

**Notes:**
- `CLIENT` role automatically sees **only their own fleet** (scoped by `client_id`).
- `ADMIN` / `GM` see all vessels — in this case, add a vessel search/filter in the UI.
- Store the selected vessel's `id` → used in Step 4.

---

## Step 2A — Load Certificate Type List (Minimal)

Show a dropdown/list of available certificate types.

### `GET /api/v1/certificates/types`

**Query Params (optional):**
| Param | Type | Description |
|---|---|---|
| `include_inactive` | boolean | Pass `true` only for ADMIN/GM to show inactive types |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "019c79a4-55ba-773c-9454-f6bee169ab03",
      "name": "Class Certificate",
      "issuing_authority": "CLASS",
      "validity_years": 5,
      "status": "ACTIVE",
      "requires_survey": true
    },
    {
      "id": "019c79a4-5835-7341-b4db-656f310a9b44",
      "name": "Safety Management Certificate",
      "issuing_authority": "CLASS",
      "validity_years": 5,
      "status": "ACTIVE",
      "requires_survey": true
    }
  ]
}
```

**Notes:**
- Display only `ACTIVE` types in the dropdown (default behaviour).
- `requires_survey: true` means the job will require a survey — show a note to the user ("This certificate requires an on-site survey").
- Store the selected type's `id` → used in Steps 2B and 4.

---

## Step 2B — Load Certificate Type Detail (Required Documents)

Once the user selects a certificate type, fetch its full detail to know **which documents must be uploaded**.

### `GET /api/v1/certificates/types/:id`

**Example:** `GET /api/v1/certificates/types/019c79a4-55ba-773c-9454-f6bee169ab03`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "019c79a4-55ba-773c-9454-f6bee169ab03",
    "name": "Class Certificate",
    "issuing_authority": "CLASS",
    "validity_years": 5,
    "status": "ACTIVE",
    "description": "Annual classification survey certificate issued by Classification Society",
    "requires_survey": true,
    "CertificateRequiredDocuments": [
      {
        "id": "019c79a4-0001-0000-0000-000000000001",
        "document_name": "Registry Certificate",
        "is_mandatory": true
      },
      {
        "id": "019c79a4-0001-0000-0000-000000000002",
        "document_name": "Previous Survey Report",
        "is_mandatory": false
      },
      {
        "id": "019c79a4-0001-0000-0000-000000000003",
        "document_name": "Class Renewal Certificate",
        "is_mandatory": true
      }
    ]
  }
}
```

**Frontend Logic:**
```
mandatory_docs   = CertificateRequiredDocuments.filter(d => d.is_mandatory === true)
optional_docs    = CertificateRequiredDocuments.filter(d => d.is_mandatory === false)

If mandatory_docs.length === 0 → No file upload needed, skip Step 3
If mandatory_docs.length  >  0 → Show upload form in Step 3 (user MUST upload all mandatory docs)
```

> ⚠️ **Important:** If the certificate type has `CertificateRequiredDocuments: []` (empty array), skip Step 3 entirely and go straight to Step 4 with `uploaded_documents: []`.

---

## Step 3 — Upload Documents (One per required doc)

For **each** document in `CertificateRequiredDocuments`, upload the file and collect the returned `file_url`.

### `POST /api/v1/documents/upload`

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | File | ✅ | The actual file (PDF, JPG, PNG, etc.) |
| `entity_type` | string | ✅ | Always `"job"` for job documents |
| `entity_id` | string | ✅ | Pass `"new"` or any placeholder — will be linked on job creation |
| `document_type` | string | ✅ | Use the `document_name` from Step 2B |
| `description` | string | ❌ | Optional description |

**Example (JavaScript fetch):**
```javascript
async function uploadDocument(file, documentName) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('entity_type', 'job');
  formData.append('entity_id', 'new');
  formData.append('document_type', documentName);

  const response = await fetch('/api/v1/documents/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });

  const result = await response.json();
  return result.data.file_url;  // ← save this
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "file_url": "https://cdn.girikship.com/documents/abc-xyz-123.pdf",
    "document_type": "Registry Certificate",
    "entity_type": "job"
  }
}
```

**Build the `uploaded_documents` array:**
```javascript
// Do this for each required document the user uploads
const uploadedDocuments = [];

for (const requiredDoc of mandatoryDocs) {
  const userSelectedFile = fileInputs[requiredDoc.id]; // from your UI
  const fileUrl = await uploadDocument(userSelectedFile, requiredDoc.document_name);

  uploadedDocuments.push({
    required_document_id: requiredDoc.id,   // UUID from Step 2B
    file_url: fileUrl                        // URL returned from upload
  });
}
```

> ⚠️ **All `is_mandatory: true` documents MUST be uploaded.** The backend will reject the job creation with a `400` error listing the missing ones if any mandatory doc is missing.

---

## Step 4 — Submit the Job Request

Now you have everything needed. Submit the job creation request.

### `POST /api/v1/jobs`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "vessel_id": "019c574f-0991-7758-b696-03bb416c7433",
  "certificate_type_id": "019c79a4-55ba-773c-9454-f6bee169ab03",
  "reason": "Annual survey due — certificate expires April 30, 2026",
  "target_port": "Singapore",
  "target_date": "2026-04-15",
  "uploaded_documents": [
    {
      "required_document_id": "019c79a4-0001-0000-0000-000000000001",
      "file_url": "https://cdn.girikship.com/documents/registry-cert.pdf"
    },
    {
      "required_document_id": "019c79a4-0001-0000-0000-000000000003",
      "file_url": "https://cdn.girikship.com/documents/class-renewal.pdf"
    }
  ]
}
```

**All fields explained:**

| Field | Type | Required | Description |
|---|---|---|---|
| `vessel_id` | UUID | ✅ | Vessel selected in Step 1 |
| `certificate_type_id` | UUID | ✅ | Certificate type selected in Step 2 |
| `reason` | string | ✅ | Reason for requesting this survey |
| `target_port` | string | ✅ | Port where the survey will take place |
| `target_date` | date (YYYY-MM-DD) | ✅ | Expected survey date |
| `uploaded_documents` | array | ❌* | Required if cert type has mandatory docs |
| `uploaded_documents[].required_document_id` | UUID | ✅ | ID of the `CertificateRequiredDocument` |
| `uploaded_documents[].file_url` | string | ✅ | URL returned from the upload endpoint |

> *If the certificate type has no mandatory documents, send `uploaded_documents: []` or omit the field.

---

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "019c7fba-b213-70ee-930b-a79a360f46c7",
    "vessel_id": "019c574f-0991-7758-b696-03bb416c7433",
    "certificate_type_id": "019c79a4-55ba-773c-9454-f6bee169ab03",
    "requested_by_user_id": "019c79a4-4475-729b-ae3e-98373803b963",
    "job_status": "CREATED",
    "priority": "NORMAL",
    "is_survey_required": true,
    "target_port": "Singapore",
    "target_date": "2026-04-15",
    "reason": "Annual survey due — certificate expires April 30, 2026",
    "assigned_surveyor_id": null,
    "createdAt": "2026-02-21T13:26:14.000Z"
  }
}
```

**Error Responses:**

| Status | When | Body |
|---|---|---|
| `400` | Mandatory documents are missing | `{ message: "Missing mandatory documents...", missing_documents: [{id, name}] }` |
| `400` | `vessel_id` not found | `{ message: "Invalid vessel_id." }` |
| `400` | `certificate_type_id` not found | `{ message: "Invalid certificate_type_id." }` |
| `400` | Validation error (missing required field) | `{ message: "Validation Error", error: "..." }` |
| `403` | CLIENT submitting for a vessel not in their fleet | `{ message: "Unauthorized vessel selection" }` |

---

## Complete Flow Diagram

```
USER SELECTS VESSEL
        │
        ▼
GET /vessels  ──────────────────────────────────────────────────────────►  vessel_id
        │
        ▼
USER SELECTS CERTIFICATE TYPE
        │
        ▼
GET /certificates/types   ──────────────────────────────────────────────►  cert type list
        │
        ▼
USER CLICKS A CERT TYPE
        │
        ▼
GET /certificates/types/:id  ───────────────────────────────────────────►  CertificateRequiredDocuments[]
        │
        ├── CertificateRequiredDocuments is EMPTY?
        │          │YES                        │NO
        │          ▼                           ▼
        │   Skip uploads               Show upload form for each doc
        │          │                          │
        │          │               ┌──────────┴──────────────────────┐
        │          │               │  for each required doc:         │
        │          │               │  POST /documents/upload         │
        │          │               │  → get file_url                 │
        │          │               └──────────┬──────────────────────┘
        │          │                          │
        └──────────►──────────────────────────┘
                   │
                   ▼
USER FILLS REASON, TARGET_PORT, TARGET_DATE
                   │
                   ▼
POST /jobs  ───────────────────────────────────────────────────────────►  job.id, job_status: "CREATED"
                   │
                   ▼
             Show success screen
             "Your job request has been submitted!"
             "Status: CREATED — awaiting document verification"
```

---

## What Happens After Submission (Status Flow)

After the job is created, it goes through this lifecycle managed by **backend staff**:

```
CREATED
    │ (TO verifies documents)
    ▼
DOCUMENT_VERIFIED
    │ (GM/ADMIN approves the request)
    ▼
APPROVED
    │ (GM/ADMIN assigns a surveyor)
    ▼
ASSIGNED
    │ (ADMIN/TM authorizes the survey)
    ▼
SURVEY_AUTHORIZED  ← Surveyor can now start field work
    │ (Surveyor starts & submits survey)
    ▼
SURVEY_DONE
    │ (TO reviews findings)
    ▼
REVIEWED
    │ (TM finalizes)
    ▼
FINALIZED
    │ (payment processed externally)
    ▼
PAYMENT_DONE
    │ (certificate generated)
    ▼
CERTIFIED ✅
```

To **track job status** from the frontend, poll or reload:
```
GET /api/v1/jobs/:id
```

---

## Complete JavaScript Example

```javascript
const API = 'http://localhost:3000/api/v1';
const token = localStorage.getItem('authToken');
const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

async function createJobRequest({ vesselId, certTypeId, reason, targetPort, targetDate, fileInputMap }) {
  // Step 2B: Get required documents
  const typeRes = await fetch(`${API}/certificates/types/${certTypeId}`, { headers });
  const typeData = await typeRes.json();
  const requiredDocs = typeData.data.CertificateRequiredDocuments || [];
  const mandatoryDocs = requiredDocs.filter(d => d.is_mandatory);

  // Step 3: Upload each mandatory document
  const uploadedDocuments = [];
  for (const doc of mandatoryDocs) {
    const file = fileInputMap[doc.id]; // { [required_document_id]: File }
    if (!file) throw new Error(`Missing file for: ${doc.document_name}`);

    const form = new FormData();
    form.append('file', file);
    form.append('entity_type', 'job');
    form.append('entity_id', 'new');
    form.append('document_type', doc.document_name);

    const upRes = await fetch(`${API}/documents/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }, // NO Content-Type for multipart!
      body: form,
    });
    const upData = await upRes.json();
    if (!upData.success) throw new Error(`Upload failed: ${upData.message}`);

    uploadedDocuments.push({
      required_document_id: doc.id,
      file_url: upData.data.file_url,
    });
  }

  // Step 4: Submit the job
  const jobRes = await fetch(`${API}/jobs`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      vessel_id: vesselId,
      certificate_type_id: certTypeId,
      reason,
      target_port: targetPort,
      target_date: targetDate,
      uploaded_documents: uploadedDocuments,
    }),
  });

  const jobData = await jobRes.json();
  if (!jobData.success) {
    // Handle missing docs error
    if (jobData.missing_documents) {
      const names = jobData.missing_documents.map(d => d.name).join(', ');
      throw new Error(`Missing mandatory documents: ${names}`);
    }
    throw new Error(jobData.message);
  }

  return jobData.data; // { id, job_status: "CREATED", ... }
}
```

---

## Key Rules to Remember

| Rule | Detail |
|---|---|
| **Do NOT set `job_status`** | Backend always sets it to `CREATED` — any value you send is ignored |
| **Do NOT set `priority`** | Default is `NORMAL`. Only ADMIN/GM/TM can change it via `PUT /jobs/:id/priority` |
| **Content-Type for uploads** | Do NOT set `Content-Type` header manually for `multipart/form-data` — let the browser set it with the boundary |
| **`required_document_id` must be valid** | Must match exactly the `id` from `CertificateRequiredDocuments` in Step 2B |
| **No file upload if no required docs** | If `CertificateRequiredDocuments` is empty, send `uploaded_documents: []` or omit field |
| **CLIENT scope** | CLIENT users can only submit for vessels where `vessel.client_id === their client.id` |
| **Optional docs** | Docs with `is_mandatory: false` can be included but are not required |

---

## API Reference Summary

| Step | Method | Endpoint | Auth |
|---|---|---|---|
| Load vessels | `GET` | `/api/v1/vessels` | ✅ |
| Load cert types | `GET` | `/api/v1/certificates/types` | ✅ |
| Load cert type detail + docs | `GET` | `/api/v1/certificates/types/:id` | ✅ |
| Upload a document | `POST` | `/api/v1/documents/upload` | ✅ |
| **Create job request** | `POST` | `/api/v1/jobs` | ✅ |
| Track job status | `GET` | `/api/v1/jobs/:id` | ✅ |
