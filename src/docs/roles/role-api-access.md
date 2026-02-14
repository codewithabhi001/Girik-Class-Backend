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
  - POST /api/v1/mobile/sync, GET /api/v1/mobile/offline/jobs, POST /api/v1/mobile/offline/surveys
  Reason: mobile & checklist endpoints used by surveyors in the field.

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

