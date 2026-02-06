
users[icon: user, color: blue] {
  id UUID PK
  name VARCHAR
  email VARCHAR UNIQUE
  password_hash VARCHAR
  role ENUM(ADMIN, GM, TM, TO, TA, SURVEYOR, CLIENT, FLAG_ADMIN)
  phone VARCHAR
  status ENUM(ACTIVE, INACTIVE, SUSPENDED)
  client_id UUID
  force_password_reset BOOLEAN
  last_login_at DATETIME
  created_at DATETIME
  updated_at DATETIME
}

clients[icon: building, color: teal] {
  id UUID PK
  company_name VARCHAR
  company_code VARCHAR UNIQUE
  address TEXT
  country VARCHAR
  email VARCHAR
  phone VARCHAR
  contact_person_name VARCHAR
  contact_person_email VARCHAR
  status ENUM(ACTIVE, INACTIVE)
  created_at DATETIME
  updated_at DATETIME
}

vessels[icon: ship, color: navy] {
  id UUID PK
  client_id UUID
  vessel_name VARCHAR
  imo_number VARCHAR UNIQUE
  call_sign VARCHAR
  mmsi_number VARCHAR
  flag_state VARCHAR
  port_of_registry VARCHAR
  year_built INT
  ship_type VARCHAR
  gross_tonnage FLOAT
  net_tonnage FLOAT
  deadweight FLOAT
  class_status ENUM(ACTIVE, SUSPENDED, WITHDRAWN)
  current_class_society VARCHAR
  engine_type VARCHAR
  builder_name VARCHAR
  created_at DATETIME
  updated_at DATETIME
}

roles[icon: shield, color: red] {
  id UUID PK
  role_name VARCHAR UNIQUE
  description TEXT
}

permissions[icon: lock, color: red] {
  id UUID PK
  permission_name VARCHAR UNIQUE
  description TEXT
}

role_permissions[icon: key, color: red] {
  role_id UUID
  permission_id UUID
}

abac_policies[icon: shield, color: darkred] {
  id UUID PK
  name VARCHAR UNIQUE
  resource VARCHAR
  condition_script TEXT
  effect ENUM(ALLOW, DENY)
  description TEXT
  is_active BOOLEAN
  created_at DATETIME
  updated_at DATETIME
}

job_requests[icon: clipboard, color: orange] {
  id UUID PK
  vessel_id UUID
  requested_by_user_id UUID
  certificate_type_id UUID
  reason TEXT
  target_port VARCHAR
  target_date DATE
  job_status ENUM(CREATED, GM_APPROVED, TM_PRE_APPROVED, ASSIGNED, SURVEY_DONE, TO_APPROVED, TM_FINAL, PAYMENT_DONE, CERTIFIED, REJECTED)
  gm_assigned_surveyor_id UUID
  remarks TEXT
  created_at DATETIME
  updated_at DATETIME
}

job_status_history[icon: refresh-ccw, color: orange] {
  id UUID PK
  job_id UUID
  old_status VARCHAR
  new_status VARCHAR
  changed_by UUID
  change_reason TEXT
  changed_at DATETIME
}

job_sla_logs[icon: clock, color: orange] {
  id UUID PK
  job_id UUID
  action ENUM(START, PAUSE, RESUME, OVERRIDE, BREACH, COMPLETE)
  reason TEXT
  previous_deadline DATETIME
  new_deadline DATETIME
  performed_by UUID
  created_at DATETIME
}

approvals[icon: check-circle, color: green] {
  id UUID PK
  entity_type VARCHAR
  entity_id UUID
  approved_by UUID
  role VARCHAR
  status ENUM(PENDING, APPROVED, REJECTED)
  remarks TEXT
  approved_at DATETIME
}

approval_steps[icon: git-branch, color: green] {
  id UUID PK
  approval_id UUID
  step_number INT
  role_required VARCHAR
  approved_by UUID
  status ENUM(PENDING, APPROVED, REJECTED)
  remarks TEXT
  action_at DATETIME
}

approval_matrix[icon: grid, color: green] {
  id UUID PK
  context VARCHAR
  criteria_json JSON
  steps_json JSON
  priority INT
  is_active BOOLEAN
  created_at DATETIME
  updated_at DATETIME
}

survey_reports[icon: file-text, color: purple] {
  id UUID PK
  job_id UUID
  surveyor_id UUID
  survey_date DATETIME
  gps_latitude DECIMAL
  gps_longitude DECIMAL
  attendance_photo_url VARCHAR
  survey_statement TEXT
  created_at DATETIME
  updated_at DATETIME
}

