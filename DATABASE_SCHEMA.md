# Database Schema Documentation

This document provides a detailed overview of the database tables, their columns, and relationships within the GIRIK BACKEND system, based on the Sequelize models in `src/models`.

## Table of Contents
1. [abac_policies](#abac_policies)
2. [activity_plannings](#activity_plannings)
3. [ai_model_versions](#ai_model_versions)
4. [api_rate_limits](#api_rate_limits)
5. [approvals](#approvals)
6. [approval_matrix](#approval_matrix)
7. [approval_steps](#approval_steps)
8. [audit_logs](#audit_logs)
9. [certificates](#certificates)
10. [certificate_alerts](#certificate_alerts)
11. [certificate_history](#certificate_history)
12. [certificate_types](#certificate_types)
13. [clients](#clients)
14. [documents](#documents)
15. [document_versions](#document_versions)
16. [email_logs](#email_logs)
17. [entity_audit_trail](#entity_audit_trail)
18. [evidence_locks](#evidence_locks)
19. [financial_ledgers](#financial_ledgers)
20. [flag_administrations](#flag_administrations)
21. [geo_fencing_rules](#geo_fencing_rules)
22. [gps_tracking](#gps_tracking)
23. [job_requests](#job_requests)
24. [job_sla_logs](#job_sla_logs)
25. [job_status_history](#job_status_history)
26. [legal_holds](#legal_holds)
27. [login_attempts](#login_attempts)
28. [non_conformities](#non_conformities)
29. [notifications](#notifications)
30. [notification_preferences](#notification_preferences)
31. [payments](#payments)
32. [payment_transactions](#payment_transactions)
33. [permissions](#permissions)
34. [retention_rules](#retention_rules)
35. [roles](#roles)
36. [role_permissions](#role_permissions)
37. [scheduled_tasks](#scheduled_tasks)
38. [sla_rules](#sla_rules)
39. [survey_reports](#survey_reports)
40. [surveyor_applications](#surveyor_applications)
41. [surveyor_profiles](#surveyor_profiles)
42. [system_settings](#system_settings)
43. [tocas](#tocas)
44. [users](#users)
45. [user_sessions](#user_sessions)
46. [vessels](#vessels)

---

## abac_policies
**Purpose**: Stores Attribute-Based Access Control policies for fine-grained permission logic.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `name` (STRING): Unique name of the policy.
- `resource` (STRING): The resource the policy applies to.
- `condition_script` (TEXT): JS-like condition script (e.g., `user.id == resource.owner_id`).
- `effect` (ENUM): 'ALLOW' or 'DENY'. Default: 'ALLOW'.
- `description` (TEXT): Description of the policy.
- `is_active` (BOOLEAN): Default: true.
- `created_at` (DATE)
- `updated_at` (DATE)

---

## activity_plannings
**Purpose**: Planned activities or checklist items for a job.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `job_id` (UUID): **Foreign Key** to `job_requests`.
- `question_code` (STRING): Code identifier for the question.
- `question_text` (STRING): The content of the question.
- `answer` (ENUM): 'YES', 'NO', 'NA'.
- `remarks` (TEXT): Additional comments.

**Relationships**:
- **Belongs To**: `job_requests` (via `job_id`).

---

## ai_model_versions
**Purpose**: Tracks versions of AI models used in the system.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `model_name` (STRING): Name of the model.
- `version` (STRING): Version string.
- `description` (TEXT): Description of this version.
- `metrics_json` (JSON): Performance metrics (accuracy, F1 score, etc.).
- `is_active` (BOOLEAN): Default: false.
- `trained_at` (DATE): When training completed.
- `trained_by` (UUID): User ID who trained it.
- `created_at` (DATE)
- `updated_at` (DATE)

---

## api_rate_limits
**Purpose**: Stores rate limiting data for API endpoints.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `ip_address` (STRING): Client IP.
- `endpoint` (STRING): The API path.
- `request_count` (INTEGER): Number of requests.
- `last_request_at` (DATE): Timestamp of last request.

---

## approvals
**Purpose**: Generic approval workflow tracker.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `entity_type` (STRING): The type of entity (e.g. 'JOB').
- `entity_id` (UUID): ID of the entity.
- `approved_by` (UUID): **Foreign Key** to `users`.
- `role` (STRING): Role responsible for approval.
- `status` (ENUM): 'PENDING', 'APPROVED', 'REJECTED'. Default: 'PENDING'.
- `remarks` (TEXT): Approval remarks.
- `approved_at` (DATE): Timestamp of decision.

**Relationships**:
- **Belongs To**: `users` (via `approved_by`).
- **Has Many**: `approval_steps` (via `approval_id`).

---

## approval_matrix
**Purpose**: dynamic configuration for approval logic.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `context` (STRING): e.g., 'CERTIFICATE_ISSUANCE'.
- `criteria_json` (JSON): Logic for when this applies (e.g., `{ vessel_type: "TANKER" }`).
- `steps_json` (JSON): Defined steps (e.g., `[{ role: "TO", order: 1 }]`).
- `priority` (INTEGER): Priority level (Default: 0).
- `is_active` (BOOLEAN): Default: true.
- `created_at` (DATE)
- `updated_at` (DATE)

---

## approval_steps
**Purpose**: Individual steps within an approval process.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `approval_id` (UUID): **Foreign Key** to `approvals`.
- `step_number` (INTEGER): Sequence order.
- `role_required` (STRING): Role needed for this step.
- `approved_by` (UUID): **Foreign Key** to `users`.
- `status` (ENUM): 'PENDING', 'APPROVED', 'REJECTED'. Default: 'PENDING'.
- `remarks` (TEXT): Remarks for this step.
- `action_at` (DATE): Timestamp.

**Relationships**:
- **Belongs To**: `approvals` (via `approval_id`).
- **Belongs To**: `users` (via `approved_by`).

---

## audit_logs
**Purpose**: Logs general user actions for security and compliance.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `user_id` (UUID): **Foreign Key** to `users`.
- `action` (STRING): Description of action.
- `entity_name` (STRING): Target entity.
- `entity_id` (STRING): Target entity ID.
- `ip_address` (STRING): User IP.
- `created_at` (DATE): Default: NOW.

**Relationships**:
- **Belongs To**: `users` (via `user_id`).

---

## certificates
**Purpose**: Stores issued certificates.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `vessel_id` (UUID): **Foreign Key** to `vessels`.
- `certificate_type_id` (UUID): **Foreign Key** to `certificate_types`.
- `certificate_number` (STRING): Unique identifier.
- `issue_date` (DATEONLY): Date of issue.
- `expiry_date` (DATEONLY): Expiry date.
- `status` (ENUM): 'VALID', 'EXPIRED', 'SUSPENDED', 'REVOKED'. Default: 'VALID'.
- `qr_code_url` (STRING): Link to QR code image.
- `pdf_file_url` (STRING): Link to PDF.
- `issued_by_user_id` (UUID): **Foreign Key** to `users`.

**Relationships**:
- **Belongs To**: `vessels` (via `vessel_id`).
- **Belongs To**: `certificate_types` (via `certificate_type_id`).
- **Belongs To**: `users` (as `issuer` via `issued_by_user_id`).
- **Has Many**: `certificate_history`.
- **Has Many**: `certificate_alerts`.

---

## certificate_alerts
**Purpose**: Upcoming alerts or warnings for certificates.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `certificate_id` (UUID): **Foreign Key** to `certificates`.
- `alert_type` (ENUM): 'EXPIRY_REMINDER', 'SUSPENSION', 'REVOCATION'.
- `triggered_at` (DATE): Default: NOW.
- `sent_to_role` (STRING): Target role.

**Relationships**:
- **Belongs To**: `certificates` (via `certificate_id`).

---

## certificate_history
**Purpose**: Audit trail of certificate status changes.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `certificate_id` (UUID): **Foreign Key** to `certificates`.
- `status` (ENUM): 'VALID', 'EXPIRED', 'SUSPENDED', 'REVOKED'.
- `changed_by_user_id` (UUID): **Foreign Key** to `users`.
- `change_reason` (TEXT): Reason.
- `changed_at` (DATE): Default: NOW.

**Relationships**:
- **Belongs To**: `certificates`.
- **Belongs To**: `users`.

---

## certificate_types
**Purpose**: Definitions of certificate types.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `name` (STRING): Certificate Name.
- `issuing_authority` (ENUM): 'CLASS', 'FLAG'.
- `validity_years` (INTEGER): Years valid.
- `status` (ENUM): 'ACTIVE', 'INACTIVE'. Default: 'ACTIVE'.
- `description` (TEXT): Description.

---

## clients
**Purpose**: Organizations buying/using the service.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `company_name` (STRING): Name of client.
- `company_code` (STRING): Unique code.
- `address` (TEXT): Physical address.
- `country` (STRING): Country name.
- `email` (STRING): Contact email.
- `phone` (STRING): Contact phone.
- `contact_person_name` (STRING): Contact person.
- `contact_person_email` (STRING): Contact person email.
- `status` (ENUM): 'ACTIVE', 'INACTIVE'. Default: 'ACTIVE'.
- `created_at` (DATE)

**Relationships**:
- **Has Many**: `users` (via `client_id`).
- **Has Many**: `vessels` (via `client_id`).

---

## documents
**Purpose**: Metadata for uploaded files.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `entity_type` (STRING): Type of entity (e.g. 'vessel').
- `entity_id` (UUID): ID of the entity.
- `file_url` (STRING): Cloud storage URL.
- `file_type` (STRING): MIME type/Extension.
- `uploaded_by` (UUID): **Foreign Key** to `users`.
- `uploaded_at` (DATE): Default: NOW.

**Relationships**:
- **Belongs To**: `users` (via `uploaded_by`).
- **Has Many**: `document_versions` (via `document_id`).

---

## document_versions
**Purpose**: Version history for documents.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `document_id` (UUID): **Foreign Key** to `documents`.
- `version_no` (INTEGER): Version number.
- `file_url` (STRING): URL for this version.
- `uploaded_by` (UUID): **Foreign Key** to `users`.
- `uploaded_at` (DATE): Default: NOW.

**Relationships**:
- **Belongs To**: `documents`.
- **Belongs To**: `users`.

---

## email_logs
**Purpose**: Log of sent emails.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `recipient` (STRING): Recipient email.
- `subject` (STRING): Email subject.
- `status` (ENUM): 'SENT', 'FAILED'. Default: 'SENT'.
- `sent_at` (DATE): Default: NOW.

---

## entity_audit_trail
**Purpose**: Detailed change logging for entities.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `entity_type` (STRING): Table/Entity name.
- `entity_id` (UUID): Record ID.
- `action` (ENUM): 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE'.
- `old_value` (JSON): Previous state.
- `new_value` (JSON): New state.
- `changed_by` (UUID): **Foreign Key** to `users`.
- `changed_at` (DATE): Default: NOW.

**Relationships**:
- **Belongs To**: `users` (via `changed_by`).

---

## evidence_locks
**Purpose**: Locks documents for legal hold/integrity.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `document_id` (UUID): **Foreign Key** to `documents`.
- `locked_by` (UUID): **Foreign Key** to `users`.
- `locked_at` (DATE): Default: NOW.
- `reason` (STRING): Reason for locking.
- `integrity_hash` (STRING): SHA256 Hash.
- `legal_hold_id` (UUID): Related legal hold.

**Relationships**:
- **Belongs To**: `documents`.
- **Belongs To**: `users`.

---

## financial_ledgers
**Purpose**: Financial records for transactions, adjustments, etc.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `invoice_id` (UUID): **Foreign Key** to `payments`.
- `job_id` (UUID): **Foreign Key** to `job_requests`.
- `transaction_type` (ENUM): 'CHARGE', 'PAYMENT', 'REFUND', 'ADJUSTMENT', 'WRITEOFF'.
- `amount` (DECIMAL(10,2)): Amount.
- `currency` (STRING): Default 'USD'.
- `reference_id` (STRING): Ext reference.
- `performed_by` (UUID): **Foreign Key** to `users`.
- `remarks` (TEXT): Notes.
- `balance_after` (DECIMAL(10,2)).
- `created_at` (DATE)

**Relationships**:
- **Belongs To**: `payments` (via `invoice_id`).
- **Belongs To**: `job_requests`.
- **Belongs To**: `users`.

---

## flag_administrations
**Purpose**: Flag state authorities.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `flag_name` (STRING): Name (unique).
- `country` (STRING): Country.
- `authority_name` (STRING): Authority Name.
- `contact_email` (STRING): Email.
- `authorization_scope` (TEXT): Scope info.
- `status` (ENUM): 'ACTIVE', 'INACTIVE'. Default: 'ACTIVE'.

---

## geo_fencing_rules
**Purpose**: Geographic restrictions/rules for vessels.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `vessel_id` (UUID): **Foreign Key** to `vessels`.
- `radius_meters` (INTEGER): Radius size.
- `active` (BOOLEAN): Default: true.

**Relationships**:
- **Belongs To**: `vessels`.

---

## gps_tracking
**Purpose**: GPS position logs.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `surveyor_id` (UUID): **Foreign Key** to `users`.
- `vessel_id` (UUID): **Foreign Key** to `vessels`.
- `latitude` (DECIMAL(10,8)): Lat.
- `longitude` (DECIMAL(11,8)): Long.
- `timestamp` (DATE): Default: NOW.

**Relationships**:
- **Belongs To**: `users` (as surveyor).
- **Belongs To**: `vessels`.

---

## job_requests
**Purpose**: Core entity for survey/inspection jobs.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `vessel_id` (UUID): **Foreign Key** to `vessels`.
- `requested_by_user_id` (UUID): **Foreign Key** to `users`.
- `certificate_type_id` (UUID): **Foreign Key** to `certificate_types`.
- `reason` (TEXT): Reason for job.
- `target_port` (STRING): Location.
- `target_date` (DATEONLY): Planned date.
- `job_status` (ENUM): 'CREATED', 'GM_APPROVED', 'TM_PRE_APPROVED', 'ASSIGNED', 'SURVEY_DONE', 'TO_APPROVED', 'TM_FINAL', 'PAYMENT_DONE', 'CERTIFIED', 'REJECTED'. Default: 'CREATED'.
- `gm_assigned_surveyor_id` (UUID): **Foreign Key** to `users`.
- `remarks` (TEXT): Notes.
- `created_at` (DATE)

**Relationships**:
- **Belongs To**: `vessels`.
- **Belongs To**: `users` (as `requester`).
- **Belongs To**: `users` (as `surveyor`).
- **Belongs To**: `certificate_types`.
- **Has Many**: `job_status_history`.
- **Has One**: `survey_reports`.
- **Has Many**: `activity_plannings`.
- **Has Many**: `non_conformities`.
- **Has Many**: `payments`.

---

## job_sla_logs
**Purpose**: Tracking Service Level Agreement events for jobs.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `job_id` (UUID): **Foreign Key** to `job_requests`.
- `action` (ENUM): 'START', 'PAUSE', 'RESUME', 'OVERRIDE', 'BREACH', 'COMPLETE'.
- `reason` (TEXT): Reason.
- `previous_deadline` (DATE): Old deadline.
- `new_deadline` (DATE): New deadline.
- `performed_by` (UUID): **Foreign Key** to `users`.
- `created_at` (DATE)

**Relationships**:
- **Belongs To**: `job_requests`.
- **Belongs To**: `users`.

---

## job_status_history
**Purpose**: History of status transitions for jobs.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `job_id` (UUID): **Foreign Key** to `job_requests`.
- `old_status` (STRING): Previous status.
- `new_status` (STRING): New status.
- `changed_by` (UUID): **Foreign Key** to `users`.
- `change_reason` (TEXT): Reason.
- `changed_at` (DATE): Default: NOW.

**Relationships**:
- **Belongs To**: `job_requests`.
- **Belongs To**: `users`.

---

## legal_holds
**Purpose**: Legal holds placed on data.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `case_reference` (STRING): Case ID.
- `description` (TEXT): Description.
- `reason` (TEXT): Reason.
- `initiated_by` (UUID): **Foreign Key** to `users`.
- `status` (ENUM): 'ACTIVE', 'RELEASED'. Default: 'ACTIVE'.
- `start_date` (DATE): Default: NOW.
- `end_date` (DATE).
- `scope` (JSON): Target entities.
- `created_at` (DATE)
- `updated_at` (DATE)

**Relationships**:
- **Belongs To**: `users` (as `initiator`).

---

## login_attempts
**Purpose**: Log of login success/failures.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `user_id` (UUID): **Foreign Key** to `users`.
- `ip_address` (STRING): IP.
- `success` (BOOLEAN): Status.
- `attempted_at` (DATE): Default: NOW.

**Relationships**:
- **Belongs To**: `users`.

---

## non_conformities
**Purpose**: Issues found during surveys.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `job_id` (UUID): **Foreign Key** to `job_requests`.
- `description` (TEXT): Issue description.
- `severity` (ENUM): 'MINOR', 'MAJOR', 'CRITICAL'.
- `status` (ENUM): 'OPEN', 'CLOSED'. Default: 'OPEN'.
- `closure_remarks` (TEXT): Notes.
- `closed_at` (DATE).

**Relationships**:
- **Belongs To**: `job_requests`.

---

## notifications
**Purpose**: User notifications.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `user_id` (UUID): **Foreign Key** to `users`.
- `title` (STRING): Title.
- `message` (TEXT): Body.
- `type` (ENUM): 'INFO', 'WARNING', 'CRITICAL'.
- `is_read` (BOOLEAN): Default: false.
- `created_at` (DATE): Default: NOW.

**Relationships**:
- **Belongs To**: `users`.

---

## notification_preferences
**Purpose**: User settings for notifications.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `user_id` (UUID): **Foreign Key** to `users`.
- `email_enabled` (BOOLEAN): Default: true.
- `app_enabled` (BOOLEAN): Default: true.
- `alert_types` (JSON): Array of strings.
- `created_at` (DATE)
- `updated_at` (DATE)

**Relationships**:
- **Belongs To**: `users`.

---

## payments
**Purpose**: Payment records for jobs.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `job_id` (UUID): **Foreign Key** to `job_requests`.
- `invoice_number` (STRING): Invoice ID.
- `amount` (DECIMAL(10,2)): Amount.
- `currency` (STRING): Currency.
- `payment_status` (ENUM): 'UNPAID', 'PAID', 'ON_HOLD'. Default: 'UNPAID'.
- `payment_date` (DATE): Date paid.
- `receipt_url` (STRING): Receipt file.
- `verified_by_user_id` (UUID): **Foreign Key** to `users`.

**Relationships**:
- **Belongs To**: `job_requests` (via `job_id`).
- **Belongs To**: `users` (verifier).
- **Has Many**: `payment_transactions`.

---

## payment_transactions
**Purpose**: Transaction attempts.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `payment_id` (UUID): **Foreign Key** to `payments`.
- `gateway` (STRING): Gateway name.
- `transaction_ref` (STRING): Ref ID.
- `status` (ENUM): 'INITIATED', 'SUCCESS', 'FAILED'.
- `processed_at` (DATE): Default: NOW.

**Relationships**:
- **Belongs To**: `payments`.

---

## permissions
**Purpose**: Defines system capabilities.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `permission_name` (STRING): Unique name.
- `description` (TEXT): Description.

**Relationships**:
- **Belongs To Many**: `roles` (via `role_permissions`).

---

## retention_rules
**Purpose**: Data retention policies.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `entity_type` (STRING): e.g. 'SURVEY_PHOTOS'.
- `retain_years` (INTEGER): Years to keep.
- `action` (ENUM): 'PURGE', 'ARCHIVE'.
- `description` (TEXT): Notes.
- `created_at` (DATE)
- `updated_at` (DATE)

---

## roles
**Purpose**: User roles.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `role_name` (STRING): Unique name.
- `description` (TEXT): Description.

**Relationships**:
- **Belongs To Many**: `permissions` (via `role_permissions`).

---

## role_permissions
**Purpose**: Link table for Roles <> Permissions.

**Columns**:
- `role_id` (UUID): **Primary and Foreign Key**.
- `permission_id` (UUID): **Primary and Foreign Key**.

---

## scheduled_tasks
**Purpose**: Background tasks.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `task_type` (STRING): e.g. 'REPORT_GENERATION'.
- `related_entity` (STRING): Entity name.
- `related_id` (UUID): Entity ID.
- `scheduled_for` (DATE): Execution time.
- `status` (ENUM): 'PENDING', 'COMPLETED', 'FAILED'.

---

## sla_rules
**Purpose**: SLA configurations.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `service_type` (STRING): e.g. 'HULL_SURVEY'.
- `priority` (ENUM): 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'.
- `response_time_hours` (INTEGER): Hours.
- `resolution_time_hours` (INTEGER): Hours.
- `escalation_policy` (JSON): Policy config.
- `is_active` (BOOLEAN): Default: true.
- `created_at` (DATE)
- `updated_at` (DATE)

---

## survey_reports
**Purpose**: Survey findings.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `job_id` (UUID): **Foreign Key** to `job_requests`.
- `surveyor_id` (UUID): **Foreign Key** to `users`.
- `survey_date` (DATE): Date.
- `gps_latitude` (DECIMAL(10,8)): Lat.
- `gps_longitude` (DECIMAL(11,8)): Long.
- `attendance_photo_url` (STRING): URL.
- `survey_statement` (TEXT): Report content.
- `created_at` (DATE)
- `updated_at` (DATE)

**Relationships**:
- **Belongs To**: `job_requests`.
- **Belongs To**: `users`.

---

## surveyor_applications
**Purpose**: New surveyor applications.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `full_name` (STRING): Name.
- `email` (STRING): Email.
- `phone` (STRING): Phone.
- `nationality` (STRING): Country.
- `qualification` (STRING): Credentials.
- `years_of_experience` (INTEGER): Experience details.
- `cv_file_url` (STRING): CV URL.
- `certificate_files_url` (JSON): Cert URLs.
- `id_proof_url` (STRING): ID URL.
- `status` (ENUM): 'PENDING', 'DOCUMENTS_REQUIRED', 'APPROVED', 'REJECTED'.
- `tm_remarks` (TEXT): Manager notes.

---

## surveyor_profiles
**Purpose**: Surveyor details.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `user_id` (UUID): **Foreign Key** to `users`.
- `license_number` (STRING): Lic No.
- `authorized_ship_types` (JSON): Ship types.
- `authorized_certificates` (JSON): Cert types.
- `valid_from` (DATEONLY): Start date.
- `valid_to` (DATEONLY): End date.
- `status` (ENUM): 'ACTIVE', 'INACTIVE', 'SUSPENDED'.

**Relationships**:
- **Belongs To**: `users`.

---

## system_settings
**Purpose**: Global settings.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `setting_key` (STRING): key.
- `setting_value` (TEXT): value.
- `updated_by` (UUID): **Foreign Key** to `users`.
- `updated_at` (DATE): Default: NOW.

**Relationships**:
- **Belongs To**: `users`.

---

## tocas
**Purpose**: Transfer of Class Agreements.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `vessel_id` (UUID): **Foreign Key** to `vessels`.
- `losing_class_society` (STRING): Name.
- `gaining_class_society` (STRING): Name.
- `request_date` (DATEONLY): Date.
- `status` (ENUM): 'PENDING', 'ACCEPTED', 'REJECTED'.
- `documents_url` (JSON): URLs.
- `decision_date` (DATEONLY): Date.

**Relationships**:
- **Belongs To**: `vessels`.

---

## users
**Purpose**: Core user table.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `name` (STRING): Name.
- `email` (STRING): Email (Unique).
- `password_hash` (STRING): Pwd.
- `role` (ENUM): 'ADMIN', 'GM', 'TM', 'TO', 'TA', 'SURVEYOR', 'CLIENT', 'FLAG_ADMIN'.
- `phone` (STRING): Phone.
- `status` (ENUM): 'ACTIVE', 'INACTIVE', 'SUSPENDED'.
- `client_id` (UUID): **Foreign Key** to `clients`.
- `force_password_reset` (BOOLEAN): Default: false.
- `last_login_at` (DATE).
- `created_at` (DATE)
- `updated_at` (DATE)

**Relationships**:
- **Belongs To**: `clients`.
- **Has One**: `surveyor_profiles`.
- **Has Many**: `login_attempts`.

---

## user_sessions
**Purpose**: Active user sessions/tokens.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `user_id` (UUID): **Foreign Key** to `users`.
- `token_hash` (STRING): Refresh token hash.
- `device_fingerprint` (STRING): Device ID.
- `ip_address` (STRING): IP.
- `user_agent` (TEXT): Browser.
- `location` (STRING): Geo.
- `last_active_at` (DATE).
- `expires_at` (DATE).
- `is_revoked` (BOOLEAN): Default: false.
- `revoked_at` (DATE).
- `revoked_reason` (STRING).
- `created_at` (DATE)

**Relationships**:
- **Belongs To**: `users`.

---

## vessels
**Purpose**: Ships/Vessels data.

**Columns**:
- `id` (UUID): **Primary Key**, Default: UUIDV7.
- `client_id` (UUID): **Foreign Key** to `clients`.
- `vessel_name` (STRING): Name.
- `imo_number` (STRING): Unique.
- `call_sign` (STRING): Call sign.
- `mmsi_number` (STRING): MMSI.
- `flag_state` (STRING): Country.
- `port_of_registry` (STRING): Port.
- `year_built` (INTEGER): Year.
- `ship_type` (STRING): Type.
- `gross_tonnage` (FLOAT): GT.
- `net_tonnage` (FLOAT): NT.
- `deadweight` (FLOAT): DWT.
- `class_status` (ENUM): 'ACTIVE', 'SUSPENDED', 'WITHDRAWN'.
- `current_class_society` (STRING): Society.
- `engine_type` (STRING): Engine.
- `builder_name` (STRING): Builder.
- `created_at` (DATE)
- `updated_at` (DATE)

**Relationships**:
- **Belongs To**: `clients` (via `client_id`).
- **Has Many**: `job_requests`.
- **Has Many**: `certificates`.
- **Has Many**: `gps_tracking`.
- **Has Many**: `geo_fencing_rules`.
