# API Catalog: Tasks & Descriptions

## Module: AI
| Method | Endpoint | Task Description |
|---|---|---|
| **GET** | `/api/v1/ai/anomaly-detect` | Operation |
| **GET** | `/api/v1/ai/survey-quality` | Operation |
| **GET** | `/api/v1/ai/risk-score` | Operation |

## Module: APPROVAL
| Method | Endpoint | Task Description |
|---|---|---|
| **POST** | `/api/v1/approvals/` | Create Approval |
| **PUT** | `/api/v1/approvals/:id/step` | Update Step |

## Module: AUDIT
| Method | Endpoint | Task Description |
|---|---|---|
| **GET** | `/api/v1/audit/` | Get Logs |

## Module: AUTH
| Method | Endpoint | Task Description |
|---|---|---|
| **POST** | `/api/v1/auth/login` | Login |
| **POST** | `/api/v1/auth/register` | Register |
| **POST** | `/api/v1/auth/logout` | Logout |
| **POST** | `/api/v1/auth/refresh-token` | Refresh Token |
| **POST** | `/api/v1/auth/forgot-password` | Forgot Password |
| **POST** | `/api/v1/auth/reset-password` | Reset Password |

## Module: BULK
| Method | Endpoint | Task Description |
|---|---|---|
| **POST** | `/api/v1/bulk/vessels` | Operation |
| **POST** | `/api/v1/bulk/users` | Operation |
| **POST** | `/api/v1/bulk/certificates/renew` | Operation |

## Module: CERTIFICATE
| Method | Endpoint | Task Description |
|---|---|---|
| **POST** | `/api/v1/certificates/` | Generate Certificate |
| **GET** | `/api/v1/certificates/` | Get Certificates |
| **PUT** | `/api/v1/certificates/:id/suspend` | Suspend Certificate |
| **PUT** | `/api/v1/certificates/:id/revoke` | Revoke Certificate |
| **PUT** | `/api/v1/certificates/:id/restore` | Restore Certificate |
| **PUT** | `/api/v1/certificates/:id/renew` | Renew Certificate |
| **POST** | `/api/v1/certificates/:id/reissue` | Reissue Certificate |
| **GET** | `/api/v1/certificates/:id/preview` | Preview Certificate |
| **POST** | `/api/v1/certificates/:id/sign` | Sign Certificate |
| **GET** | `/api/v1/certificates/:id/signature` | Get Signature |
| **GET** | `/api/v1/certificates/:id/history` | Get History |

## Module: CHANGEREQUEST
| Method | Endpoint | Task Description |
|---|---|---|
| **POST** | `/api/v1/change-requests/` | Operation |
| **GET** | `/api/v1/change-requests/` | Operation |
| **PUT** | `/api/v1/change-requests/:id/approve` | Operation |

## Module: CHECKLIST
| Method | Endpoint | Task Description |
|---|---|---|
| **GET** | `/api/v1/jobs/:jobId/checklist` | Get Checklist |
| **PUT** | `/api/v1/jobs/:jobId/checklist` | Submit Checklist |

## Module: CLIENT
| Method | Endpoint | Task Description |
|---|---|---|
| **POST** | `/api/v1/clients/` | Create Client |
| **GET** | `/api/v1/clients/` | Get Clients |
| **GET** | `/api/v1/clients/:id` | Get Client By Id |
| **PUT** | `/api/v1/clients/:id` | Update Client |
| **DELETE** | `/api/v1/clients/:id` | Delete Client |

## Module: CLIENTPORTAL
| Method | Endpoint | Task Description |
|---|---|---|
| **GET** | `/api/v1/client/dashboard` | Operation |
| **GET** | `/api/v1/client/jobs` | Operation |
| **GET** | `/api/v1/client/certificates` | Operation |

## Module: COMPLIANCE
| Method | Endpoint | Task Description |
|---|---|---|
| **GET** | `/api/v1/compliance/logs` | Operation |
| **POST** | `/api/v1/compliance/export` | Operation |
| **POST** | `/api/v1/compliance/legal-hold` | Operation |
| **DELETE** | `/api/v1/compliance/legal-hold/:entity/:id` | Operation |
| **GET** | `/api/v1/compliance/retention` | Operation |