activity_plannings[icon: list, color: purple] {
  id UUID PK
  job_id UUID
  question_code VARCHAR
  question_text VARCHAR
  answer ENUM(YES, NO, NA)
  remarks TEXT
}

non_conformities[icon: alert-triangle, color: red] {
  id UUID PK
  job_id UUID
  description TEXT
  severity ENUM(MINOR, MAJOR, CRITICAL)
  status ENUM(OPEN, CLOSED)
  closure_remarks TEXT
  closed_at DATETIME
}

gps_tracking[icon: map-pin, color: blue] {
  id UUID PK
  surveyor_id UUID
  vessel_id UUID
  latitude DECIMAL
  longitude DECIMAL
  timestamp DATETIME
}

geo_fencing_rules[icon: target, color: blue] {
  id UUID PK
  vessel_id UUID
  radius_meters INT
  active BOOLEAN
}

certificate_types[icon: file, color: green] {
  id UUID PK
  name VARCHAR
  issuing_authority ENUM(CLASS, FLAG)
  validity_years INT
  status ENUM(ACTIVE, INACTIVE)
  description TEXT
}

certificates[icon: award, color: green] {
  id UUID PK
  vessel_id UUID
  certificate_type_id UUID
  certificate_number VARCHAR UNIQUE
  issue_date DATE
  expiry_date DATE
  status ENUM(VALID, EXPIRED, SUSPENDED, REVOKED)
  qr_code_url VARCHAR
  pdf_file_url VARCHAR
  issued_by_user_id UUID
}

certificate_history[icon: clock, color: purple] {
  id UUID PK
  certificate_id UUID
  status ENUM(VALID, EXPIRED, SUSPENDED, REVOKED)
  changed_by_user_id UUID
  change_reason TEXT
  changed_at DATETIME
}

certificate_alerts[icon: alert-octagon, color: red] {
  id UUID PK
  certificate_id UUID
  alert_type ENUM(EXPIRY_REMINDER, SUSPENSION, REVOCATION)
  triggered_at DATETIME
  sent_to_role VARCHAR
}

flag_administrations[icon: flag, color: cyan] {
  id UUID PK
  flag_name VARCHAR UNIQUE
  country VARCHAR
  authority_name VARCHAR
  contact_email VARCHAR
  authorization_scope TEXT
  status ENUM(ACTIVE, INACTIVE)
}

tocas[icon: repeat, color: brown] {
  id UUID PK
  vessel_id UUID
  losing_class_society VARCHAR
  gaining_class_society VARCHAR
  request_date DATE
  status ENUM(PENDING, ACCEPTED, REJECTED)
  documents_url JSON
  decision_date DATE
}

payments[icon: credit-card, color: yellow] {
  id UUID PK
  job_id UUID
  invoice_number VARCHAR
  amount DECIMAL
  currency VARCHAR
  payment_status ENUM(UNPAID, PAID, ON_HOLD)
  payment_date DATETIME
  receipt_url VARCHAR
  verified_by_user_id UUID
}

payment_transactions[icon: dollar-sign, color: yellow] {
  id UUID PK
  payment_id UUID
  gateway VARCHAR
  transaction_ref VARCHAR
  status ENUM(INITIATED, SUCCESS, FAILED)
  processed_at DATETIME
}

financial_ledgers[icon: book, color: yellow] {
  id UUID PK
  invoice_id UUID
  job_id UUID
  transaction_type ENUM(CHARGE, PAYMENT, REFUND, ADJUSTMENT, WRITEOFF)
  amount DECIMAL
  currency VARCHAR
  reference_id VARCHAR
  performed_by UUID
  remarks TEXT
  balance_after DECIMAL
  created_at DATETIME
}

surveyor_applications[icon: user-plus, color: purple] {
  id UUID PK
  full_name VARCHAR
  email VARCHAR
  phone VARCHAR
  nationality VARCHAR
  qualification VARCHAR
  years_of_experience INT
  cv_file_url VARCHAR
  certificate_files_url JSON
  id_proof_url VARCHAR
  status ENUM(PENDING, DOCUMENTS_REQUIRED, APPROVED, REJECTED)
  tm_remarks TEXT
}

surveyor_profiles[icon: id-card, color: purple] {
  id UUID PK
  user_id UUID
  license_number VARCHAR
  authorized_ship_types JSON
  authorized_certificates JSON
  valid_from DATE
  valid_to DATE
  status ENUM(ACTIVE, INACTIVE, SUSPENDED)
}

