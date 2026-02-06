# Master API List

This document contains a comprehensive list of all implemented APIs along with their expected response objects.

| Module | Method | Endpoint | Description | Expected Response |
|---|---|---|---|---|
| **AI** | **GET** | `/api/v1/ai/anomaly-detect` | Operation | `Unknown` |
| **AI** | **GET** | `/api/v1/ai/risk-score` | Operation | `Unknown` |
| **AI** | **GET** | `/api/v1/ai/survey-quality` | Operation | `Unknown` |
| **APPROVAL** | **POST** | `/api/v1/approvals/` | Create Approval | `result Object` |
| **APPROVAL** | **PUT** | `/api/v1/approvals/:id/step` | Update Step | `result Object` |
| **AUDIT** | **GET** | `/api/v1/audit/` | Get Logs | `Array<log>` |
| **AUTH** | **POST** | `/api/v1/auth/forgot-password` | Forgot Password | `JSON Object` |
| **AUTH** | **POST** | `/api/v1/auth/login` | Login | `JSON Object` |
| **AUTH** | **POST** | `/api/v1/auth/logout` | Logout | `JSON Object` |
| **AUTH** | **POST** | `/api/v1/auth/refresh-token` | Refresh Token | `JSON Object` |
| **AUTH** | **POST** | `/api/v1/auth/register` | Register | `JSON Object` |
| **AUTH** | **POST** | `/api/v1/auth/reset-password` | Reset Password | `JSON Object` |
| **BULK** | **POST** | `/api/v1/bulk/certificates/renew` | Operation | `Unknown` |
| **BULK** | **POST** | `/api/v1/bulk/users` | Operation | `Unknown` |
| **BULK** | **POST** | `/api/v1/bulk/vessels` | Operation | `Unknown` |
| **CERTIFICATE** | **POST** | `/api/v1/certificates/` | Generate Certificate | `cert Object` |
| **CERTIFICATE** | **GET** | `/api/v1/certificates/` | Get Certificates | `Array<cert>` |
| **CERTIFICATE** | **PUT** | `/api/v1/certificates/:id/downgrade` | Downgrade Certificate | `result Object` |
| **CERTIFICATE** | **POST** | `/api/v1/certificates/:id/extend` | Extend Certificate | `result Object` |
| **CERTIFICATE** | **GET** | `/api/v1/certificates/:id/history` | Get History | `history Object` |
| **CERTIFICATE** | **GET** | `/api/v1/certificates/:id/preview` | Preview Certificate | `result Object` |
| **CERTIFICATE** | **POST** | `/api/v1/certificates/:id/reissue` | Reissue Certificate | `result Object` |
| **CERTIFICATE** | **PUT** | `/api/v1/certificates/:id/renew` | Renew Certificate | `result Object` |
| **CERTIFICATE** | **PUT** | `/api/v1/certificates/:id/restore` | Restore Certificate | `result Object` |
| **CERTIFICATE** | **PUT** | `/api/v1/certificates/:id/revoke` | Revoke Certificate | `result Object` |
| **CERTIFICATE** | **POST** | `/api/v1/certificates/:id/sign` | Sign Certificate | `JSON Object` |
| **CERTIFICATE** | **GET** | `/api/v1/certificates/:id/signature` | Get Signature | `JSON Object` |
| **CERTIFICATE** | **PUT** | `/api/v1/certificates/:id/suspend` | Suspend Certificate | `result Object` |
| **CERTIFICATE** | **POST** | `/api/v1/certificates/:id/transfer` | Transfer Certificate | `result Object` |
| **CERTIFICATE** | **GET** | `/api/v1/certificates/expiring` | Get Expiring Certificates | `JSON Object` |
| **CHANGEREQUEST** | **POST** | `/api/v1/change-requests/` | Operation | `Unknown` |
| **CHANGEREQUEST** | **GET** | `/api/v1/change-requests/` | Operation | `Unknown` |
| **CHANGEREQUEST** | **PUT** | `/api/v1/change-requests/:id/approve` | Operation | `Unknown` |
| **CHECKLIST** | **GET** | `/api/v1/jobs/:jobId/checklist` | Get Checklist | `list Object` |
| **CHECKLIST** | **PUT** | `/api/v1/jobs/:jobId/checklist` | Submit Checklist | `list Object` |
| **CLIENT** | **POST** | `/api/v1/clients/` | Create Client | `client Object` |
| **CLIENT** | **GET** | `/api/v1/clients/` | Get Clients | `Array<client>` |
| **CLIENT** | **GET** | `/api/v1/clients/:id` | Get Client By Id | `client Object` |
| **CLIENT** | **PUT** | `/api/v1/clients/:id` | Update Client | `client Object` |
| **CLIENT** | **DELETE** | `/api/v1/clients/:id` | Delete Client | `Standard Response` |
| **CLIENTPORTAL** | **GET** | `/api/v1/client/certificates` | Operation | `Unknown` |
| **CLIENTPORTAL** | **GET** | `/api/v1/client/dashboard` | Operation | `Unknown` |
| **CLIENTPORTAL** | **GET** | `/api/v1/client/jobs` | Operation | `Unknown` |
| **COMPLIANCE** | **POST** | `/api/v1/compliance/anonymize/:userId` | Anonymize User | `result Object` |
| **COMPLIANCE** | **POST** | `/api/v1/compliance/enforce-retention` | Enforce Retention | `result Object` |
| **COMPLIANCE** | **POST** | `/api/v1/compliance/export_bundle` | Export Bundle | `Standard Response` |
| **COMPLIANCE** | **POST** | `/api/v1/compliance/legal-hold` | Set Legal Hold | `JSON Object` |
| **COMPLIANCE** | **DELETE** | `/api/v1/compliance/legal-hold/:entity/:id` | Release Legal Hold | `JSON Object` |
| **COMPLIANCE** | **GET** | `/api/v1/compliance/logs` | Get Logs | `JSON Object` |
| **COMPLIANCE** | **GET** | `/api/v1/compliance/retention` | Get Retention Rules | `JSON Object` |
| **COMPLIANCE** | **POST** | `/api/v1/compliance/retention-rules` | Create Retention Rule | `result Object` |
| **DOC** | **GET** | `/api/v1/documents/:entity/:id` | Get Documents | `Array<doc>` |
| **DOC** | **DELETE** | `/api/v1/documents/:id` | Delete Document | `JSON Object` |
| **DOC** | **POST** | `/api/v1/documents/upload` | Upload Document | `doc Object` |
| **EVENT** | **POST** | `/api/v1/events/` | Operation | `Unknown` |
| **EVENT** | **GET** | `/api/v1/events/` | Operation | `Unknown` |
| **EVENT** | **GET** | `/api/v1/events/:entity/:id` | Operation | `Unknown` |
| **EVIDENCE** | **POST** | `/api/v1/evidence/` | Operation | `Unknown` |
| **EVIDENCE** | **GET** | `/api/v1/evidence/:entity/:id` | Operation | `Unknown` |
| **EVIDENCE** | **GET** | `/api/v1/evidence/:id/chain` | Get Chain | `chain Object` |
| **EVIDENCE** | **PUT** | `/api/v1/evidence/:id/lock` | Lock Evidence | `JSON Object` |
| **EVIDENCE** | **POST** | `/api/v1/evidence/verify` | Verify Evidence | `result Object` |
| **FLAG** | **POST** | `/api/v1/flags/` | Create Flag | `flag Object` |
| **FLAG** | **GET** | `/api/v1/flags/` | Get Flags | `list Object` |
| **FLAG** | **PUT** | `/api/v1/flags/:id` | Update Flag | `flag Object` |
| **GEOFENCE** | **POST** | `/api/v1/geofence/geofence` | Set Geo Fence | `result Object` |
| **GEOFENCE** | **GET** | `/api/v1/geofence/geofence/:vesselId` | Get Geo Fence | `result Object` |
| **GEOFENCE** | **POST** | `/api/v1/geofence/gps/update` | Update Gps | `result Object` |
| **INCIDENT** | **POST** | `/api/v1/incidents/` | Operation | `Unknown` |
| **INCIDENT** | **GET** | `/api/v1/incidents/` | Operation | `Unknown` |
| **INCIDENT** | **PUT** | `/api/v1/incidents/:id/resolve` | Operation | `Unknown` |
| **JOB** | **POST** | `/api/v1/jobs/` | Create Job | `job Object` |
| **JOB** | **GET** | `/api/v1/jobs/` | Get Jobs | `Array<job>` |
| **JOB** | **GET** | `/api/v1/jobs/:id` | Get Job By Id | `job Object` |
| **JOB** | **PUT** | `/api/v1/jobs/:id/assign` | Assign Surveyor | `job Object` |
| **JOB** | **PUT** | `/api/v1/jobs/:id/cancel` | Cancel Job | `job Object` |
| **JOB** | **POST** | `/api/v1/jobs/:id/clone` | Clone Job | `job Object` |
| **JOB** | **PUT** | `/api/v1/jobs/:id/escalate` | Escalate Job | `job Object` |
| **JOB** | **GET** | `/api/v1/jobs/:id/history` | Get History | `history Object` |
| **JOB** | **PUT** | `/api/v1/jobs/:id/hold` | Hold Job | `job Object` |
| **JOB** | **PUT** | `/api/v1/jobs/:id/reassign` | Reassign Surveyor | `job Object` |
| **JOB** | **PUT** | `/api/v1/jobs/:id/resume` | Resume Job | `job Object` |
| **JOB** | **PUT** | `/api/v1/jobs/:id/status` | Update Job Status | `job Object` |
| **MOBILE** | **GET** | `/api/v1/mobile/offline/jobs` | Operation | `Unknown` |
| **MOBILE** | **POST** | `/api/v1/mobile/offline/surveys` | Operation | `Unknown` |
| **MOBILE** | **POST** | `/api/v1/mobile/sync` | Operation | `Unknown` |
| **NC** | **POST** | `/api/v1/non-conformities/` | Create N C | `nc Object` |
| **NC** | **PUT** | `/api/v1/non-conformities/:id/close` | Close N C | `nc Object` |
| **NC** | **GET** | `/api/v1/non-conformities/job/:jobId` | Get By Job | `list Object` |
| **NOTIFICATION** | **GET** | `/api/v1/notifications/` | Get Notifications | `list Object` |
| **NOTIFICATION** | **PUT** | `/api/v1/notifications/:id/read` | Mark Read | `JSON Object` |
| **PAYMENT** | **GET** | `/api/v1/payments/:id/ledger` | Get Ledger | `ledger Object` |
| **PAYMENT** | **PUT** | `/api/v1/payments/:id/pay` | Mark Paid | `payment Object` |
| **PAYMENT** | **POST** | `/api/v1/payments/invoice` | Create Invoice | `invoice Object` |
| **PAYMENT** | **POST** | `/api/v1/payments/writeoff` | Write Off | `result Object` |
| **PUBLIC** | **GET** | `/api/v1/public/certificate/verify/:number` | Verify Certificate | `result Object` |
| **PUBLIC** | **GET** | `/api/v1/public/vessel/:imo` | Verify Vessel | `result Object` |
| **REPORT** | **GET** | `/api/v1/reports/certificates` | Operation | `Unknown` |
| **REPORT** | **GET** | `/api/v1/reports/financials` | Operation | `Unknown` |
| **REPORT** | **GET** | `/api/v1/reports/non-conformities` | Operation | `Unknown` |
| **REPORT** | **GET** | `/api/v1/reports/surveyors` | Operation | `Unknown` |
| **ROLE** | **GET** | `/api/v1/roles/` | Get Roles | `Array<role>` |
| **ROLE** | **POST** | `/api/v1/roles/` | Create Role | `role Object` |
| **ROLE** | **POST** | `/api/v1/roles/:id/permissions` | Assign Permissions | `result Object` |
| **ROLE** | **GET** | `/api/v1/roles/permissions` | Get Permissions | `Array<perm>` |
| **SEARCH** | **GET** | `/api/v1/search/` | Operation | `Unknown` |
| **SEARCH** | **GET** | `/api/v1/search/certificates` | Operation | `Unknown` |
| **SEARCH** | **GET** | `/api/v1/search/vessels` | Operation | `Unknown` |
| **SECURITY** | **POST** | `/api/v1/security/block-ip` | Operation | `Unknown` |
| **SECURITY** | **GET** | `/api/v1/security/login-attempts` | Get Login Attempts | `Array<log>` |
| **SECURITY** | **GET** | `/api/v1/security/policies` | Get Policies | `JSON Object` |
| **SECURITY** | **POST** | `/api/v1/security/policies` | Create Policy | `policy Object` |
| **SECURITY** | **GET** | `/api/v1/security/rate-limits` | Operation | `Unknown` |
| **SECURITY** | **PUT** | `/api/v1/security/rate-limits/:ip` | Operation | `Unknown` |
| **SECURITY** | **GET** | `/api/v1/security/sessions` | Get Sessions | `JSON Object` |
| **SECURITY** | **DELETE** | `/api/v1/security/sessions/:id` | Revoke Session | `JSON Object` |
| **SECURITY** | **DELETE** | `/api/v1/security/sessions/others` | Revoke Other Sessions | `JSON Object` |
| **SECURITY** | **POST** | `/api/v1/security/users/:user_id/logout-force` | Force Logout | `JSON Object` |
| **SLA** | **GET** | `/api/v1/sla/breaches` | Get Breaches | `JSON Object` |
| **SLA** | **POST** | `/api/v1/sla/escalate/:id` | Override Sla | `result Object` |
| **SLA** | **POST** | `/api/v1/sla/evaluate` | Evaluate Sla | `JSON Object` |
| **SLA** | **PUT** | `/api/v1/sla/jobs/:id/override` | Override Sla | `result Object` |
| **SLA** | **PUT** | `/api/v1/sla/jobs/:id/pause` | Pause Sla | `result Object` |
| **SLA** | **PUT** | `/api/v1/sla/jobs/:id/resume` | Resume Sla | `result Object` |
| **SLA** | **POST** | `/api/v1/sla/rules` | Create Rule | `rule Object` |
| **SLA** | **GET** | `/api/v1/sla/rules` | Get Rules | `JSON Object` |
| **SURVEY** | **POST** | `/api/v1/surveys/` | Submit Survey Report | `report Object` |
| **SURVEY** | **GET** | `/api/v1/surveys/` | Get Survey Reports | `Array<report>` |
| **SURVEY** | **PUT** | `/api/v1/surveys/:id/finalize` | Finalize Survey | `result Object` |
| **SURVEY** | **POST** | `/api/v1/surveys/:id/location` | Stream Location | `result Object` |
| **SURVEY** | **POST** | `/api/v1/surveys/:id/proof` | Upload Proof | `result Object` |
| **SURVEY** | **GET** | `/api/v1/surveys/:id/timeline` | Get Timeline | `result Object` |
| **SURVEY** | **POST** | `/api/v1/surveys/:id/violation` | Flag Violation | `result Object` |
| **SURVEY** | **POST** | `/api/v1/surveys/start` | Start Survey | `result Object` |
| **SURVEYOR** | **GET** | `/api/v1/surveyors/:id/profile` | Get Profile | `profile Object` |
| **SURVEYOR** | **PUT** | `/api/v1/surveyors/:id/profile` | Update Profile | `profile Object` |
| **SURVEYOR** | **GET** | `/api/v1/surveyors/applications` | Get Applications | `result Object` |
| **SURVEYOR** | **PUT** | `/api/v1/surveyors/applications/:id/review` | Review Application | `result Object` |
| **SURVEYOR** | **POST** | `/api/v1/surveyors/apply` | Apply Surveyor | `application Object` |
| **SYSTEM** | **GET** | `/api/v1/system/access-policies` | Operation | `Unknown` |
| **SYSTEM** | **POST** | `/api/v1/system/access-policies` | Operation | `Unknown` |
| **SYSTEM** | **GET** | `/api/v1/system/feature-flags` | Get Feature Flags | `JSON Object` |
| **SYSTEM** | **GET** | `/api/v1/system/health` | Get Health | `JSON Object` |
| **SYSTEM** | **POST** | `/api/v1/system/jobs/:id/retry` | Retry Job | `result Object` |
| **SYSTEM** | **GET** | `/api/v1/system/jobs/failed` | Get Failed Jobs | `JSON Object` |
| **SYSTEM** | **GET** | `/api/v1/system/locales` | Operation | `Unknown` |
| **SYSTEM** | **POST** | `/api/v1/system/locales` | Operation | `Unknown` |
| **SYSTEM** | **POST** | `/api/v1/system/maintenance/:action` | Maintenance Action | `result Object` |
| **SYSTEM** | **GET** | `/api/v1/system/metrics` | Get Metrics | `Array<metric>` |
| **SYSTEM** | **GET** | `/api/v1/system/migrations` | Operation | `Unknown` |
| **SYSTEM** | **GET** | `/api/v1/system/readiness` | Get Readiness | `JSON Object` |
| **SYSTEM** | **GET** | `/api/v1/system/version` | Operation | `Unknown` |
| **TEMPLATE** | **POST** | `/api/v1/certificate-templates/` | Operation | `Unknown` |
| **TEMPLATE** | **GET** | `/api/v1/certificate-templates/` | Operation | `Unknown` |
| **TEMPLATE** | **PUT** | `/api/v1/certificate-templates/:id` | Operation | `Unknown` |
| **TOCA** | **POST** | `/api/v1/toca/` | Create Toca | `toca Object` |
| **TOCA** | **GET** | `/api/v1/toca/` | Get Tocas | `list Object` |
| **TOCA** | **PUT** | `/api/v1/toca/:id/status` | Update Status | `toca Object` |
| **USER** | **GET** | `/api/v1/users/` | Get Users | `Array<user>` |
| **USER** | **POST** | `/api/v1/users/` | Create User | `user Object` |
| **USER** | **PUT** | `/api/v1/users/:id` | Update User | `user Object` |
| **USER** | **DELETE** | `/api/v1/users/:id` | Delete User | `result Object` |
| **USER** | **POST** | `/api/v1/users/:id/anonymize` | Operation | `Unknown` |
| **USER** | **POST** | `/api/v1/users/:id/export` | Operation | `Unknown` |
| **USER** | **PUT** | `/api/v1/users/:id/status` | Update Status | `user Object` |
| **VESSEL** | **POST** | `/api/v1/vessels/` | Create Vessel | `vessel Object` |
| **VESSEL** | **GET** | `/api/v1/vessels/` | Get Vessels | `Array<vessel>` |
| **VESSEL** | **GET** | `/api/v1/vessels/:id` | Get Vessel By Id | `vessel Object` |
| **VESSEL** | **PUT** | `/api/v1/vessels/:id` | Update Vessel | `vessel Object` |
| **WEBHOOK** | **POST** | `/api/v1/callbacks/callbacks/flag` | Operation | `Unknown` |
| **WEBHOOK** | **POST** | `/api/v1/callbacks/callbacks/payment` | Operation | `Unknown` |
| **WEBHOOK** | **POST** | `/api/v1/callbacks/flag` | Operation | `Unknown` |
| **WEBHOOK** | **POST** | `/api/v1/callbacks/payment` | Operation | `Unknown` |
| **WEBHOOK** | **POST** | `/api/v1/callbacks/register` | Operation | `Unknown` |
| **WEBHOOK** | **POST** | `/api/v1/callbacks/trigger` | Operation | `Unknown` |
| **WEBHOOK** | **POST** | `/api/v1/register` | Operation | `Unknown` |
| **WEBHOOK** | **POST** | `/api/v1/trigger` | Operation | `Unknown` |
| **WEBHOOK** | **POST** | `/api/v1/webhooks/callbacks/flag` | Operation | `Unknown` |
| **WEBHOOK** | **POST** | `/api/v1/webhooks/callbacks/payment` | Operation | `Unknown` |
| **WEBHOOK** | **POST** | `/api/v1/webhooks/register` | Operation | `Unknown` |
| **WEBHOOK** | **POST** | `/api/v1/webhooks/trigger` | Operation | `Unknown` |