## Module: DOC
| Method | Endpoint | Task Description |
|---|---|---|
| **POST** | `/api/v1/documents/upload` | Upload Document |
| **GET** | `/api/v1/documents/:entity/:id` | Get Documents |
| **DELETE** | `/api/v1/documents/:id` | Delete Document |

## Module: EVENT
| Method | Endpoint | Task Description |
|---|---|---|
| **POST** | `/api/v1/events/` | Operation |
| **GET** | `/api/v1/events/` | Operation |
| **GET** | `/api/v1/events/:entity/:id` | Operation |

## Module: EVIDENCE
| Method | Endpoint | Task Description |
|---|---|---|
| **POST** | `/api/v1/evidence/` | Operation |
| **GET** | `/api/v1/evidence/:entity/:id` | Operation |
| **GET** | `/api/v1/evidence/:id/chain` | Get Chain |
| **POST** | `/api/v1/evidence/verify` | Verify Evidence |
| **PUT** | `/api/v1/evidence/:id/lock` | Lock Evidence |

## Module: FLAG
| Method | Endpoint | Task Description |
|---|---|---|
| **POST** | `/api/v1/flags/` | Create Flag |
| **GET** | `/api/v1/flags/` | Get Flags |
| **PUT** | `/api/v1/flags/:id` | Update Flag |

## Module: GEOFENCE
| Method | Endpoint | Task Description |
|---|---|---|
| **POST** | `/api/v1/geofence/gps/update` | Update Gps |
| **POST** | `/api/v1/geofence/geofence` | Set Geo Fence |
| **GET** | `/api/v1/geofence/geofence/:vesselId` | Get Geo Fence |

## Module: INCIDENT
| Method | Endpoint | Task Description |
|---|---|---|
| **POST** | `/api/v1/incidents/` | Operation |
| **GET** | `/api/v1/incidents/` | Operation |
| **PUT** | `/api/v1/incidents/:id/resolve` | Operation |

## Module: JOB
| Method | Endpoint | Task Description |
|---|---|---|
| **POST** | `/api/v1/jobs/` | Create Job |
| **GET** | `/api/v1/jobs/` | Get Jobs |
| **GET** | `/api/v1/jobs/:id` | Get Job By Id |
| **PUT** | `/api/v1/jobs/:id/status` | Update Job Status |
| **PUT** | `/api/v1/jobs/:id/assign` | Assign Surveyor |
| **PUT** | `/api/v1/jobs/:id/reassign` | Reassign Surveyor |
| **PUT** | `/api/v1/jobs/:id/escalate` | Escalate Job |

## Module: MOBILE
| Method | Endpoint | Task Description |
|---|---|---|
| **POST** | `/api/v1/mobile/sync` | Operation |
| **GET** | `/api/v1/mobile/offline/jobs` | Operation |
| **POST** | `/api/v1/mobile/offline/surveys` | Operation |

## Module: NC
| Method | Endpoint | Task Description |
|---|---|---|
| **POST** | `/api/v1/non-conformities/` | Create N C |
| **PUT** | `/api/v1/non-conformities/:id/close` | Close N C |
| **GET** | `/api/v1/non-conformities/job/:jobId` | Get By Job |

## Module: NOTIFICATION
| Method | Endpoint | Task Description |
|---|---|---|
| **GET** | `/api/v1/notifications/` | Get Notifications |
| **PUT** | `/api/v1/notifications/:id/read` | Mark Read |

## Module: PAYMENT
| Method | Endpoint | Task Description |
|---|---|---|
| **POST** | `/api/v1/payments/invoice` | Create Invoice |
| **PUT** | `/api/v1/payments/:id/pay` | Mark Paid |

## Module: PUBLIC
| Method | Endpoint | Task Description |
|---|---|---|
| **GET** | `/api/v1/public/certificate/verify/:number` | Verify Certificate |
| **GET** | `/api/v1/public/vessel/:imo` | Verify Vessel |

