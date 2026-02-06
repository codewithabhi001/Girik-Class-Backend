# API Access Guide: Roles & Responses

## Role: ADMIN
| Module | Method | Endpoint | Expected Response |
|---|---|---|---|
| client | **POST** | `/api/v1/clients/` | `client Object` |
| client | **GET** | `/api/v1/clients/` | `Array<client>` |
| client | **GET** | `/api/v1/clients/:id` | `client Object` |
| client | **PUT** | `/api/v1/clients/:id` | `client Object` |
| client | **DELETE** | `/api/v1/clients/:id` | `Standard Response` |
| vessel | **POST** | `/api/v1/vessels/` | `vessel Object` |
| vessel | **GET** | `/api/v1/vessels/` | `Array<vessel>` |
| vessel | **GET** | `/api/v1/vessels/:id` | `vessel Object` |
| vessel | **PUT** | `/api/v1/vessels/:id` | `vessel Object` |
| job | **POST** | `/api/v1/jobs/` | `job Object` |
| job | **PUT** | `/api/v1/jobs/:id/status` | `job Object` |
| job | **PUT** | `/api/v1/jobs/:id/assign` | `job Object` |
| survey | **GET** | `/api/v1/surveys/:id/timeline` | `result Object` |
| survey | **POST** | `/api/v1/surveys/:id/violation` | `result Object` |
| survey | **GET** | `/api/v1/surveys/` | `Array<report>` |
| certificate | **POST** | `/api/v1/certificates/` | `cert Object` |
| certificate | **PUT** | `/api/v1/certificates/:id/suspend` | `result Object` |
| certificate | **PUT** | `/api/v1/certificates/:id/revoke` | `result Object` |
| certificate | **PUT** | `/api/v1/certificates/:id/restore` | `result Object` |
| certificate | **PUT** | `/api/v1/certificates/:id/renew` | `result Object` |
| certificate | **POST** | `/api/v1/certificates/:id/reissue` | `result Object` |
| certificate | **POST** | `/api/v1/certificates/:id/sign` | `JSON Object` |
| payment | **POST** | `/api/v1/payments/invoice` | `invoice Object` |
| payment | **PUT** | `/api/v1/payments/:id/pay` | `payment Object` |
| surveyor | **GET** | `/api/v1/surveyors/applications` | `result Object` |
| surveyor | **PUT** | `/api/v1/surveyors/applications/:id/review` | `result Object` |
| surveyor | **GET** | `/api/v1/surveyors/:id/profile` | `profile Object` |
| surveyor | **PUT** | `/api/v1/surveyors/:id/profile` | `profile Object` |
| geofence | **POST** | `/api/v1/geofence/geofence` | `result Object` |
| geofence | **GET** | `/api/v1/geofence/geofence/:vesselId` | `result Object` |
| toca | **PUT** | `/api/v1/toca/:id/status` | `toca Object` |
| flag | **POST** | `/api/v1/flags/` | `flag Object` |
| flag | **PUT** | `/api/v1/flags/:id` | `flag Object` |
| audit | **GET** | `/api/v1/audit/` | `Array<log>` |
| user | **POST** | `/api/v1/users/:id/export` | `Unknown` |
| user | **POST** | `/api/v1/users/:id/anonymize` | `Unknown` |
| user | **GET** | `/api/v1/users/` | `Array<user>` |
| user | **POST** | `/api/v1/users/` | `user Object` |
| user | **PUT** | `/api/v1/users/:id` | `user Object` |
| user | **PUT** | `/api/v1/users/:id/status` | `user Object` |
| user | **DELETE** | `/api/v1/users/:id` | `result Object` |
| role | **GET** | `/api/v1/roles/` | `Array<role>` |
| role | **POST** | `/api/v1/roles/` | `role Object` |
| role | **POST** | `/api/v1/roles/:id/permissions` | `result Object` |
| role | **GET** | `/api/v1/roles/permissions` | `Array<perm>` |
| evidence | **POST** | `/api/v1/evidence/verify` | `result Object` |
| evidence | **PUT** | `/api/v1/evidence/:id/lock` | `JSON Object` |
| system | **GET** | `/api/v1/system/access-policies` | `Unknown` |
| system | **POST** | `/api/v1/system/access-policies` | `Unknown` |
| system | **GET** | `/api/v1/system/migrations` | `Unknown` |
| system | **POST** | `/api/v1/system/locales` | `Unknown` |
| security | **POST** | `/api/v1/security/users/:user_id/logout-force` | `JSON Object` |
| security | **GET** | `/api/v1/security/policies` | `JSON Object` |
| security | **POST** | `/api/v1/security/policies` | `policy Object` |
| security | **GET** | `/api/v1/security/login-attempts` | `Array<log>` |
| changeRequest | **PUT** | `/api/v1/change-requests/:id/approve` | `Unknown` |
| event | **GET** | `/api/v1/events/` | `Unknown` |

