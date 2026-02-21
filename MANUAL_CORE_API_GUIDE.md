# Core Manual API Reference Guide

*This document was manually created by inspecting the codebase (`src/modules`, `src/services`, `src/models`) line-by-line. Instead of relying on auto-generated Swagger documentation, this guide highlights exactly what is happening under the hood across GIRIK's core modules, including their expected logic, valid schemas, and database return responses.*

---

## 1. Authentication Module (`src/modules/auth`)

### `POST /api/v1/auth/login`
- **Controller/Service Logic:** Authenticates users. Queries `User` model. Validates password via BCrypt. If successful, generates split `accessSecret` and `refreshSecret` tokens.
- **Request Schema (Joi):**
  ```json
  {
    "email": "user@example.com", // String, required, format: email
    "password": "Password@123" // String, required
  }
  ```
- **Response Structure:**
  ```json
  {
    "user": {
      "id": "UUID",
      "name": "String",
      "email": "String",
      "role": "Enum (ADMIN, GM, TM, TO, TA, SURVEYOR, CLIENT, FLAG_ADMIN)"
    },
    "accessToken": "JWT_TOKEN",
    "refreshToken": "JWT_TOKEN"
  }
  ```

### `POST /api/v1/auth/logout`
- **Controller/Service Logic:** Passes the auth token into `authService.logout(userId, token)`. Adds the stateless token to the memory `tokenBlacklist` cache (Set) rendering it completely unusable. Clears cookies.
- **Request Body:** None (Requires active `Authorization: Bearer <TOKEN>` header)
- **Response:**
  ```json
  {
    "message": "Logged out successfully",
    "accessToken": null,
    "refreshToken": null
  }
  ```

---

## 2. Jobs Workflow Module (`src/modules/jobs`)
*The job module manages requests traversing a strict state machine `CREATED` ➝ `ASSIGNED` ➝ `SURVEY_AUTHORIZED` ➝ `REVIEWED` ➝ `FINALIZED`.*

### `POST /api/v1/jobs`
- **Service Logic:** Triggers `createJob` in `job.service.js`. Requires valid `vessel_id` ownership (validated if `CLIENT`). Updates `JobStatusHistory` mapping `previous_status: null` to `new_status: CREATED`.
- **Request Schema (Joi):**
  ```json
  {
    "vessel_id": "UUID", // Required
    "certificate_type_id": "UUID", // Required
    "reason": "Initial vessel inspection", // String, required
    "target_port": "Singapore", // String, required
    "target_date": "2026-12-15T00:00:00.000Z", // Iso Date, required
    "uploaded_documents": [ // Optional Array of supporting docs
      {
        "required_document_id": "UUID",
        "file_url": "https://s3.aws.com/..."
      }
    ]
  }
  ```
- **Response Structure (JobRequest Model + Relations):**
  ```json
  {
    "success": true,
    "data": {
      "id": "UUID",
      "job_status": "CREATED",
      "requested_by_user_id": "UUID",
      "vessel_id": "UUID",
      "target_port": "String",
      "target_date": "Date"
    }
  }
  ```

### `PUT /api/v1/jobs/:id/cancel`
- **Service Logic:** Cancels a job. Checks terminal endpoints. Due to manual codebase fixes, cancelling skips if the job is inherently `FINALIZED`, `CERTIFIED`, `REJECTED`, or **`PAYMENT_DONE`** protecting cash flow inversions.
- **Response:**
  ```json
  {
    "success": true,
    "message": "Job cancelled.",
    "data": { "job_status": "REJECTED" } // Redirects path to rejected in lifecycleService
  }
  ```

---

## 3. Surveys Module (`src/modules/surveys`)

### `GET /api/v1/surveys/reports`
- **Service Logic:** Retrieves lists of survey reports. It natively filters against SQL injection properties by strictly whitelisting internal params: `survey_status`, `surveyor_id`, and `job_id`. Uses `fileAccess.service.js` to securely map file entity paths to valid Signed URLs or CDNs.
- **Request Query Parameters:**
  `?page=1&limit=10&survey_status=SUBMITTED&job_id=UUID`