documents[icon: paperclip, color: gray] {
  id UUID PK
  entity_type VARCHAR
  entity_id UUID
  file_url VARCHAR
  file_type VARCHAR
  uploaded_by UUID
  uploaded_at DATETIME
}

document_versions[icon: copy, color: gray] {
  id UUID PK
  document_id UUID
  version_no INT
  file_url VARCHAR
  uploaded_by UUID
  uploaded_at DATETIME
}

evidence_locks[icon: lock, color: gray] {
  id UUID PK
  document_id UUID
  locked_by UUID
  locked_at DATETIME
  reason VARCHAR
  integrity_hash VARCHAR
  legal_hold_id UUID
}

legal_holds[icon: briefcase, color: black] {
  id UUID PK
  case_reference VARCHAR
  description TEXT
  reason TEXT
  initiated_by UUID
  status ENUM(ACTIVE, RELEASED)
  start_date DATETIME
  end_date DATETIME
  scope JSON
  created_at DATETIME
  updated_at DATETIME
}

notifications[icon: bell, color: orange] {
  id UUID PK
  user_id UUID
  title VARCHAR
  message TEXT
  type ENUM(INFO, WARNING, CRITICAL)
  is_read BOOLEAN
  created_at DATETIME
}

notification_preferences[icon: sliders, color: orange] {
  id UUID PK
  user_id UUID
  email_enabled BOOLEAN
  app_enabled BOOLEAN
  alert_types JSON
  created_at DATETIME
  updated_at DATETIME
}

email_logs[icon: mail, color: green] {
  id UUID PK
  recipient VARCHAR
  subject VARCHAR
  status ENUM(SENT, FAILED)
  sent_at DATETIME
}

audit_logs[icon: activity, color: black] {
  id UUID PK
  user_id UUID
  action VARCHAR
  entity_name VARCHAR
  entity_id VARCHAR
  ip_address VARCHAR
  created_at DATETIME
}

entity_audit_trail[icon: layers, color: black] {
  id UUID PK
  entity_type VARCHAR
  entity_id UUID
  action ENUM(CREATE, UPDATE, DELETE, STATUS_CHANGE)
  old_value JSON
  new_value JSON
  changed_by UUID
  changed_at DATETIME
}

login_attempts[icon: alert-circle, color: orange] {
  id UUID PK
  user_id UUID
  ip_address VARCHAR
  success BOOLEAN
  attempted_at DATETIME
}

user_sessions[icon: monitor, color: blue] {
  id UUID PK
  user_id UUID
  token_hash VARCHAR
  device_fingerprint VARCHAR
  ip_address VARCHAR
  user_agent TEXT
  location VARCHAR
  last_active_at DATETIME
  expires_at DATETIME
  is_revoked BOOLEAN
  revoked_at DATETIME
  revoked_reason VARCHAR
  created_at DATETIME
}

api_rate_limits[icon: activity, color: orange] {
  id UUID PK
  ip_address VARCHAR
  endpoint VARCHAR
  request_count INT
  last_request_at DATETIME
}

scheduled_tasks[icon: clock, color: orange] {
  id UUID PK
  task_type VARCHAR
  related_entity VARCHAR
  related_id UUID
  scheduled_for DATETIME
  status ENUM(PENDING, COMPLETED, FAILED)
}

system_settings[icon: settings, color: black] {
  id UUID PK
  setting_key VARCHAR UNIQUE
  setting_value TEXT
  updated_by UUID
  updated_at DATETIME
}

ai_model_versions[icon: cpu, color: purple] {
  id UUID PK
  model_name VARCHAR
  version VARCHAR
  description TEXT
  metrics_json JSON
  is_active BOOLEAN
  trained_at DATETIME
  trained_by UUID
  created_at DATETIME
  updated_at DATETIME
}

retention_rules[icon: archive, color: gray] {
  id UUID PK
  entity_type VARCHAR UNIQUE
  retain_years INT
  action ENUM(PURGE, ARCHIVE)
  description TEXT
  created_at DATETIME
  updated_at DATETIME
}

sla_rules[icon: watch, color: red] {
  id UUID PK
  service_type VARCHAR
  priority ENUM(LOW, MEDIUM, HIGH, CRITICAL)
  response_time_hours INT
  resolution_time_hours INT
  escalation_policy JSON
  is_active BOOLEAN
  created_at DATETIME
  updated_at DATETIME
}



