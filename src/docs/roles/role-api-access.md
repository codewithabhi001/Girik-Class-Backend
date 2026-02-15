# Role API Access Matrix

This document lists APIs by role, based on current route-level authorization in `src/modules/*/*.routes.js`.

Base API prefix: `/api/v1`

## Source and scope

- Mount points from `src/routes.js`
- Role checks from `authorizeRoles(...)` and `hasRole(...)`
- If a route only uses `authenticate` (no role check), it is available to all authenticated users

## Public APIs (no auth required)

- `GET /api/v1/health`
- `GET /api/v1/public/certificate/verify/:number`
- `GET /api/v1/public/vessel/:imo`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh-token`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/surveyors/apply`
- `GET /api/v1/certificates/verify/:number`

## Authenticated APIs (all logged-in users)

- `POST /api/v1/auth/logout`
- `GET /api/v1/dashboard`
- `GET /api/v1/notifications`
- `PUT /api/v1/notifications/:id/read`
- `PUT /api/v1/notifications/read-all`
- `GET /api/v1/search`
- `POST /api/v1/support`
- `GET /api/v1/support`
- `GET /api/v1/support/:id`
- `GET /api/v1/users/me`
- `GET /api/v1/system/health`
- `GET /api/v1/system/readiness`
- `GET /api/v1/system/version`
- `GET /api/v1/jobs/:jobId/checklist`

---

## SURVEYOR

- Jobs
  - `GET /api/v1/jobs`
  - `GET /api/v1/jobs/:id`
  - `GET /api/v1/jobs/:id/messages/external`
  - `POST /api/v1/jobs/:id/messages`
- Surveys
  - `POST /api/v1/surveys/start`
  - `POST /api/v1/surveys`
  - `POST /api/v1/surveys/:id/location`
  - `POST /api/v1/surveys/:id/proof`
- Checklists
  - `PUT /api/v1/jobs/:jobId/checklist`
  - `GET /api/v1/checklist-templates`
  - `GET /api/v1/checklist-templates/job/:jobId`
  - `GET /api/v1/checklist-templates/:id`
- Certificates (read)
  - `GET /api/v1/certificates/types`
  - `GET /api/v1/certificates`
  - `GET /api/v1/certificates/:id`
  - `GET /api/v1/certificates/:id/download`
  - `GET /api/v1/certificates/:id/preview`
  - `GET /api/v1/certificates/:id/signature`
  - `GET /api/v1/certificates/:id/history`
- Others
  - `POST /api/v1/non-conformities`
  - `GET /api/v1/non-conformities/job/:jobId`
  - `GET /api/v1/vessels`
  - `GET /api/v1/vessels/:id`
  - `GET /api/v1/documents/:entityType/:entityId`
  - `GET /api/v1/surveyors/:id/profile`
  - `POST /api/v1/surveyors/availability`
  - `POST /api/v1/surveyors/location`

## CLIENT

- Clients
  - `GET /api/v1/clients/profile`
  - `PUT /api/v1/clients/profile`
  - `GET /api/v1/clients/dashboard`
- Jobs
  - `POST /api/v1/jobs`
  - `GET /api/v1/jobs`
  - `GET /api/v1/jobs/:id`
  - `PUT /api/v1/jobs/:id/cancel`
  - `GET /api/v1/jobs/:id/messages/external`
  - `POST /api/v1/jobs/:id/messages`
- Certificates
  - `GET /api/v1/certificates/types`
  - `GET /api/v1/certificates`
  - `GET /api/v1/certificates/expiring`
  - `GET /api/v1/certificates/:id`
  - `GET /api/v1/certificates/:id/download`
  - `GET /api/v1/certificates/:id/preview`
  - `GET /api/v1/certificates/:id/signature`
  - `GET /api/v1/certificates/:id/history`
- Others
  - `GET /api/v1/vessels`
  - `GET /api/v1/vessels/:id`
  - `POST /api/v1/incidents`
  - `GET /api/v1/incidents`
  - `GET /api/v1/incidents/:id`
  - `POST /api/v1/change-requests`
  - `GET /api/v1/documents/:entityType/:entityId`
  - `POST /api/v1/documents/:entityType/:entityId`
  - `POST /api/v1/activity-requests`
  - `GET /api/v1/activity-requests`
  - `GET /api/v1/activity-requests/:id`
  - `POST /api/v1/customer-feedback`
  - `GET /api/v1/customer-feedback/job/:jobId`
  - `GET /api/v1/payments`
  - `GET /api/v1/payments/summary`
  - `GET /api/v1/payments/:id`
  - `GET /api/v1/compliance/export/:id`