- **Response Structure (Survey Model + User + JobRequest):**
  ```json
  {
    "count": 1,
    "rows": [
      {
        "id": "UUID",
        "job_id": "UUID",
        "survey_status": "SUBMITTED",
        "survey_statement": "Text",
        "submitted_at": "DateTime",
        "JobRequest": { "Vessel": { "vessel_name": "...", "imo_number": "..." } },
        "User": { "name": "Surveyor Name", "email": "..." }
      }
    ]
  }
  ```

### `POST /api/v1/surveys/start`
- **Service Logic:** Checks if Job status is `SURVEY_AUTHORIZED`. Writes initial GPS markers `GpsTracking` directly upon initiation via the `startSurvey` model insert.
- **Request Schema (Joi):**
  ```json
  {
    "job_id": "UUID", // Required
    "latitude": 1.290270, // Number, required
    "longitude": 103.851959 // Number, required
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Survey started. Tracker initiated."
  }
  ```

---

## 4. Certificates Module (`src/modules/certificates`)

### `PUT /api/v1/certificates/:id/suspend` & `.../revoke` & `.../restore`
- **Service Logic:** `certificate.service.js` restricts status skipping mappings mapping explicitly against `CERT_TRANSITIONS` (e.g., `VALID` -> `SUSPENDED`). It also blocks `REVOKED` certificates from ever being modified. Updates `CertificateHistory` table directly.
- **Request Schema (Joi: certAction):**
  ```json
  { "reason": "Administrative block on vessel." }
  ```
- **Response Structure (Certificate Model):**
  ```json
  {
    "success": true,
    "message": "Certificate suspended successfully",
    "data": {
      "id": "UUID",
      "certificate_number": "CERT-12345678",
      "status": "SUSPENDED" 
    }
  }
  ```

### `GET /api/v1/certificates/verify/:number` (Public Endpoint)
- **Service Logic:** Checks certificate number without authentication. Purposefully strips relationship keys to obscure underlying application architecture from public scrapers mapping only essential vessel properties.
- **Response Structure:**
  ```json
  {
    "success": true,
    "data": {
      "valid": true,
      "certificate": {
        "certificate_number": "CERT-123",
        "status": "VALID",
        "issue_date": "2024-03-01",
        "expiry_date": "2029-03-01",
        "vessel_name": "Ocean Voyager",
        "imo_number": "9876543",
        "certificate_type": "Safety Radio Certificate"
      },
      "pdf_url": "https://cloudfront.com/..."
    }
  }
  ```

---

## 5. Payments & Financials (`src/modules/payments`)

### `GET /api/v1/payments`
- **Service Logic:** Safe-listing filter for `['payment_status', 'job_id', 'invoice_number']`, then queries `Payment` database object adjoining nested `JobRequest.Vessel` attributes to paint a complete financial scope.
- **Valid Query Paramaters:**
  `?payment_status=PAID&invoice_number=INV-001`
- **Response Structure (Payment Model):**
  ```json
  {
    "id": "UUID",
    "job_id": "UUID",
    "invoice_number": "INV-10901",
    "amount": 5500.00,
    "currency": "USD",
    "payment_status": "PAID",
    "payment_date": "2026-06-01",
    "JobRequest": { "Vessel": { "vessel_name": "Seaspan X" } }
  }
  ```

---

## 6. Documents (`src/modules/documents`)
### `POST /api/v1/documents/upload`
- **Service Logic:** Directly interacts with S3 and `multer`. File validation (`fileFilter`) blocks any external execution payloads checking explicitly for `pdf`, `jpeg`, `png`, and `webp`. Hard limit capped at `20MB`. Dynamic Folder allocation filters restrict standalone injections safely to `['misc', 'documents', 'surveys', 'jobs/attachments']`.
- **Request (Multipart/Form-Data):**
  - **file:** Binary Document
  - **folder:** (String - 'misc')
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "url": "https://cloudfront.../misc/123-your-file.pdf",
      "key": "misc/123-your-file.pdf"
    }
  }
  ```
