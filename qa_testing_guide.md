# QA Testing & Verification Guide: GR-Class System

Welcome to the **GR-Class Marine Certification & Operations Management System** testing guide. This document serves as the master walkthrough for QA engineers to test the system's end-to-end functionality, role-based access control (RBAC), database constraints, and state transitions.

---

## 1. System Overview
GR-Class is an enterprise marine classification platform. It handles the complete lifecycle of ship safety inspections and certifications:
1. **Ship owners (Clients)** request certificates and upload vessel documents.
2. **Technical Officers (TO)** check the documents.
3. **General Managers (GM)** approve the job and assign a **Surveyor**.
4. **Surveyors** inspect the ship using checklists and S3 upload forms (capturing GPS locations).
5. **Technical Managers (TM)** review the inspection data and issue official, digitally signed PDF certificates.
6. **Port State Authorities / Public Users** verify the certificates using public QR code verification.

---

## 2. Testing Roles & Account Switcher
To test the system properly, you will need to switch between the following six roles. Ensure you verify that role boundaries are respected (e.g. a Client cannot access internal TO review actions).

| Role Code | Role Name | Primary Responsibility | Critical Permission Guard |
| :--- | :--- | :--- | :--- |
| **CLIENT** | Ship Owner / Operator | Registers vessels, uploads documents, requests surveys, pays invoices. | Can only view their own vessels/jobs. |
| **TO** | Technical Officer | Performs document checks, reviews surveyor checklists, manages Non-Conformities (NCs). | Cannot approve jobs or authorize surveys. |
| **GM** | General Manager | Approves jobs, assigns surveyors, reassigns, requests reworks, cancels/rejects requests. | Cannot finalize surveys (TM only). |
| **TM** | Technical Manager | Finalizes surveys (locking checklists), suspends/revokes/renews certificates, manages templates. | **Only role that can finalize surveys.** |
| **ADMIN** | System Administrator | Full global visibility, manages users, deactivates certificate types, executes compliance actions. | Cannot finalize surveys or approve jobs. |
| **SURVEYOR**| Field Inspector | Checks-in on board, syncs checklists, uploads proof photos, streams GPS, submits reports. | Only sees assigned surveys. |

---

## 3. End-to-End Workflow A: The Main Happy Path
This test flow validates the success path of a survey request from creation to final certification.

```
[CLIENT] Create Job ──> [TO] Verify Documents ──> [GM] Approve Job ──> [GM] Assign Surveyor ──> [TM] Authorize Survey ──> [SURVEYOR] Start Survey & Submit Checklist & Upload Proof & Submit Report ──> [TO] Technical Review ──> [TM] Finalize Survey ──> [GM/TM] Issue Invoice & Pay ──> [GM/TM] Generate & Issue Certificate ──> [PUBLIC] QR Verification
```

### Step 1: Request Survey (Role: `CLIENT`)
1. Log in as a **CLIENT**.
2. Go to **Vessel Registry** and register a test vessel or select an existing vessel.
3. Navigate to **Jobs** -> **New Job Request**.
4. Select the Vessel and the **Certificate Type** (e.g. International Oil Pollution Prevention - IOPP).
5. The system will display the mandatory documents required for this certificate type.
6. Upload mock PDF/Image files for all required documents.
7. Click **Submit Request**.
*   **Verification Check:**
    *   Job status in history starts as `CREATED`.
    *   Client is blocked from editing payment details or bypass check indicators.

### Step 2: Verify Uploaded Documents (Role: `TO`)
1. Log in as a **TO** (Technical Officer).
2. Open the **Verification Queue** and select the recently created Job.
3. Click on the **Documents** tab.
4. Review the uploaded files.
5. Click **Verify All Documents** (Approve All). An optional remarks popup will appear.
6. Enter optional remarks (e.g. `"Checked registry certificate and safety records. All details are valid."`) and click **Confirm**.
*   **Verification Check:**
    *   If no remarks are entered, check that the backend defaults to: `"Technical Officer verified all documents"`.
    *   Job status transitions to `DOCUMENT_VERIFIED`.

### Step 3: Approve Request (Role: `GM`)
1. Log in as a **GM** (General Manager).
2. Locate the Job (status `DOCUMENT_VERIFIED`).
3. Click **Approve Request**. A popup will ask for approval comments.
4. Enter remarks and confirm.
*   **Verification Check:**
    *   Job status transitions to `APPROVED`.
    *   Client is notified via in-app notifications.

### Step 4: Assign Surveyor (Role: `GM`)
1. While logged in as **GM**, click **Assign Surveyor** on the approved Job page.
2. Search for active surveyors. Test the eligibility check (the system checks if the surveyor is licensed for that specific vessel type and certificate type).
3. Select an eligible **Surveyor** and select a target date. Click **Confirm**.
*   **Verification Check:**
    *   Job status transitions to `ASSIGNED`.
    *   The assigned surveyor is listed under the Job Details page.