## TO

- `GET /api/v1/clients`, `GET /api/v1/clients/:id`
- `GET /api/v1/jobs`, `GET /api/v1/jobs/:id`, `PUT /api/v1/jobs/:id/status`
- `GET /api/v1/jobs/:id/history`, `POST /api/v1/jobs/:id/notes`
- `GET /api/v1/jobs/:id/messages/external`, `GET /api/v1/jobs/:id/messages/internal`, `POST /api/v1/jobs/:id/messages`
- `GET /api/v1/surveys`
- `GET /api/v1/certificates/types`, `GET /api/v1/certificates`, `GET /api/v1/certificates/expiring`
- `GET /api/v1/certificates/:id`, `GET /api/v1/certificates/:id/download`, `GET /api/v1/certificates/:id/preview`, `GET /api/v1/certificates/:id/signature`, `GET /api/v1/certificates/:id/history`
- `GET /api/v1/checklist-templates/job/:jobId`
- `POST /api/v1/non-conformities`, `PUT /api/v1/non-conformities/:id/close`, `GET /api/v1/non-conformities/job/:jobId`
- `GET /api/v1/incidents`, `GET /api/v1/incidents/:id`
- `GET /api/v1/activity-requests`, `GET /api/v1/activity-requests/:id`
- `GET /api/v1/documents/:entityType/:entityId`
- `GET /api/v1/vessels`, `GET /api/v1/vessels/:id`
- `GET /api/v1/flags` (intended; see note below)

## TM

- Full access for technical and approval operations across:
  - Clients (`POST/GET/PUT /clients*`)
  - Jobs (status, reassign, lifecycle, priority, notes, internal/external messaging)
  - Surveys (`PUT /surveys/:id/finalize`, `GET /surveys`, `GET /surveys/:id/timeline`, `POST /surveys/:id/violation`)
  - Certificates (generate, suspend/revoke/restore/renew, bulk renew, reissue + read APIs)
  - Vessels (`GET/POST/PUT`, plus `GET /vessels/client/:clientId`)
  - Reports (`GET /reports/certificates|surveyors|non-conformities|financials`)
  - TOCA (`POST /toca`, `PUT /toca/:id/status`, `GET /toca`)
  - Change requests (`POST/GET /change-requests`)
  - Approvals (`POST /approvals`, `PUT /approvals/:id/step`)
  - Documents (`GET/POST /documents/...`)
  - Templates (`GET /certificate-templates`, `GET /certificate-templates/:id`)
  - NC (`PUT /non-conformities/:id/close`, `GET /non-conformities/job/:jobId`)
  - Activity requests (`POST/GET /activity-requests`, `GET /activity-requests/:id`, `PUT /activity-requests/:id/status`)
  - Incidents (`POST/GET /incidents`, `GET /incidents/:id`, `PUT /incidents/:id/status`)
  - Surveyor management (`POST /surveyors`, applications review, profile update, location history)
  - Payments (`GET /payments`, `GET /payments/:id`, `POST /payments/invoice`, `PUT /payments/:id/pay`, `POST /payments/:id/partial`)
  - Flags (`GET /flags`)

## GM

- Broad management access across:
  - Clients, Jobs, Certificates, Vessels, Reports
  - Change requests (including approve/reject)
  - Approvals, Documents (including delete), Activity requests, Incidents
  - Feedback read APIs
  - Payments (including refund and ledger)
  - `PUT /api/v1/support/:id/status`
  - `GET /api/v1/flags`

## ADMIN

- Access to almost all internal APIs, including admin-only endpoints:
  - Full `/users` management
  - Full `/system` admin and operations endpoints
  - Certificate type creation
  - Template and checklist-template create/update/delete/activate/clone
  - Flags create/update
  - Payment write-off

## TA

- No route-level endpoint currently includes `TA` in `authorizeRoles(...)` or `hasRole(...)`.
- TA can still access authenticated common APIs listed above.

## FLAG_ADMIN

- No route-level endpoint currently includes `FLAG_ADMIN` in `authorizeRoles(...)` or `hasRole(...)`.
- FLAG_ADMIN can still access authenticated common APIs listed above.

---

## Notes

- In `flags` routes, one role is written as `To` instead of `TO`:
  - `authorizeRoles('ADMIN', 'GM', 'TM', 'To')`
  - If role comparison is case-sensitive, `TO` users will not match this check.
# Role → API access list

This file lists API endpoints (method + path) grouped by role. Paths use the API prefix `/api/v1` (router mounts in `src/routes.js`). Each entry includes a short reason why the role has access.