## Module: REPORT
| Method | Endpoint | Task Description |
|---|---|---|
| **GET** | `/api/v1/reports/certificates` | Operation |
| **GET** | `/api/v1/reports/surveyors` | Operation |
| **GET** | `/api/v1/reports/non-conformities` | Operation |
| **GET** | `/api/v1/reports/financials` | Operation |

## Module: ROLE
| Method | Endpoint | Task Description |
|---|---|---|
| **GET** | `/api/v1/roles/` | Get Roles |
| **POST** | `/api/v1/roles/` | Create Role |
| **POST** | `/api/v1/roles/:id/permissions` | Assign Permissions |
| **GET** | `/api/v1/roles/permissions` | Get Permissions |

## Module: SEARCH
| Method | Endpoint | Task Description |
|---|---|---|
| **GET** | `/api/v1/search/` | Operation |
| **GET** | `/api/v1/search/vessels` | Operation |
| **GET** | `/api/v1/search/certificates` | Operation |

## Module: SECURITY
| Method | Endpoint | Task Description |
|---|---|---|
| **GET** | `/api/v1/security/rate-limits` | Operation |
| **PUT** | `/api/v1/security/rate-limits/:ip` | Operation |
| **GET** | `/api/v1/security/sessions` | Get Sessions |
| **DELETE** | `/api/v1/security/sessions/others` | Revoke Other Sessions |
| **DELETE** | `/api/v1/security/sessions/:id` | Revoke Session |
| **POST** | `/api/v1/security/users/:user_id/logout-force` | Force Logout |
| **GET** | `/api/v1/security/policies` | Get Policies |
| **POST** | `/api/v1/security/policies` | Create Policy |
| **GET** | `/api/v1/security/login-attempts` | Get Login Attempts |
| **POST** | `/api/v1/security/block-ip` | Operation |

## Module: SLA
| Method | Endpoint | Task Description |
|---|---|---|
| **POST** | `/api/v1/sla/rules` | Create Rule |
| **GET** | `/api/v1/sla/rules` | Get Rules |
| **POST** | `/api/v1/sla/escalate/:id` | Override Sla |
| **PUT** | `/api/v1/sla/jobs/:id/override` | Override Sla |
| **PUT** | `/api/v1/sla/jobs/:id/pause` | Pause Sla |
| **PUT** | `/api/v1/sla/jobs/:id/resume` | Resume Sla |

## Module: SURVEY
| Method | Endpoint | Task Description |
|---|---|---|
| **POST** | `/api/v1/surveys/start` | Start Survey |
| **POST** | `/api/v1/surveys/` | Submit Survey Report |
| **PUT** | `/api/v1/surveys/:id/finalize` | Finalize Survey |
| **POST** | `/api/v1/surveys/:id/location` | Stream Location |
| **POST** | `/api/v1/surveys/:id/proof` | Upload Proof |
| **GET** | `/api/v1/surveys/:id/timeline` | Get Timeline |
| **POST** | `/api/v1/surveys/:id/violation` | Flag Violation |
| **GET** | `/api/v1/surveys/` | Get Survey Reports |

## Module: SURVEYOR
| Method | Endpoint | Task Description |
|---|---|---|
| **POST** | `/api/v1/surveyors/apply` | Apply Surveyor |
| **GET** | `/api/v1/surveyors/applications` | Get Applications |
| **PUT** | `/api/v1/surveyors/applications/:id/review` | Review Application |
| **GET** | `/api/v1/surveyors/:id/profile` | Get Profile |
| **PUT** | `/api/v1/surveyors/:id/profile` | Update Profile |

## Module: SYSTEM
| Method | Endpoint | Task Description |
|---|---|---|
| **GET** | `/api/v1/system/access-policies` | Operation |
| **POST** | `/api/v1/system/access-policies` | Operation |
| **GET** | `/api/v1/system/version` | Operation |
| **GET** | `/api/v1/system/migrations` | Operation |
| **GET** | `/api/v1/system/locales` | Operation |
| **POST** | `/api/v1/system/locales` | Operation |