## Role: ALL (Authenticated)
| Module | Method | Endpoint | Expected Response |
|---|---|---|---|
| public | **GET** | `/api/v1/public/certificate/verify/:number` | `result Object` |
| public | **GET** | `/api/v1/public/vessel/:imo` | `result Object` |
| auth | **POST** | `/api/v1/auth/login` | `JSON Object` |
| auth | **POST** | `/api/v1/auth/register` | `JSON Object` |
| auth | **POST** | `/api/v1/auth/logout` | `JSON Object` |
| auth | **POST** | `/api/v1/auth/refresh-token` | `JSON Object` |
| auth | **POST** | `/api/v1/auth/forgot-password` | `JSON Object` |
| auth | **POST** | `/api/v1/auth/reset-password` | `JSON Object` |
| job | **GET** | `/api/v1/jobs/` | `Array<job>` |
| job | **GET** | `/api/v1/jobs/:id` | `job Object` |
| certificate | **GET** | `/api/v1/certificates/` | `Array<cert>` |
| certificate | **GET** | `/api/v1/certificates/:id/preview` | `result Object` |
| certificate | **GET** | `/api/v1/certificates/:id/signature` | `JSON Object` |
| certificate | **GET** | `/api/v1/certificates/:id/history` | `history Object` |
| surveyor | **POST** | `/api/v1/surveyors/apply` | `application Object` |
| checklist | **GET** | `/api/v1/jobs/:jobId/checklist` | `list Object` |
| nc | **GET** | `/api/v1/non-conformities/job/:jobId` | `list Object` |
| toca | **GET** | `/api/v1/toca/` | `list Object` |
| flag | **GET** | `/api/v1/flags/` | `list Object` |
| approval | **POST** | `/api/v1/approvals/` | `result Object` |
| approval | **PUT** | `/api/v1/approvals/:id/step` | `result Object` |
| notification | **GET** | `/api/v1/notifications/` | `list Object` |
| notification | **PUT** | `/api/v1/notifications/:id/read` | `JSON Object` |
| doc | **POST** | `/api/v1/documents/upload` | `doc Object` |
| doc | **GET** | `/api/v1/documents/:entity/:id` | `Array<doc>` |
| doc | **DELETE** | `/api/v1/documents/:id` | `JSON Object` |
| evidence | **POST** | `/api/v1/evidence/` | `Unknown` |
| evidence | **GET** | `/api/v1/evidence/:entity/:id` | `Unknown` |
| evidence | **GET** | `/api/v1/evidence/:id/chain` | `chain Object` |
| mobile | **POST** | `/api/v1/mobile/sync` | `Unknown` |
| mobile | **GET** | `/api/v1/mobile/offline/jobs` | `Unknown` |
| mobile | **POST** | `/api/v1/mobile/offline/surveys` | `Unknown` |
| clientPortal | **GET** | `/api/v1/client/dashboard` | `Unknown` |
| clientPortal | **GET** | `/api/v1/client/jobs` | `Unknown` |
| clientPortal | **GET** | `/api/v1/client/certificates` | `Unknown` |
| system | **GET** | `/api/v1/system/version` | `Unknown` |
| system | **GET** | `/api/v1/system/locales` | `Unknown` |
| security | **GET** | `/api/v1/security/rate-limits` | `Unknown` |
| security | **PUT** | `/api/v1/security/rate-limits/:ip` | `Unknown` |
| security | **GET** | `/api/v1/security/sessions` | `JSON Object` |
| security | **DELETE** | `/api/v1/security/sessions/others` | `JSON Object` |
| security | **DELETE** | `/api/v1/security/sessions/:id` | `JSON Object` |
| security | **POST** | `/api/v1/security/block-ip` | `Unknown` |
| report | **GET** | `/api/v1/reports/certificates` | `Unknown` |
| report | **GET** | `/api/v1/reports/surveyors` | `Unknown` |
| report | **GET** | `/api/v1/reports/non-conformities` | `Unknown` |
| report | **GET** | `/api/v1/reports/financials` | `Unknown` |
| changeRequest | **POST** | `/api/v1/change-requests/` | `Unknown` |
| changeRequest | **GET** | `/api/v1/change-requests/` | `Unknown` |
| template | **POST** | `/api/v1/certificate-templates/` | `Unknown` |
| template | **GET** | `/api/v1/certificate-templates/` | `Unknown` |
| template | **PUT** | `/api/v1/certificate-templates/:id` | `Unknown` |
| incident | **POST** | `/api/v1/incidents/` | `Unknown` |
| incident | **GET** | `/api/v1/incidents/` | `Unknown` |
| incident | **PUT** | `/api/v1/incidents/:id/resolve` | `Unknown` |
| event | **POST** | `/api/v1/events/` | `Unknown` |
| event | **GET** | `/api/v1/events/:entity/:id` | `Unknown` |
| sla | **POST** | `/api/v1/sla/rules` | `rule Object` |
| sla | **GET** | `/api/v1/sla/rules` | `JSON Object` |
| sla | **POST** | `/api/v1/sla/escalate/:id` | `result Object` |
| sla | **PUT** | `/api/v1/sla/jobs/:id/override` | `result Object` |
| sla | **PUT** | `/api/v1/sla/jobs/:id/pause` | `result Object` |
| sla | **PUT** | `/api/v1/sla/jobs/:id/resume` | `result Object` |
| bulk | **POST** | `/api/v1/bulk/vessels` | `Unknown` |
| bulk | **POST** | `/api/v1/bulk/users` | `Unknown` |
| bulk | **POST** | `/api/v1/bulk/certificates/renew` | `Unknown` |
| search | **GET** | `/api/v1/search/` | `Unknown` |
| search | **GET** | `/api/v1/search/vessels` | `Unknown` |
| search | **GET** | `/api/v1/search/certificates` | `Unknown` |
| webhook | **POST** | `/api/v1/webhooks/callbacks/payment` | `Unknown` |
| webhook | **POST** | `/api/v1/webhooks/callbacks/flag` | `Unknown` |
| webhook | **POST** | `/api/v1/webhooks/register` | `Unknown` |
| webhook | **POST** | `/api/v1/webhooks/trigger` | `Unknown` |
| webhook | **POST** | `/api/v1/callbacks/callbacks/payment` | `Unknown` |
| webhook | **POST** | `/api/v1/callbacks/callbacks/flag` | `Unknown` |
| webhook | **POST** | `/api/v1/callbacks/register` | `Unknown` |
| webhook | **POST** | `/api/v1/callbacks/trigger` | `Unknown` |
| webhook | **POST** | `/api/v1/callbacks/payment` | `Unknown` |
| webhook | **POST** | `/api/v1/callbacks/flag` | `Unknown` |
| webhook | **POST** | `/api/v1/register` | `Unknown` |
| webhook | **POST** | `/api/v1/trigger` | `Unknown` |
| compliance | **GET** | `/api/v1/compliance/logs` | `Unknown` |
| compliance | **POST** | `/api/v1/compliance/export` | `Unknown` |
| compliance | **POST** | `/api/v1/compliance/legal-hold` | `Unknown` |
| compliance | **DELETE** | `/api/v1/compliance/legal-hold/:entity/:id` | `Unknown` |
| compliance | **GET** | `/api/v1/compliance/retention` | `Unknown` |
| ai | **GET** | `/api/v1/ai/anomaly-detect` | `Unknown` |
| ai | **GET** | `/api/v1/ai/survey-quality` | `Unknown` |
| ai | **GET** | `/api/v1/ai/risk-score` | `Unknown` |

