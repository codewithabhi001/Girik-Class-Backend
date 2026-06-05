# API Reference: Job, Survey, and Certificate Modules

This document provides a comprehensive list of all API endpoints for the **Job**, **Survey**, and **Certificate** modules in the `GIRIK_BACKEND` service. It outlines the HTTP method, endpoint path, authorized roles, and the exact work/functionality of each endpoint.

---

## Roles Overview
The backend uses Role-Based Access Control (RBAC). The roles defined in the system are:
*   **ADMIN**: System Administrator with full access.
*   **GM** (General Manager): Manages requests, assignments, scheduling, and high-level overrides.
*   **TM** (Technical Manager): Handles technical validations, final reviews, certificate actions (suspension, revocation, renewal, reissue).
*   **TO** (Technical Officer): Handles document verifications, checklists, and initial review checks.
*   **SURVEYOR**: Field inspector performing surveys, uploading evidence, and filling checklists.
*   **CLIENT**: Vessel owners / representatives who create job requests and track certificates.

---

## 1. Job Module
*   **Base Path**: `/api/v1/jobs`
*   **Route File**: `src/modules/jobs/job.routes.js`
*   **Controller File**: `src/modules/jobs/job.controller.js`

| Method | Endpoint | Authorized Roles | Description / Work |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/jobs/upload-url` | `CLIENT`, `ADMIN`, `GM`, `TM`, `SURVEYOR` | *Deprecated.* Generates a pre-signed S3 URL to upload files. (*Recommended: Use `/api/v1/documents/get-upload-url` instead.*) |
| **GET** | `/api/v1/jobs/` | `CLIENT`, `ADMIN`, `GM`, `TM`, `TO`, `SURVEYOR` | Lists jobs. Applies scope filtering (e.g., Client sees only their vessels' jobs; Surveyor sees only assigned jobs). |
| **GET** | `/api/v1/jobs/:id` | `CLIENT`, `ADMIN`, `GM`, `TM`, `TO`, `SURVEYOR` | Retrieves full details of a specific job by its ID. |
| **GET** | `/api/v1/jobs/:id/eligible-surveyors` | `ADMIN`, `GM`, `TM` | Retrieves a list of surveyors eligible to perform the survey for the given job. |
| **POST** | `/api/v1/jobs/` | `CLIENT`, `ADMIN`, `GM` | Creates a new job. Clients are restricted from inputting payment detail overrides. ADMIN/GM can request to bypass mandatory document checks. |
| **PUT** | `/api/v1/jobs/:id/verify-all-documents` | `TO`, `GM`, `ADMIN` | Bulk verifies all documents/certificates uploaded for a job. Advances status from `CREATED` to `DOCUMENT_VERIFIED`. |
| **PUT** | `/api/v1/jobs/certificates/:jobCertificateId/verify-documents` | `TO`, `GM`, `ADMIN` | Verifies or rejects certificate documents. To approve, send request (or pass `"approved": true`). To reject specific documents, pass `"approved": false` and an array under `"rejected_documents"` (e.g. `[{"document_id": ID, "reason": "Reason for rejection"}]`) in the request body. |
| **PUT** | `/api/v1/jobs/:id/approve-request` | `GM`, `ADMIN` | Approves a job request. Transitions status from `DOCUMENT_VERIFIED` to `APPROVED`. |
| **PUT** | `/api/v1/jobs/:id/finalize` | `TM`, `ADMIN` | Finalizes a job (specifically for non-survey jobs, like administrative certifications). |
| **PUT** | `/api/v1/jobs/:id/assign` | `ADMIN`, `GM` | Bulk assigns a surveyor to all certificates under a Job. Transitions status to `ASSIGNED`. |
| **PUT** | `/api/v1/jobs/:id/reassign` | `ADMIN`, `GM`, `TM` | Reassigns a surveyor to all certificates under a Job without altering the job state. |
| **PUT** | `/api/v1/jobs/:id/reschedule` | `GM`, `ADMIN` | Updates the scheduled date/time of a job. |
| **PUT** | `/api/v1/jobs/:id/authorize-all-surveys` | `ADMIN`, `TM` | Bulk authorizes all surveys for valid certificates in a Job, moving status from `ASSIGNED` to `SURVEY_AUTHORIZED` (allowing surveyors to start work). |
| **PUT** | `/api/v1/jobs/:id/review-all` | `TO`, `TM`, `ADMIN` | Bulk marks all completed/submitted certificate surveys under a job as reviewed. Transitions status from `SURVEY_DONE` to `REVIEWED`. |
| **PUT** | `/api/v1/jobs/:id/reject` | `ADMIN`, `GM`, `TM` | Rejects a job. Rejection is allowed at any non-terminal stage for ADMIN, but restricted to `CREATED` for GM, and specific active statuses for TM. |
| **PUT** | `/api/v1/jobs/:id/cancel` | `CLIENT`, `GM`, `TM`, `ADMIN` | Cancels the job. Clients can cancel their own jobs; managers/admins can cancel as well. |
| **PUT** | `/api/v1/jobs/:id/priority` | `ADMIN`, `GM`, `TM` | Updates the priority level (Low/Medium/High/Urgent) of a job with a reason. |
| **GET** | `/api/v1/jobs/:id/documents` | `CLIENT`, `ADMIN`, `GM`, `TM`, `TO` | Lists all documents uploaded for a job, including their verification statuses. |
| **POST** | `/api/v1/jobs/:id/documents` | `CLIENT`, `ADMIN`, `GM`, `TM`, `TO` | Uploads additional documents for a job. Clients can upload while job is in `CREATED` state. |
| **PUT** | `/api/v1/jobs/:id/documents/:documentId` | `CLIENT`, `ADMIN`, `GM`, `TM`, `TO` | Re-uploads a specific rejected document to replace it. |
| **GET** | `/api/v1/jobs/:id/history` | `CLIENT`, `ADMIN`, `GM`, `TM`, `TO`, `SURVEYOR` | Fetches the audit trail/history logs for a job. |
| **POST** | `/api/v1/jobs/:id/notes` | `ADMIN`, `GM`, `TM`, `TO` | Adds an internal management/operational note to the job. |
| **GET** | `/api/v1/jobs/:id/messages/external` | `CLIENT`, `ADMIN`, `GM`, `TM`, `TO`, `SURVEYOR` | Retrieves external (client-facing) messages/communications for a job. |
| **GET** | `/api/v1/jobs/:id/messages/internal` | `ADMIN`, `GM`, `TM`, `TO` | Retrieves internal messages/communications for a job. |
| **POST** | `/api/v1/jobs/:id/messages/external` | `CLIENT`, `ADMIN`, `GM`, `TM`, `TO`, `SURVEYOR` | Sends an external (client-facing) message for a job. Supports uploading files/attachments. |
| **POST** | `/api/v1/jobs/:id/messages/internal` | `ADMIN`, `GM`, `TM`, `TO` | Sends an internal message for a job. Supports uploading files/attachments. |

---

## 2. Survey Module
*   **Base Path**: `/api/v1/surveys`
*   **Route File**: `src/modules/surveys/survey.routes.js`
*   **Controller File**: `src/modules/surveys/survey.controller.js`

| Method | Endpoint | Authorized Roles | Description / Work |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/surveys/start` | `SURVEYOR` | Checks in and starts a survey. The job must be in `SURVEY_AUTHORIZED` status. |
| **POST** | `/api/v1/surveys/:jobCertificateId/proof` | `SURVEYOR` | Uploads evidence proof/photos for a specific certificate survey. Survey status must be `CHECKLIST_SUBMITTED`. |
| **POST** | `/api/v1/surveys/jobs/:jobId/location` | `SURVEYOR` | Streams the surveyor's current GPS location coordinates in real-time during a survey. |
| **POST** | `/api/v1/surveys/jobs/:jobId/sync` | `SURVEYOR` | Offline sync endpoint to replay/upload batched checklist answers and GPS data points recorded offline. |
| **POST** | `/api/v1/surveys/:jobCertificateId/submit` | `SURVEYOR` | Submits the final survey report for a certificate (takes photos & surveyor/master signatures). Transitions survey status to `SUBMITTED`. |
| **PUT** | `/api/v1/surveys/jobs/:jobId/finalize` | `TM`, `ADMIN` | Bulk finalizes all surveys and generates certificates for the entire job. |
| **PUT** | `/api/v1/surveys/certificates/:jobCertificateId/finalize` | `TM`, `ADMIN` | Finalizes a single certificate survey and issues the certificate. |
| **PUT** | `/api/v1/surveys/jobs/:jobId/rework` | `ADMIN`, `GM`, `TM` | Requests a rework. Rejects a survey and sends it back to the surveyor (`REWORK_REQUESTED`) for corrections. |
| **POST** | `/api/v1/surveys/jobs/:jobId/violation` | `SURVEYOR`, `TM`, `ADMIN` | Flags a violation or non-conformity noticed during inspection, immediately notifying admins. |
| **POST** | `/api/v1/surveys/jobs/:jobId/statement/draft` | `SURVEYOR`, `TM`, `ADMIN` | Drafts a Survey Statement PDF context/details for a job. |
| **POST** | `/api/v1/surveys/jobs/:jobId/statement/issue` | `TM`, `ADMIN` | Issues the final official Survey Statement for a job (requires uploading the signed PDF). |
| **GET** | `/api/v1/surveys/` | `ADMIN`, `GM`, `TM`, `TO` | Retrieves/lists all survey reports in the system. |
| **GET** | `/api/v1/surveys/jobs/:jobId/timeline` | `ADMIN`, `GM`, `TM`, `TO`, `SURVEYOR` | Fetches the step-by-step history/timeline of the survey execution. |
| **GET** | `/api/v1/surveys/jobs/:jobId` | `ADMIN`, `GM`, `TM`, `TO`, `SURVEYOR`, `CLIENT` | Retrieves details (checklist, status, answers) of a survey for a job. |