## Module: TEMPLATE
| Method | Endpoint | Task Description |
|---|---|---|
| **POST** | `/api/v1/certificate-templates/` | Operation |
| **GET** | `/api/v1/certificate-templates/` | Operation |
| **PUT** | `/api/v1/certificate-templates/:id` | Operation |

## Module: TOCA
| Method | Endpoint | Task Description |
|---|---|---|
| **POST** | `/api/v1/toca/` | Create Toca |
| **PUT** | `/api/v1/toca/:id/status` | Update Status |
| **GET** | `/api/v1/toca/` | Get Tocas |

## Module: USER
| Method | Endpoint | Task Description |
|---|---|---|
| **POST** | `/api/v1/users/:id/export` | Operation |
| **POST** | `/api/v1/users/:id/anonymize` | Operation |
| **GET** | `/api/v1/users/` | Get Users |
| **POST** | `/api/v1/users/` | Create User |
| **PUT** | `/api/v1/users/:id` | Update User |
| **PUT** | `/api/v1/users/:id/status` | Update Status |
| **DELETE** | `/api/v1/users/:id` | Delete User |

## Module: VESSEL
| Method | Endpoint | Task Description |
|---|---|---|
| **POST** | `/api/v1/vessels/` | Create Vessel |
| **GET** | `/api/v1/vessels/` | Get Vessels |
| **GET** | `/api/v1/vessels/:id` | Get Vessel By Id |
| **PUT** | `/api/v1/vessels/:id` | Update Vessel |

## Module: WEBHOOK
| Method | Endpoint | Task Description |
|---|---|---|
| **POST** | `/api/v1/webhooks/callbacks/payment` | Operation |
| **POST** | `/api/v1/webhooks/callbacks/flag` | Operation |
| **POST** | `/api/v1/webhooks/register` | Operation |
| **POST** | `/api/v1/webhooks/trigger` | Operation |
| **POST** | `/api/v1/callbacks/callbacks/payment` | Operation |
| **POST** | `/api/v1/callbacks/callbacks/flag` | Operation |
| **POST** | `/api/v1/callbacks/register` | Operation |
| **POST** | `/api/v1/callbacks/trigger` | Operation |
| **POST** | `/api/v1/callbacks/payment` | Operation |
| **POST** | `/api/v1/callbacks/flag` | Operation |
| **POST** | `/api/v1/register` | Operation |
| **POST** | `/api/v1/trigger` | Operation |


## Module: ACTIVITY_REQUEST
| Method | Endpoint | Task Description |
|---|---|---|
| **POST** | `/api/v1/activity-requests` | Create Request |
| **GET** | `/api/v1/activity-requests` | List Requests |
| **GET** | `/api/v1/activity-requests/:id` | Get Request |
| **POST** | `/api/v1/activity-requests/:id/approve` | Approve & Convert |
| **POST** | `/api/v1/activity-requests/:id/reject` | Reject Request |
| **GET** | `/api/v1/activity-requests/:id/history` | Get Request History |

## Module: PROVIDER
| Method | Endpoint | Task Description |
|---|---|---|
| **POST** | `/api/v1/providers` | Register Provider |
| **GET** | `/api/v1/providers` | List Providers |
| **PUT** | `/api/v1/providers/:id/status` | Update Status |
| **POST** | `/api/v1/providers/:id/evaluations` | Submit Evaluation |
| **GET** | `/api/v1/providers/:id/evaluations` | Get Evaluations |
| **POST** | `/api/v1/providers/:id/legal-hold` | Set Legal Hold |

## Module: CUSTOMER_FEEDBACK
| Method | Endpoint | Task Description |
|---|---|---|
| **POST** | `/api/v1/customer-feedback` | Submit Feedback |
| **GET** | `/api/v1/customer-feedback` | List Feedback |
| **GET** | `/api/v1/customer-feedback/job/:jobId` | Get Job Feedback |
