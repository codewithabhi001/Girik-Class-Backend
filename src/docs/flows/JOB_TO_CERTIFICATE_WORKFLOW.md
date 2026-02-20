# Job to Certificate Generation Workflow

This document outlines the complete workflow from Job Creation to Certificate Generation within the Girik system.

## 1. High-Level Overview

The process involves moving a `JobRequest` through a series of approval and execution stages until it reaches a "FINALIZED" state. Once payment is confirmed (`PAYMENT_DONE`), the system triggers the generation of a digital certificate.

**Workflow Stages:**
`CREATED` -> `APPROVED` -> `ASSIGNED` -> `SURVEY_AUTHORIZED` -> `IN_PROGRESS` -> `SURVEY_DONE` -> `REVIEWED` -> `FINALIZED` -> `PAYMENT_DONE` -> `CERTIFIED`

---

## 2. Detailed Workflow Steps

### Step 1: Job Creation & Initial Approval
- **Action**: Client or Admin creates a job request.
- **Status**: `CREATED`
- **Approval**:
  - **GM/ADMIN** approves the job.
  - **Status Change**: `CREATED` -> `APPROVED`.

### Step 2: Surveyor Assignment
- **Action**: GM assigns a Surveyor to the approved job.
- **Status Change**: `APPROVED` -> `ASSIGNED`.
- **System**: Updates `assigned_surveyor_id`.

### Step 3: Pre-Approval (Desk Review)
- **Action**: TM reviews the assignment and authorizes the survey.
- **Status Change**: `ASSIGNED` -> `SURVEY_AUTHORIZED`.
- **Validation**: Ensures a surveyor is assigned.

### Step 4: Survey Execution
- **Action**: Surveyor starts the survey.
  - **Status Change**: `SURVEY_AUTHORIZED` -> `IN_PROGRESS`.
- **Action**: Surveyor submits the survey report.
  - **Status Change**: `IN_PROGRESS` -> `SURVEY_DONE`.

### Step 5: Technical Review
- **Action**: Technical Officer (TO) reviews the survey report.
- **Status Change**: `SURVEY_DONE` -> `REVIEWED`.
- **Action**: Technical Manager (TM) grants final approval.
- **Status Change**: `REVIEWED` -> `FINALIZED`.

### Step 6: Payment Processing
- **Action**: Finance/Admin confirms payment for the job.
- **Status Change**: `FINALIZED` -> `PAYMENT_DONE`.
- **Trigger**: Only jobs in `PAYMENT_DONE` status are eligible for certificate generation.

---

## 3. Certificate Generation Process

The certificate generation logic is encapsulated in `src/modules/certificates/certificate.service.js`.

### Logic Breakdown (`generateCertificate`)

1.  **Validation**:
    - Verifies the job exists.
    - **Crucial Check**: Enforces `job.job_status === 'PAYMENT_DONE'`.
    - Fetches associated `Vessel` and `CertificateType` data.

2.  **Data Preparation**:
    - **Issue Date**: Current timestamp.
    - **Expiry Date**: Calculated based on `validity_years` (default: 1 year).
    - **Certificate Number**: Generates a unique ID (e.g., `CERT-XXXXXXXX`).

3.  **Database Record**:
    - Creates a new `Certificate` entry with status `VALID`.
    - Logs the action in `AuditLog`.

4.  **PDF Generation**:
    - **Template Fetching**: Retrieves the active `CertificateTemplate` for the specific `CertificateType`.
    - **QR Code**: Generates a QR code linking to the verification URL (e.g., `/api/v1/certificates/verify/{cert_no}`).
    - **HTML Construction**:
        - Injects variables: `vessel_name`, `imo_number`, `issue_date`, `expiry_date`, `certificate_type`, `qr_image`.
        - Uses the database template or a fallback HTML layout.
    - **PDF Conversion**: Converts the HTML to a PDF buffer.
    - **Storage**: Uploads the PDF to S3/Storage.
    - **Update**: Saves the secure `pdf_file_url` to the Certificate record.

5.  **Job Finalization**:
    - Updates `JobRequest` status to `CERTIFIED`.
    - Links the generated `Certificate` ID to the Job.
    - Records the transition in `JobStatusHistory`.

---

## 4. Key Data Models

### JobRequest
- **Status**: Tracks the workflow state (`job_status`).
- **Associations**: `Vessel`, `CertificateType`, `User` (Requester, Surveyor, Approver).
- **Certificate**: Links to the generated `Certificate` via `generated_certificate_id` once certified.

### Certificate
- **Attributes**: `certificate_number`, `issue_date`, `expiry_date`, `pdf_file_url`, `status` (`VALID`, `EXPIRED`, `REVOKED`).
- **Associations**: `Vessel`, `CertificateType`, `JobRequest`.

### CertificateTemplate
- **Attributes**: `template_content` (HTML/Handlebars), `certificate_type_id`, `is_active`.
- **Usage**: dynamic styling of the generated PDF.

---

## 5. Summary of Automated Actions

| Trigger | Condition | Action |
| :--- | :--- | :--- |
| **Admin/Finance** marks `PAYMENT_DONE` | Manual API Call | Status updates to `PAYMENT_DONE`. |
| **Admin** requests "Generate Certificate" | Job is `PAYMENT_DONE` | 1. `Certificate` created.<br>2. PDF generated & uploaded.<br>3. Job becomes `CERTIFIED`. |