activity_requests[icon: file-text, color: orange] {
  id UUID PK
  request_number VARCHAR UNIQUE
  requested_by UUID
  vessel_id UUID
  activity_type ENUM(INSPECTION, AUDIT, TRAINING, VISIT, OTHER)
  requested_service VARCHAR
  priority ENUM(LOW, MEDIUM, HIGH, URGENT)
  description TEXT
  location_port VARCHAR
  proposed_date DATE
  status ENUM(PENDING, APPROVED, REJECTED, CONVERTED_TO_JOB, DRAFT)
  linked_job_id UUID
  rejection_reason VARCHAR
  attachments JSON
  created_at DATETIME
  updated_at DATETIME
}

checklist_templates[icon: list, color: blue] {
  id UUID PK
  name VARCHAR
  code VARCHAR UNIQUE
  description TEXT
  sections JSON
  status ENUM(ACTIVE, INACTIVE, DRAFT)
  metadata JSON
  created_by UUID
  updated_by UUID
  created_at DATETIME
  updated_at DATETIME
}

service_providers[icon: truck, color: cyan] {
  id UUID PK
  company_name VARCHAR
  service_type ENUM(DRY_DOCK, LAB, LOGISTICS, CRANE, OTHER)
  contact_person VARCHAR
  email VARCHAR
  phone VARCHAR
  status ENUM(PENDING, APPROVED, SUSPENDED, BLACKLISTED)
  rating FLOAT
  legal_hold_status BOOLEAN
  created_at DATETIME
  updated_at DATETIME
}

provider_evaluations[icon: check-square, color: cyan] {
  id UUID PK
  provider_id UUID
  job_id UUID
  evaluated_by UUID
  punctuality_score FLOAT
  quality_score FLOAT
  documentation_score FLOAT
  compliance_score FLOAT
  average_rating FLOAT
  remarks TEXT
  result ENUM(PASS, FAIL, CONDITIONAL)
  created_at DATETIME
}

customer_feedbacks[icon: star, color: yellow] {
  id UUID PK
  job_id UUID
  client_id UUID
  rating INT
  timeliness INT
  professionalism INT
  documentation INT
  remarks TEXT
  submitted_at DATETIME
}

// Relationships
entity_audit_trail.changed_by > users.id
job_status_history.job_id > job_requests.id
job_status_history.changed_by > users.id

approval_steps.approval_id > approvals.id
approval_steps.approved_by > users.id
approvals.approved_by > users.id

geo_fencing_rules.vessel_id > vessels.id

certificate_alerts.certificate_id > certificates.id

document_versions.document_id > documents.id
document_versions.uploaded_by > users.id
documents.uploaded_by > users.id

system_settings.updated_by > users.id

payment_transactions.payment_id > payments.id

users.client_id > clients.id
vessels.client_id > clients.id

job_requests.vessel_id > vessels.id
job_requests.requested_by_user_id > users.id
job_requests.gm_assigned_surveyor_id > users.id
job_requests.certificate_type_id > certificate_types.id

survey_reports.job_id > job_requests.id
survey_reports.surveyor_id > users.id

activity_plannings.job_id > job_requests.id
non_conformities.job_id > job_requests.id

certificates.vessel_id > vessels.id
certificates.certificate_type_id > certificate_types.id
certificates.issued_by_user_id > users.id

certificate_history.certificate_id > certificates.id
certificate_history.changed_by_user_id > users.id

tocas.vessel_id > vessels.id

payments.job_id > job_requests.id
payments.verified_by_user_id > users.id

surveyor_profiles.user_id > users.id

notifications.user_id > users.id
notification_preferences.user_id > users.id

audit_logs.user_id > users.id
login_attempts.user_id > users.id
user_sessions.user_id > users.id

gps_tracking.vessel_id > vessels.id
gps_tracking.surveyor_id > users.id

role_permissions.role_id > roles.id
role_permissions.permission_id > permissions.id

job_sla_logs.job_id > job_requests.id
job_sla_logs.performed_by > users.id

financial_ledgers.invoice_id > payments.id
financial_ledgers.job_id > job_requests.id
financial_ledgers.performed_by > users.id

legal_holds.initiated_by > users.id
evidence_locks.document_id > documents.id
evidence_locks.locked_by > users.id
evidence_locks.legal_hold_id > legal_holds.id

activity_requests.requested_by > users.id
activity_requests.vessel_id > vessels.id
activity_requests.linked_job_id > job_requests.id

checklist_templates.created_by > users.id
checklist_templates.updated_by > users.id

provider_evaluations.provider_id > service_providers.id
provider_evaluations.job_id > job_requests.id
provider_evaluations.evaluated_by > users.id

customer_feedbacks.job_id > job_requests.id
customer_feedbacks.client_id > users.id