Notes:
- Source: route-level authorizations declared with `authorizeRoles(...)` across `src/**/routes.js`.
- TA and FLAG_ADMIN exist in the user model but currently have no role-specific routes.

---

## ADMIN
- Jobs
  - GET /api/v1/jobs — full job list / management
  - POST /api/v1/jobs — create job (admin may create on behalf of others)
  - GET /api/v1/jobs/:id — view job
  - PUT /api/v1/jobs/:id/status — update job status
  - PUT /api/v1/jobs/:id/assign — assign surveyor (with GM)
  - PUT /api/v1/jobs/:id/reassign — reassign surveyor (with GM/TM)
  - PUT /api/v1/jobs/:id/escalate — escalate job (with GM/TM/TO)
  - PUT /api/v1/jobs/:id/cancel, /:id/hold, /:id/resume, POST /:id/clone — lifecycle control
  - PUT /api/v1/jobs/:id/priority — set priority
  - GET /api/v1/jobs/:id/history — audit/history (with GM/TM/TO)
  - POST /api/v1/jobs/:id/notes — internal notes (with GM/TM/TO)
  - Messaging endpoints for jobs (external/internal)
  Reason: system/organization-level management of job lifecycle and auditing.

- Certificates
  - POST /api/v1/certificates/types — create certificate type
  - POST /api/v1/certificates — generate certificate (ADMIN/GM/TM)
  - PUT /api/v1/certificates/:id/suspend — suspend (with TM)
  - PUT /api/v1/certificates/:id/revoke — revoke (with TM)
  - PUT /api/v1/certificates/:id/restore — restore (with TM)
  - PUT /api/v1/certificates/:id/renew — renew (with TM)
  - POST /api/v1/certificates/bulk-renew — bulk renew (with TM)
  - POST /api/v1/certificates/:id/reissue — reissue (with TM)
  - POST /api/v1/certificates/:id/transfer — transfer (with GM)
  - POST /api/v1/certificates/:id/extend — extend (with GM)
  - PUT /api/v1/certificates/:id/downgrade — downgrade (with GM)
  - POST /api/v1/certificates/:id/sign — sign (ADMIN, GM)
  Reason: authoritative certificate management and system-level control.

- Clients / Users / System
  - POST/GET/PUT /api/v1/clients* — manage clients (with GM/TM depending)
  - Full user management: GET/POST/PUT/DELETE /api/v1/users* (ADMIN only)
  - System endpoints: /api/v1/system/metrics, /audit-logs, /jobs/failed, /jobs/:id/retry, /maintenance/:action, /feature-flags, /locales
  Reason: administrative and system operations.

- Templates / Documents / Approvals / Reports / Others
  - POST /api/v1/certificate-templates, template CRUD (ADMIN/GM/TM)
  - Document delete/upload endpoints (some ADMIN/GM)
  - Reports endpoints mounted under `/reports` are restricted to ADMIN/GM/TM
  Reason: administrative control over system templates, docs and reporting.

---

## GM (General Manager)
- Jobs
  - GET /api/v1/jobs — view & filter jobs
  - POST /api/v1/jobs — create job (with ADMIN)
  - GET /api/v1/jobs/:id — view job
  - PUT /api/v1/jobs/:id/assign — assign surveyor (with ADMIN)
  - PUT /api/v1/jobs/:id/reassign — reassign (with TM)
  - PUT /api/v1/jobs/:id/escalate — escalate (with TM/TO)
  - Lifecycle & priority endpoints (shared with ADMIN/TM)
  Reason: operational manager role for assignments and oversight.

- Certificates
  - GET /api/v1/certificates, GET /api/v1/certificates/:id, GET /api/v1/certificates/types, GET /api/v1/certificates/expiring
  - POST /api/v1/certificates — generate certificate (ADMIN, GM, TM)
  - Advanced actions often require ADMIN or TM (transfer/extend/downgrade)
  Reason: approve/generate certificates and view certificate data.

- Clients / Templates / Reports
  - Client management endpoints (with ADMIN/TM)
  - Template listing & management (depending on endpoint)
  - Reports (ADMIN/GM/TM)
  Reason: GM is managerial/approver for regional operations.

---

## TM (Technical Manager)
- Surveys
  - PUT /api/v1/surveys/:id/finalize — finalize survey (TM-only)
  - GET /api/v1/surveys — list (ADMIN, GM, TM, TO have access)
  - GET /api/v1/surveys/:id/timeline — execution timeline (ADMIN, GM, TM)
  - POST /api/v1/surveys/:id/violation — flag violation (ADMIN, TM)
  Reason: TM performs technical checks and sign-off.