### Step 5: Authorize Survey (Role: `TM` or `ADMIN`)
1. Log in as a **TM** (Technical Manager).
2. Locate the Job (status `ASSIGNED`).
3. Click **Authorize Survey**.
*   **Verification Check:**
    *   Job status transitions to `SURVEY_AUTHORIZED`.
    *   The Job becomes editable and visible to the assigned **Surveyor** on their dashboard.

### Step 6: Execute Survey (Role: `SURVEYOR`)
1. Log in as the assigned **SURVEYOR**.
2. Locate the job in the **Assigned Tasks** dashboard.
3. Click **Start Survey** (Check-In). This simulates capturing the current GPS location.
    *   *Check:* Job status changes to `IN_PROGRESS` and Survey status changes to `SRTED`.
4. Go to the **Checklist** tab. Fill out all checklist questions (answering "Yes" or "No", and adding remarks for checked items). Click **Submit Checklist**.
    *   *Check:* Survey status updates to `CHECKLIST_SUBMITTED`.
5. Under the **Evidence / Photos** section, upload at least one image or document as inspection proof.
    *   *Check:* Survey status updates to `PROOF_UPLOADED`.
6. Click **Check-Out & Submit Survey Report**. Fill in the checkout coordinates, write a summary findings statement, upload the Master/Surveyor signature image, and submit.
*   **Verification Check:**
    *   Survey status transitions to `SUBMITTED`.
    *   Job status automatically synchronizes to `SURVEY_DONE`.

### Step 7: Technical Review (Role: `TO`)
1. Log in as a **TO**.
2. Locate the Job (status `SURVEY_DONE`).
3. Go to the **Checklist** and **Evidence** tab to verify the surveyor's answers and photo logs.
4. Click **Submit Technical Review**. Enter review remarks and confirm.
*   **Verification Check:**
    *   Job status transitions to `REVIEWED`.

### Step 8: Finalize Survey & Lock Inspection (Role: `TM` ONLY)
1. Log in as a **TM** (Technical Manager).
2. Select the Job (status `REVIEWED`).
3. Click **Finalize Survey**.
*   **Verification Check:**
    *   Survey status changes to `FINALIZED`.
    *   Job status automatically updates to `FINALIZED`.
    *   **Lock Guard:** Verify that the checklist answers, GPS timeline, and evidence photos are now **Read-Only** and cannot be modified.

### Step 9: Invoicing & Payment (Role: `GM` or `TM` or `ADMIN`)
1. Log in as **GM** or **TM**.
2. Under the Job Details page, click **Generate Invoice**.
3. Input the amount (e.g. `5000.00`) and currency (USD/EUR) and click **Create**.
    *   *Check:* Invoice status is `UNPAID`.
4. Click **Mark Invoice as Paid** (simulate bank transfer/payment receipt upload).
*   **Verification Check:**
    *   Invoice status transitions to `PAID`.
    *   Job status transitions to `PAYMENT_DONE`.

### Step 10: Generate & Issue Certificate (Role: `TM` or `GM` or `ADMIN`)
1. Log in as **TM** or **GM**.
2. Locate the Job (status `PAYMENT_DONE`).
3. Click **Generate Certificate Draft**.
    *   *Check:* A draft certificate is generated with a placeholder number, status `DRAFT`.
4. Review draft fields, then click **Issue Certificate**.
*   **Verification Check:**
    *   Certificate status becomes `VALID` / `ISSUED`.
    *   Job status transitions to the terminal status `CERTIFIED`.
    *   Verify that a PDF is generated and a QR code is visible on the certificate.

### Step 11: Public Verification (Role: `PUBLIC` / Unauthenticated)
1. Log out of the system.
2. Go to the public homepage and navigate to **Verify Certificate**.
3. Enter the issued Certificate Number (e.g. `CERT-XXXXXX`).
*   **Verification Check:**
    *   The system displays the authentic certificate metadata, vessel details, validity dates, and active status (`VALID`).
    *   Verify that no credentials are required to load this page.

---

## 4. End-to-End Workflow B: The Error & Rework Paths
Use these scenarios to test how the system handles exceptions, rejections, and validation gates.

### Scenario B1: Document Rejection & Re-upload
1. **Initiate:** Log in as **CLIENT** and request a job, uploading all documents.
2. **Reject:** Log in as **TO**. Under the **Documents** tab, instead of approving all, select one mandatory document.
3. Click **Reject Selected**. Enter a reason (e.g., `"The registration scan is blurred and unreadable."`) and confirm.
    *   *Check:* The document status updates to `REJECTED`. The job certificate status remains `PENDING`.
4. **Guard Check:** Try to click **Approve Request** or **Assign Surveyor**.
    *   *Check:* The system blocks these actions because a mandatory document is in `REJECTED` state.