## Role: CLIENT
| Module | Method | Endpoint | Expected Response |
|---|---|---|---|
| job | **POST** | `/api/v1/jobs/` | `job Object` |

## Role: GM
| Module | Method | Endpoint | Expected Response |
|---|---|---|---|
| client | **POST** | `/api/v1/clients/` | `client Object` |
| client | **GET** | `/api/v1/clients/` | `Array<client>` |
| client | **GET** | `/api/v1/clients/:id` | `client Object` |
| client | **PUT** | `/api/v1/clients/:id` | `client Object` |
| vessel | **POST** | `/api/v1/vessels/` | `vessel Object` |
| vessel | **GET** | `/api/v1/vessels/` | `Array<vessel>` |
| vessel | **GET** | `/api/v1/vessels/:id` | `vessel Object` |
| vessel | **PUT** | `/api/v1/vessels/:id` | `vessel Object` |
| job | **POST** | `/api/v1/jobs/` | `job Object` |
| job | **PUT** | `/api/v1/jobs/:id/status` | `job Object` |
| job | **PUT** | `/api/v1/jobs/:id/assign` | `job Object` |
| job | **PUT** | `/api/v1/jobs/:id/reassign` | `job Object` |
| job | **PUT** | `/api/v1/jobs/:id/escalate` | `job Object` |
| survey | **GET** | `/api/v1/surveys/:id/timeline` | `result Object` |
| survey | **GET** | `/api/v1/surveys/` | `Array<report>` |
| certificate | **POST** | `/api/v1/certificates/` | `cert Object` |
| certificate | **POST** | `/api/v1/certificates/:id/sign` | `JSON Object` |
| payment | **POST** | `/api/v1/payments/invoice` | `invoice Object` |
| payment | **PUT** | `/api/v1/payments/:id/pay` | `payment Object` |
| changeRequest | **PUT** | `/api/v1/change-requests/:id/approve` | `Unknown` |