> **Note**: Checklist submission (Step 2 of Surveyor Workflow) is handled under:
> *   `PUT /api/v1/checklists/jobs/:jobId/checklist` (Access: `SURVEYOR`)
> *   Scan uploads: `GET /api/v1/checklists/jobs/:jobId/signed-checklist-upload-url` and `PUT /api/v1/checklists/jobs/:jobId`.

---

## 3. Certificate Module
*   **Base Path**: `/api/v1/certificates`
*   **Route File**: `src/modules/certificates/certificate.routes.js`
*   **Controller File**: `src/modules/certificates/certificate.controller.js`

| Method | Endpoint | Authorized Roles | Description / Work |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/certificates/verify/:number` | *Public (None)* | **Public Verification**: Verifies if a certificate is valid and returns its basic details using its unique number. No auth token required. |
| **GET** | `/api/v1/certificates/type-names` | `CLIENT`, `ADMIN`, `GM`, `TM`, `TO`, `SURVEYOR` | Returns a slim list (ID + Name) of all active certificate types. Used for dropdowns. |
| **GET** | `/api/v1/certificates/types` | `CLIENT`, `ADMIN`, `GM`, `TM`, `TO` | Lists all detailed certificate types. Supports search filters and `include_inactive` for Admins. |
| **POST** | `/api/v1/certificates/types` | `ADMIN` | Creates a new certificate type definition. |
| **GET** | `/api/v1/certificates/types/:id` | `CLIENT`, `ADMIN`, `GM`, `TM`, `TO` | Retrieves a specific certificate type's details. |
| **PUT** | `/api/v1/certificates/types/:id` | `ADMIN`, `TM` | Updates an existing certificate type's details. |
| **DELETE** | `/api/v1/certificates/types/:id` | `ADMIN` | Deactivates a certificate type. |
| **GET** | `/api/v1/certificates/types/:id/required-documents` | `CLIENT`, `ADMIN`, `GM`, `TM`, `TO`, `SURVEYOR` | Lists all mandatory documents that must be uploaded for a specific certificate type. |
| **POST** | `/api/v1/certificates/types/:id/required-documents` | `ADMIN`, `TM` | Adds a mandatory document definition to a certificate type. |
| **PUT** | `/api/v1/certificates/types/:id/required-documents/:docId` | `ADMIN`, `TM` | Updates a mandatory document definition for a certificate type. |
| **DELETE** | `/api/v1/certificates/types/:id/required-documents/:docId` | `ADMIN`, `TM` | Deletes a required document definition from a certificate type. |
| **GET** | `/api/v1/certificates/` | `CLIENT`, `ADMIN`, `GM`, `TM`, `TO` | Lists all issued or draft certificates. |
| **GET** | `/api/v1/certificates/upload-url` | `ADMIN`, `GM`, `TM` | Generates a pre-signed S3 URL for manual upload of signed certificate PDFs. |
| **POST** | `/api/v1/certificates/vessel/:vesselId/external` | `ADMIN`, `GM`, `TM` | Manually uploads external/third-party certificates for a specific vessel. |
| **GET** | `/api/v1/certificates/vessel/:vesselId` | `CLIENT`, `ADMIN`, `GM`, `TM`, `TO` | Retrieves all certificates (internal and external) issued to a specific vessel. |
| **GET** | `/api/v1/certificates/job/:jobId` | `CLIENT`, `ADMIN`, `GM`, `TM`, `TO` | Retrieves the certificate(s) generated for a specific job. |
| **POST** | `/api/v1/certificates/` | `ADMIN`, `TM`, `GM` | Generates a new certificate in `DRAFT` status. |
| **PUT** | `/api/v1/certificates/:id` | `TM`, `GM` | Updates information in a draft certificate before issuance. |
| **POST** | `/api/v1/certificates/:id/issue` | `ADMIN`, `TM`, `GM` | Formally issues the draft certificate. Generates a cryptographic certificate number and compiles the PDF file. |
| **POST** | `/api/v1/certificates/:id/override` | `GM` | Performs a manual override on an existing certificate (e.g. replacing it with a custom scanned copy). |
| **GET** | `/api/v1/certificates/:id` | `CLIENT`, `ADMIN`, `GM`, `TM`, `TO` | Retrieves full details of a specific certificate. |
| **GET** | `/api/v1/certificates/:id/download` | `CLIENT`, `ADMIN`, `GM`, `TM`, `TO` | Redirects to a secure, signed S3/CDN URL to download the certificate's PDF. |
| **PUT** | `/api/v1/certificates/:id/suspend` | `TM` | Suspends a valid certificate. Status moves to `SUSPENDED`. |
| **PUT** | `/api/v1/certificates/:id/revoke` | `TM` | Revokes a certificate. Status moves to `REVOKED`. |
| **PUT** | `/api/v1/certificates/:id/restore` | `TM` | Restores a suspended/revoked certificate back to `VALID` status. |
| **PUT** | `/api/v1/certificates/:id/renew` | `TM` | Renews an existing certificate for a specific validity duration. |
| **POST** | `/api/v1/certificates/bulk-renew` | `TM` | Bulk renews multiple certificates simultaneously. |
| **POST** | `/api/v1/certificates/:id/reissue` | `TM` | Reissues a certificate (revokes old version, increments version number, and creates a new draft). |
| **GET** | `/api/v1/certificates/:id/preview` | `CLIENT`, `ADMIN`, `GM`, `TM`, `TO` | Generates/retrieves temporary preview data or layout of a certificate prior to final issuing. |
| **GET** | `/api/v1/certificates/:id/history` | `CLIENT`, `ADMIN`, `GM`, `TM`, `TO` | Retrieves the audit trail/history logs for a specific certificate. |
| **POST** | `/api/v1/certificates/:id/transfer` | `GM` | Transfers the certificate ownership to a new vessel owner/client. |
| **POST** | `/api/v1/certificates/:id/extend` | `GM` | Extends the validity period of the certificate by specified months. |
| **PUT** | `/api/v1/certificates/:id/downgrade` | `GM` | Downgrades a certificate to a lower class or standard type. |