5. **Re-upload:** Log in as **CLIENT**. Go to the Job page. You should see a warning: *“Some documents were rejected.”*
6. Click **Re-upload** on the rejected row, choose a clear mock document, and upload.
    *   *Check:* A new document version is created with status `PENDING` (which is now the latest version).
7. **Complete:** Log in as **TO**. The document is now ready for review again. Verify it, and proceed with the happy path.

### Scenario B2: Survey Rework Request
1. **Initiate:** Conduct the survey happy path up to Step 6 (Surveyor submits the report, Job is `SURVEY_DONE`, Survey is `SUBMITTED`).
2. **Trigger Rework:** Log in as **TM** or **GM**.
3. On the Job details page, click **Request Rework**.
4. Input a reason (e.g. `"Checklist item 3 requires clarification. Photo proof is missing."`) and confirm.
*   **Verification Check:**
    *   Survey status reverts to `REWORK_REQUIRED`.
    *   Job status changes to `REWORK_REQUESTED`.
    *   The **Surveyor** is notified. When they log in, they can re-open the checklists, upload new photos, and re-submit the survey report.

### Scenario B3: Non-Conformity Blocker
1. **Initiate:** During survey execution (Step 6), the **Surveyor** notices a hull crack and clicks **Flag Violation / NC** under the survey panel.
2. Enter description (e.g. `"Minor structural crack on main deck star-board side"`) and set severity to `MAJOR`. Submit.
3. The Surveyor then completes and submits the main survey report as usual.
4. **Guard Check:** Log in as **TM** and try to click **Finalize Survey**.
*   **Verification Check:**
    *   The system must **block finalization** and show an error/warning banner: *"Job finalization blocked — Open Non-Conformities detected."*
5. **Resolution:** Log in as **TO** or **TM**. Go to the Non-Conformities tab. Click **Close Non-Conformity** (after corrective action receipt is verified).
6. Once the NC is marked as `CLOSED`, try to finalize the survey again.
    *   *Check:* The TM can now successfully finalize the survey and proceed.

---

## 5. End-to-End Workflow C: Certificate Lifecycle Actions
Once a certificate is issued (status `VALID` / `CERTIFIED`), test these post-certification management actions.

| Action | Role | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| **Suspend** | `TM` | Go to Certificate details page -> click **Suspend** -> Enter reason. | Status changes to `SUSPENDED`. Public verification page shows the certificate is temporarily invalid. |
| **Restore** | `TM` | Go to Suspended certificate -> click **Restore** -> Enter remarks. | Status changes back to `VALID`. Public verification is restored. |
| **Revoke** | `TM` | Go to Certificate details page -> click **Revoke** -> Enter reason. | Status changes to `REVOKED`. **Permanent lock** - certificate cannot be restored or edited. |
| **Renew** | `TM` | Click **Renew** -> input new validity period (years). | Generates a new version draft, while the previous certificate moves to an expired/replaced audit status. |
| **Transfer** | `GM` | Click **Transfer Class** -> select a new Vessel Owner/Client. | The certificate owner association is updated in the database history logs. |
| **Extend** | `GM` | Click **Extend Validity** -> enter months (1-6). | Expiry date of the current certificate is updated. |

---

## 6. General Page-by-Page Testing Checklist

### Dashboard Page
*   Verify counts in the widgets (Total Jobs, Pending Verifications, Active Surveys, Issued Certificates) update accurately when objects transition.
*   Ensure that internal roles see organizational stats, while the **CLIENT** sees only vessel specific summaries.

### Messaging Tab (Job Details)
*   **Internal Chat:** Log in as TO/GM/TM. Send messages and upload attachments in the **Internal Messages** tab. Verify that logouts/switches to CLIENT role hide these messages.
*   **External Chat:** Test sending messages between **CLIENT** and staff. Attachments must render and open.

### Vessels & Clients Pages
*   Add, edit, and view vessel profiles. Check IMO number validation (should enforce 7-digit IMO formatting).

### Audit & History Logs
*   Open the **History** tab on any Job. Every status change must register a record specifying the timestamp, previous state, new state, user name/role, and remarks.

---

## 7. GDPR Compliance Flows (Role: `ADMIN`)
Test data protection workflows:
1. **Export Data:** Navigate to User Settings/Compliance. Click **Export User Dossier** (`GET /api/v1/compliance/export/:id`).
    *   *Expected:* Downloads a clean JSON dossier of the user's registry history, jobs, and upload meta-logs.
2. **Anonymize User:** Select a retired test user. Click **Anonymize User** (`POST /api/v1/compliance/anonymize/:id`).
    *   *Expected:* Scrubs the user's name, email, phone, and IP addresses in the DB, replacing them with redacted identifiers (e.g. `DELETED_USER_123`) to preserve job audit integrity.
