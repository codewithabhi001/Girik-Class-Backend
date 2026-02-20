# Girik Lifecycle Role Matrix

This document defines which roles are authorized to perform specific status transitions and actions for Jobs and Surveys.

## 1. Job Lifecycle Permissions

| Job Status Transition | Authorized Roles | Implementation Detail |
| :--- | :--- | :--- |
| **CREATE** (Initial Request) | CLIENT, ADMIN, GM | Managed via `POST /api/v1/jobs` |
| **APPROVE** (`CREATED` → `APPROVED`) | ADMIN, GM, TM, TO | Managed via `PUT /api/v1/jobs/:id/approve` |
| **ASSIGN** (`APPROVED` → `ASSIGNED`) | ADMIN, GM | TM can also perform REASSIGN |
| **AUTHORIZE** (`ASSIGNED` → `SURVEY_AUTHORIZED`) | ADMIN, GM, TM, TO | Prerequisite for Surveyor to start field work |
| **START** (`SURVEY_AUTHORIZED` → `IN_PROGRESS`) | **SURVEYOR ONLY** | Triggered by the `startSurvey` check-in action |
| **SUBMIT** (`IN_PROGRESS` → `SURVEY_DONE`) | **SURVEYOR ONLY** | Triggered by the `submitSurvey` check-out action |
| **REVIEW** (`SURVEY_DONE` → `REVIEWED`) | GM, TM, TO | Internal verification state |
| **REWORK** (→ `REWORK_REQUESTED`) | GM, TM | Sends job back to Surveyor for corrections |
| **FINALIZE** (`REVIEWED` → `FINALIZED`) | **TM ONLY** | Strict enforcement in `lifecycle.service.js` |
| **PAYMENT** (`FINALIZED` → `PAYMENT_DONE`) | SYSTEM / ADMIN | Triggered upon payment verification |
| **CERTIFY** (`PAYMENT_DONE` → `CERTIFIED`) | **TM ONLY** | Final issuance of the digital certificate |

## 2. Survey Lifecycle Permissions

| Survey Status Transition | Authorized Roles | Implementation Detail |
| :--- | :--- | :--- |
| **START SURVEY** | **SURVEYOR ONLY** | Sets `started_at` timestamp |
| **UPDATE CHECKLIST** | **SURVEYOR ONLY** | Blocked if Survey is locked/finalized |
| **UPLOAD PROOF** | **SURVEYOR ONLY** | Blocked if Survey is locked/finalized |
| **SUBMIT SURVEY** | **SURVEYOR ONLY** | Requires Proof + Checklist; increments `submission_count` |
| **REQUEST REWORK** | GM, TM | Moves Survey to `REWORK_REQUIRED` |
| **FINALIZE SURVEY** | **TM ONLY** | Permanently Locks the survey (`is_locked` = true) |

## 3. Advanced Guardrails

- **Terminal Immutability**: Once a Job is `CERTIFIED` or `REJECTED`, no further status changes are permitted for anyone (including ADMIN).
- **Survey Locking**: Once a Survey is `FINALIZED`, all data-modifying endpoints (proofs, checklists, submission) will return a 400 error.
- **Ownership Check**: For Surveyor actions (Start, Proof, Submit), the system validates that the `user_id` matches the `assigned_surveyor_id` on the Job.
- **Role Hierarchy**: While ADMIN has broad access, critical technical sign-offs (**Finalization** and **Certification**) are strictly reserved for the **Technical Manager (TM)** to ensure professional compliance.