- Jobs
  - GET /api/v1/jobs, GET /api/v1/jobs/:id
  - PUT /api/v1/jobs/:id/status — change job status (ADMIN, GM, TM, TO)
  - PUT /api/v1/jobs/:id/reassign — reassign (with GM)
  - PUT /api/v1/jobs/:id/escalate — escalate (with GM, TO)
  Reason: technical oversight and status control.

- Certificates
  - POST /api/v1/certificates — generate certificate (ADMIN, GM, TM)
  - PUT /api/v1/certificates/:id/suspend, /revoke, /restore, /renew — cert authority actions (with ADMIN)
  - POST /api/v1/certificates/bulk-renew, /:id/reissue — certificate lifecycle management
  - GET /api/v1/certificates/:id/preview, /history — inspect certs
  Reason: TM has authority to manage/validate certificates.

- Approvals / Toca / Incidents / NCs
  - POST /api/v1/approvals, PUT /api/v1/approvals/:id/step — approval workflows (ADMIN, GM, TM)
  - TOCA endpoints: create & status updates (TM primary)
  - NC close: PUT /api/v1/non-conformities/:id/close (TO, TM)
  Reason: technical approvals and non-conformity closure.

---

## TO (Technical Officer)
- Jobs & Lists
  - GET /api/v1/jobs — view jobs (with ADMIN, GM, TM)
  - GET /api/v1/jobs/:id — view job details
  - PUT /api/v1/jobs/:id/escalate — participate in escalations
  - GET /api/v1/jobs/:id/history — view history (with ADMIN/GM/TM)
  Reason: TO assists in operational tasks and escalations.

- Surveys & Certificates (read)
  - GET /api/v1/surveys — list survey reports (ADMIN, GM, TM, TO)
  - GET /api/v1/certificates/types, GET /api/v1/certificates, GET /api/v1/certificates/:id — view cert metadata and lists
  Reason: read & operational access to support TM/GM.

- Non-conformities / Incidents
  - POST /api/v1/non-conformities — create NC (SURVEYOR, TO)
  - PUT /api/v1/non-conformities/:id/close — TO or TM can close
  - GET /api/v1/incidents — view incidents (CLIENT, ADMIN, GM, TM, TO)
  Reason: TO is operational actor for NC and incident handling.

- Activity requests / other reads
  - GET /api/v1/activity-requests — TO included in read endpoints
  Reason: operational read-access for activity coordination.

---

## SURVEYOR
- Surveys (primary)
  - POST /api/v1/surveys/start — start survey (check-in)
  - POST /api/v1/surveys — submit survey report (multipart/photo)
  - POST /api/v1/surveys/:id/location — stream GPS location
  - POST /api/v1/surveys/:id/proof — upload evidence (photo)
  Reason: field operator actions to perform/submit survey work and evidence.

- Checklists / Mobile
  - PUT /api/v1/checklists/jobs/:jobId/checklist — submit checklist
  Reason: checklist endpoints used by surveyors in the field.

- Non-conformities / NCs
  - POST /api/v1/non-conformities — create NC (with TO)
  Reason: report issues observed during survey.

- Certificates (read)
  - GET /api/v1/certificates/types, GET /api/v1/certificates/:id/preview, download (some read endpoints include SURVEYOR)
  Reason: surveyors may need to view certificate templates/previews.

---

## CLIENT
- Jobs
  - POST /api/v1/jobs — create job for their vessel
  - GET /api/v1/jobs — view their scoped jobs
  - GET /api/v1/jobs/:id — view job details
  - PUT /api/v1/jobs/:id/cancel — cancel own job (with GM/TM/Admin)
  Reason: client-facing job management for their vessels.

- Certificates
  - GET /api/v1/certificates/types, GET /api/v1/certificates, GET /api/v1/certificates/:id, GET /api/v1/certificates/:id/download
  - GET /api/v1/certificates/expiring
  Reason: clients need access to their vessel certificates and downloads.

- Documents / Feedback / Incidents
  - POST /api/v1/documents/:entityType/:entityId — upload documents (client allowed)
  - POST /api/v1/customer-feedback — submit feedback
  - POST /api/v1/incidents — report incident (CLIENT, ADMIN, GM, TM)
  Reason: client interactions and reporting.

---

## TA
- No route-level authorizations currently include `TA`. (Role exists in `src/models/user.model.js` but is not used in `authorizeRoles(...)`).

---

## FLAG_ADMIN
- No route-level authorizations currently include `FLAG_ADMIN`.

---

If you want a machine-readable export (CSV or JSON) listing every single method+path+roles exactly as declared, I can generate that file next. Which format do you prefer? (CSV / JSON / more detailed Markdown table) 