## Role: SURVEYOR
| Module | Method | Endpoint | Expected Response |
|---|---|---|---|
| vessel | **GET** | `/api/v1/vessels/` | `Array<vessel>` |
| vessel | **GET** | `/api/v1/vessels/:id` | `vessel Object` |
| survey | **POST** | `/api/v1/surveys/start` | `result Object` |
| survey | **POST** | `/api/v1/surveys/` | `report Object` |
| survey | **PUT** | `/api/v1/surveys/:id/finalize` | `result Object` |
| survey | **POST** | `/api/v1/surveys/:id/location` | `result Object` |
| survey | **POST** | `/api/v1/surveys/:id/proof` | `result Object` |
| surveyor | **GET** | `/api/v1/surveyors/:id/profile` | `profile Object` |
| geofence | **POST** | `/api/v1/geofence/gps/update` | `result Object` |
| checklist | **PUT** | `/api/v1/jobs/:jobId/checklist` | `list Object` |
| nc | **POST** | `/api/v1/non-conformities/` | `nc Object` |

## Role: TM
| Module | Method | Endpoint | Expected Response |
|---|---|---|---|
| client | **POST** | `/api/v1/clients/` | `client Object` |
| client | **GET** | `/api/v1/clients/` | `Array<client>` |
| client | **GET** | `/api/v1/clients/:id` | `client Object` |
| client | **PUT** | `/api/v1/clients/:id` | `client Object` |
| vessel | **POST** | `/api/v1/vessels/` | `vessel Object` |
| vessel | **GET** | `/api/v1/vessels/` | `Array<vessel>` |
| vessel | **GET** | `/api/v1/vessels/:id` | `vessel Object` |
| vessel | **PUT** | `/api/v1/vessels/:id` | `vessel Object` |
| job | **PUT** | `/api/v1/jobs/:id/status` | `job Object` |
| job | **PUT** | `/api/v1/jobs/:id/reassign` | `job Object` |
| job | **PUT** | `/api/v1/jobs/:id/escalate` | `job Object` |
| survey | **GET** | `/api/v1/surveys/:id/timeline` | `result Object` |
| survey | **POST** | `/api/v1/surveys/:id/violation` | `result Object` |
| survey | **GET** | `/api/v1/surveys/` | `Array<report>` |
| certificate | **POST** | `/api/v1/certificates/` | `cert Object` |
| certificate | **PUT** | `/api/v1/certificates/:id/suspend` | `result Object` |
| certificate | **PUT** | `/api/v1/certificates/:id/revoke` | `result Object` |
| certificate | **PUT** | `/api/v1/certificates/:id/restore` | `result Object` |
| certificate | **PUT** | `/api/v1/certificates/:id/renew` | `result Object` |
| certificate | **POST** | `/api/v1/certificates/:id/reissue` | `result Object` |
| payment | **POST** | `/api/v1/payments/invoice` | `invoice Object` |
| payment | **PUT** | `/api/v1/payments/:id/pay` | `payment Object` |
| surveyor | **GET** | `/api/v1/surveyors/applications` | `result Object` |
| surveyor | **PUT** | `/api/v1/surveyors/applications/:id/review` | `result Object` |
| surveyor | **GET** | `/api/v1/surveyors/:id/profile` | `profile Object` |
| surveyor | **PUT** | `/api/v1/surveyors/:id/profile` | `profile Object` |
| geofence | **POST** | `/api/v1/geofence/geofence` | `result Object` |
| geofence | **GET** | `/api/v1/geofence/geofence/:vesselId` | `result Object` |
| nc | **PUT** | `/api/v1/non-conformities/:id/close` | `nc Object` |
| toca | **POST** | `/api/v1/toca/` | `toca Object` |
| toca | **PUT** | `/api/v1/toca/:id/status` | `toca Object` |
| evidence | **POST** | `/api/v1/evidence/verify` | `result Object` |
| evidence | **PUT** | `/api/v1/evidence/:id/lock` | `JSON Object` |

## Role: TO
| Module | Method | Endpoint | Expected Response |
|---|---|---|---|
| client | **GET** | `/api/v1/clients/` | `Array<client>` |
| client | **GET** | `/api/v1/clients/:id` | `client Object` |
| vessel | **GET** | `/api/v1/vessels/` | `Array<vessel>` |
| vessel | **GET** | `/api/v1/vessels/:id` | `vessel Object` |
| job | **PUT** | `/api/v1/jobs/:id/status` | `job Object` |
| job | **PUT** | `/api/v1/jobs/:id/escalate` | `job Object` |
| survey | **GET** | `/api/v1/surveys/` | `Array<report>` |
| nc | **POST** | `/api/v1/non-conformities/` | `nc Object` |
| nc | **PUT** | `/api/v1/non-conformities/:id/close` | `nc Object` |

