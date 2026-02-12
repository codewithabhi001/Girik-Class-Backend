/**
 * Generates a single OpenAPI 3 spec where:
 * 1. You choose a role first (sections are ordered by role).
 * 2. Under each role, APIs are grouped in folders/headings by module (Users, Clients, Vessels, Jobs, etc.).
 *
 * Tag format: "Role » Module" (e.g. "Admin » Users", "Client » Jobs").
 * Run: node scripts/generate-swagger-by-role.js
 * Output: src/docs/swagger-by-role.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ROLES_ORDER = ['Admin', 'GM', 'TM', 'TO', 'TA', 'Surveyor', 'Client', 'Flag Admin'];

function getModuleName(pathStr) {
  const seg = pathStr.split('/').filter(Boolean)[0] || '';
  const map = {
    users: 'Users',
    system: 'System',
    health: 'Health & Readiness',
    flags: 'Flags',
    clients: 'Clients',
    vessels: 'Vessels',
    jobs: 'Jobs',
    surveys: 'Surveys',
    certificates: 'Certificates',
    payments: 'Payments',
    documents: 'Documents',
    reports: 'Reports',
    'change-requests': 'Change Requests',
    'certificate-templates': 'Certificate Templates',
    incidents: 'Incidents',
    'activity-requests': 'Activity Requests',
    notifications: 'Notifications',
    providers: 'Providers',
    'customer-feedback': 'Customer Feedback',
    approvals: 'Approvals',
    toca: 'TOCA',
    'non-conformities': 'Non-Conformities',
    surveyors: 'Surveyors',
    mobile: 'Mobile',
    client: 'Client Portal',
    dashboard: 'Dashboard',
    auth: 'Authentication',
    public: 'Public',
    surveyorsApply: 'Public',
    support: 'Support',
    search: 'Search',
    compliance: 'Compliance',
  };
  if (pathStr.startsWith('/health')) return 'Health & Readiness';
  if (pathStr.startsWith('/public') || pathStr.startsWith('/surveyors/apply')) return 'Public';
  if (pathStr.startsWith('/auth')) return 'Authentication';
  return map[seg] || 'Other';
}

/** Express path to OpenAPI path */
function toOpenApiPath(p) {
  return p
    .replace(/:id\b/g, '{id}')
    .replace(/:jobId\b/g, '{jobId}')
    .replace(/:job_id\b/g, '{jobId}')
    .replace(/:entity\b/g, '{entity}')
    .replace(/:action\b/g, '{action}')
    .replace(/:imo\b/g, '{imo}')
    .replace(/:number\b/g, '{number}')
    .replace(/:token\b/g, '{token}');
}

/** Path params from OpenAPI path string */
function getPathParams(openPath) {
  const params = [];
  const re = /\{(\w+)\}/g;
  let m;
  while ((m = re.exec(openPath)) !== null) params.push({ name: m[1], in: 'path', required: true, schema: { type: 'string' }, description: m[1] });
  return params;
}

/** Request body schema + example keyed by method + path pattern */
const BODIES = {
  'POST /auth/login': {
    schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', example: 'admin@girik.com' }, password: { type: 'string', example: 'admin123' } } },
    example: { email: 'admin@girik.com', password: 'admin123' },
  },
  'POST /auth/refresh-token': { schema: { type: 'object', required: ['token'], properties: { token: { type: 'string' } } }, example: { token: '{{refresh_token}}' } },
  'POST /auth/forgot-password': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', example: 'admin@gmail.com' } } }, example: { email: 'admin@gmail.com' } },
  'POST /auth/reset-password': { schema: { type: 'object', required: ['token', 'newPassword'], properties: { token: { type: 'string' }, newPassword: { type: 'string' } } }, example: { token: 'RESET_TOKEN_FROM_EMAIL', newPassword: 'NewSecurePass123!' } },
  'POST /users': { schema: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' }, password: { type: 'string' }, role: { type: 'string', enum: ['ADMIN', 'GM', 'TM', 'TO', 'TA', 'SURVEYOR', 'CLIENT', 'FLAG_ADMIN'] }, phone: { type: 'string' }, client_id: { type: 'string' } } }, example: { name: 'Full Name', email: 'user@girik.com', password: 'Password123!', role: 'TM', phone: '+919876543210', client_id: '{{client_id}}' } },
  'PUT /users/:id': { schema: { type: 'object', properties: { name: { type: 'string' }, phone: { type: 'string' } } }, example: { name: 'Updated Name', phone: '+919876543211' } },
  'PUT /users/:id/status': { schema: { type: 'object', properties: { status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED'] } } }, example: { status: 'SUSPENDED' } },
  'POST /clients': { schema: { type: 'object', properties: { company_name: { type: 'string' }, company_code: { type: 'string' }, email: { type: 'string' }, address: { type: 'string' }, country: { type: 'string' }, phone: { type: 'string' }, contact_person_name: { type: 'string' }, contact_person_email: { type: 'string' }, status: { type: 'string' }, user: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' }, password: { type: 'string' }, role: { type: 'string' }, phone: { type: 'string' } } } } }, example: { company_name: 'Acme Shipping Ltd', company_code: 'ACME-01', email: 'contact@acme.com', address: '123 Harbour Road', country: 'Singapore', phone: '+65 6123 4567', contact_person_name: 'John Doe', contact_person_email: 'john@acme.com', status: 'ACTIVE' } },
  'PUT /clients/:id': { schema: { type: 'object', properties: { company_name: { type: 'string' }, address: { type: 'string' }, country: { type: 'string' }, phone: { type: 'string' }, contact_person_name: { type: 'string' }, contact_person_email: { type: 'string' } } }, example: { company_name: 'Acme Shipping Ltd', address: '456 New Harbour Rd', country: 'Singapore', phone: '+65 6123 4599', contact_person_name: 'Jane Doe', contact_person_email: 'jane@acme.com' } },
  'POST /vessels': { schema: { type: 'object', properties: { vessel_name: { type: 'string' }, imo_number: { type: 'string' }, client_id: { type: 'string' }, flag_state: { type: 'string' }, ship_type: { type: 'string' }, call_sign: { type: 'string' }, year_built: { type: 'integer' }, gross_tonnage: { type: 'number' }, net_tonnage: { type: 'number' } } }, example: { vessel_name: 'SEA MAJESTY', imo_number: 'IMO9876543', client_id: '{{client_id}}', flag_state: 'Panama', ship_type: 'Cargo', call_sign: 'HPAB', year_built: 2015, gross_tonnage: 25000, net_tonnage: 12000 } },
  'PUT /vessels/:id': { schema: { type: 'object', properties: { vessel_name: { type: 'string' }, flag_state: { type: 'string' }, phone: { type: 'string' } } }, example: { vessel_name: 'SEA MAJESTY II', flag_state: 'Liberia', phone: '+1 234 567 8900' } },
  'POST /jobs': { schema: { type: 'object', required: ['vessel_id', 'certificate_type_id'], properties: { vessel_id: { type: 'string' }, certificate_type_id: { type: 'string' }, reason: { type: 'string' }, target_port: { type: 'string' }, target_date: { type: 'string', format: 'date' } } }, example: { vessel_id: '{{vessel_id}}', certificate_type_id: '{{certificate_type_id}}', reason: 'Annual survey and class renewal', target_port: 'Port of Singapore', target_date: '2025-12-15' } },
  'PUT /jobs/:id/assign': { schema: { type: 'object', required: ['surveyorId'], properties: { surveyorId: { type: 'string' } } }, example: { surveyorId: '{{surveyor_id}}' } },
  'PUT /jobs/:id/status': { schema: { type: 'object', properties: { status: { type: 'string', enum: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] }, remarks: { type: 'string' } } }, example: { status: 'ASSIGNED', remarks: 'Job assigned to surveyor' } },
  'PUT /jobs/:id/cancel': { schema: { type: 'object', properties: { reason: { type: 'string' } } }, example: { reason: 'Client requested cancellation' } },
  'PUT /jobs/:id/hold': { schema: { type: 'object', properties: { reason: { type: 'string' } } }, example: { reason: 'Awaiting documents' } },
  'PUT /jobs/:id/resume': { schema: { type: 'object', properties: { reason: { type: 'string' } } }, example: { reason: 'Documents received' } },
  'PUT /jobs/:id/reassign': { schema: { type: 'object', properties: { surveyorId: { type: 'string' }, reason: { type: 'string' } } }, example: { surveyorId: '{{surveyor_id}}', reason: 'Original surveyor unavailable' } },
  'PUT /jobs/:id/escalate': { schema: { type: 'object', properties: { reason: { type: 'string' }, target_role: { type: 'string' } } }, example: { reason: 'Urgent client request', target_role: 'GM' } },
  'POST /certificates': { schema: { type: 'object', properties: { job_id: { type: 'string' }, validity_years: { type: 'integer' } } }, example: { job_id: '{{job_id}}', validity_years: 1 } },
  'POST /certificates/:id/sign': { schema: { type: 'object', properties: { reason: { type: 'string' } } }, example: { reason: 'Administrative suspension' } },
  'PUT /certificates/:id/suspend': { schema: { type: 'object', properties: { reason: { type: 'string' } } }, example: { reason: 'Administrative suspension' } },
  'PUT /certificates/:id/revoke': { schema: { type: 'object', properties: { reason: { type: 'string' } } }, example: { reason: 'Administrative suspension' } },
  'PUT /certificates/:id/restore': { schema: { type: 'object', properties: { reason: { type: 'string' } } }, example: { reason: 'Restored' } },
  'PUT /certificates/:id/renew': { schema: { type: 'object', properties: { validity_years: { type: 'integer' }, reason: { type: 'string' } } }, example: { validity_years: 2, reason: 'Standard renewal' } },
  'POST /certificates/:id/reissue': { schema: { type: 'object', properties: { reason: { type: 'string' } } }, example: { reason: 'Reissue' } },
  'POST /certificates/:id/transfer': { schema: { type: 'object', properties: { newOwnerId: { type: 'string' }, reason: { type: 'string' } } }, example: { newOwnerId: '{{vessel_id}}', reason: 'Vessel sold' } },
  'POST /certificates/:id/extend': { schema: { type: 'object', properties: { extensionMonths: { type: 'integer' }, reason: { type: 'string' } } }, example: { extensionMonths: 6, reason: 'Extension granted' } },
  'PUT /certificates/:id/downgrade': { schema: { type: 'object', properties: { newTypeId: { type: 'string' }, reason: { type: 'string' } } }, example: { newTypeId: '{{certificate_type_id}}', reason: 'Downgrade requested' } },
  'POST /payments/invoice': { schema: { type: 'object', properties: { job_id: { type: 'string' }, amount: { type: 'number' }, currency: { type: 'string' } } }, example: { job_id: '{{job_id}}', amount: 3500, currency: 'USD' } },
  'POST /payments/writeoff': { schema: { type: 'object', properties: { paymentId: { type: 'string' }, reason: { type: 'string' } } }, example: { paymentId: '{{payment_id}}', reason: 'Bad debt' } },
  'POST /flags': { schema: { type: 'object', properties: { flag_name: { type: 'string' }, country: { type: 'string' }, authority_name: { type: 'string' }, contact_email: { type: 'string' } } }, example: { flag_name: 'Panama', country: 'Panama', authority_name: 'Panama Maritime Authority', contact_email: 'pma@panama.gob.pa' } },
  'PUT /flags/:id': { schema: { type: 'object', properties: { flag_name: { type: 'string' }, country: { type: 'string' }, authority_name: { type: 'string' }, contact_email: { type: 'string' } } }, example: { flag_name: 'Panama', country: 'Panama', authority_name: 'Panama Maritime Authority (Updated)', contact_email: 'contact@pma.gob.pa' } },
  'POST /certificate-templates': { schema: { type: 'object', properties: { name: { type: 'string' }, code: { type: 'string' }, description: { type: 'string' }, sections: { type: 'array' }, status: { type: 'string' } } }, example: { name: 'Annual Survey Checklist', code: 'ANNUAL-01', description: 'Standard annual survey', status: 'ACTIVE' } },
  'PUT /certificate-templates/:id': { schema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' }, status: { type: 'string' } } }, example: { name: 'Annual Survey Checklist (Revised)', description: 'Updated description', status: 'ACTIVE' } },
  'POST /toca': { schema: { type: 'object', properties: { vessel_id: { type: 'string' }, losing_class_society: { type: 'string' }, gaining_class_society: { type: 'string' }, request_date: { type: 'string' } } }, example: { vessel_id: '{{vessel_id}}', losing_class_society: "Lloyd's Register", gaining_class_society: 'DNV', request_date: '2025-06-01' } },
  'PUT /toca/:id/status': { schema: { type: 'object', properties: { status: { type: 'string' } } }, example: { status: 'ACCEPTED' } },
  'POST /non-conformities': { schema: { type: 'object', properties: { job_id: { type: 'string' }, description: { type: 'string' }, severity: { type: 'string', enum: ['MINOR', 'MAJOR', 'CRITICAL'] } } }, example: { job_id: '{{job_id}}', description: 'Crack found on hull plate', severity: 'MAJOR' } },
  'PUT /non-conformities/:id/close': { schema: { type: 'object', properties: { closure_remarks: { type: 'string' } } }, example: { closure_remarks: 'Repair completed and verified' } },
  'POST /surveys/start': { schema: { type: 'object', properties: { job_id: { type: 'string' }, latitude: { type: 'number' }, longitude: { type: 'number' } } }, example: { job_id: '{{job_id}}', latitude: 1.3521, longitude: 103.8198 } },
  'PUT /jobs/:jobId/checklist': { schema: { type: 'object', properties: { items: { type: 'array', items: { type: 'object', properties: { question_code: { type: 'string' }, answer: { type: 'string' }, remarks: { type: 'string' } } } } } }, example: { items: [{ question_code: 'Q1', answer: 'YES', remarks: 'All OK' }, { question_code: 'Q2', answer: 'NO', remarks: 'Minor defect' }] } },
  'POST /surveys/:id/location': { schema: { type: 'object', properties: { latitude: { type: 'number' }, longitude: { type: 'number' } } }, example: { latitude: 1.3521, longitude: 103.8198 } },
  'POST /surveys/:id/violation': { schema: { type: 'object', properties: { description: { type: 'string' } } }, example: { description: 'Surveyor arrived outside permitted geofence' } },
  'PUT /surveyors/applications/:id/review': { schema: { type: 'object', properties: { status: { type: 'string' }, remarks: { type: 'string' } } }, example: { status: 'APPROVED', remarks: 'Documents verified' } },
  'PUT /surveyors/:id/profile': { schema: { type: 'object', properties: { license_number: { type: 'string' }, status: { type: 'string' } } }, example: { license_number: 'SURV-002', status: 'ACTIVE' } },
  'POST /providers/:id/evaluations': { schema: { type: 'object', properties: { rating: { type: 'number' }, comment: { type: 'string' } } }, example: { rating: 4.5, comment: 'Good quality work' } },
  'POST /change-requests': { schema: { type: 'object', properties: { entity_type: { type: 'string' }, entity_id: { type: 'string' }, change_description: { type: 'string' }, old_value: { type: 'string' }, new_value: { type: 'string' }, priority: { type: 'string' } } }, example: { entity_type: 'VESSEL', entity_id: '{{vessel_id}}', change_description: 'Update vessel flag state', old_value: 'Panama', new_value: 'Liberia', priority: 'MEDIUM' } },
  'PUT /change-requests/:id/approve': { schema: { type: 'object', properties: { remarks: { type: 'string' } } }, example: { remarks: 'Approved after verification' } },
  'PUT /change-requests/:id/reject': { schema: { type: 'object', properties: { remarks: { type: 'string' } } }, example: { remarks: 'Insufficient documentation' } },
  'POST /incidents': { schema: { type: 'object', properties: { incident_type: { type: 'string' }, entity_type: { type: 'string' }, entity_id: { type: 'string' }, description: { type: 'string' }, severity: { type: 'string' } } }, example: { incident_type: 'SAFETY', entity_type: 'JOB', entity_id: '{{job_id}}', description: 'Minor injury during survey', severity: 'LOW' } },
  'PUT /incidents/:id/resolve': { schema: { type: 'object', properties: { resolution: { type: 'string' } } }, example: { resolution: 'Closed. No further action required.' } },
  'PUT /notifications/preferences': { schema: { type: 'object', properties: { email_enabled: { type: 'boolean' }, app_enabled: { type: 'boolean' }, alert_types: { type: 'array', items: { type: 'string' } } } }, example: { email_enabled: true, app_enabled: true, alert_types: ['JOB_ASSIGNED', 'CERTIFICATE_EXPIRY', 'PAYMENT_DUE'] } },
  'POST /approvals': { schema: { type: 'object', properties: { entity_type: { type: 'string' }, entity_id: { type: 'string' }, approval_type: { type: 'string' }, requested_by: { type: 'string' } } }, example: { entity_type: 'CERTIFICATE', entity_id: '{{id}}', approval_type: 'SIGN_OFF', requested_by: '{{target_user_id}}' } },
  'PUT /approvals/:id/step': { schema: { type: 'object', properties: { status: { type: 'string', enum: ['APPROVED', 'REJECTED'] } } }, example: { status: 'APPROVED' } },
  'POST /activity-requests': { schema: { type: 'object', properties: { activity_type: { type: 'string' }, vessel_id: { type: 'string' }, requested_service: { type: 'string' }, priority: { type: 'string' }, description: { type: 'string' }, location_port: { type: 'string' }, proposed_date: { type: 'string' } } }, example: { activity_type: 'INSPECTION', vessel_id: '{{vessel_id}}', requested_service: 'Annual Survey', priority: 'HIGH', description: 'Request for annual survey', location_port: 'Port of Singapore', proposed_date: '2025-08-15' } },
  'POST /activity-requests/:id/reject': { schema: { type: 'object', properties: { reason: { type: 'string' } } }, example: { reason: 'Slot not available' } },
  'POST /customer-feedback': { schema: { type: 'object', properties: { job_id: { type: 'string' }, rating: { type: 'integer' }, comment: { type: 'string' } } }, example: { job_id: '{{job_id}}', rating: 5, comment: 'Excellent service' } },
  'POST /providers': { schema: { type: 'object', properties: { company_name: { type: 'string' }, service_type: { type: 'string' }, contact_person: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' } } }, example: { company_name: 'Marine Services Co', service_type: 'DRY_DOCK', contact_person: 'John Smith', email: 'john@marineservices.com', phone: '+65 6123 4000' } },
  'PUT /providers/:id/status': { schema: { type: 'object', properties: { status: { type: 'string' } } }, example: { status: 'APPROVED' } },
  'POST /mobile/sync': { schema: { type: 'object', properties: { last_sync_timestamp: { type: 'string' }, offline_data: { type: 'object' } } }, example: { last_sync_timestamp: '2025-02-07T10:00:00.000Z', offline_data: {} } },
  'POST /mobile/offline/surveys': { schema: { type: 'object', properties: { surveys: { type: 'array', items: { type: 'object', properties: { job_id: { type: 'string' }, gps_latitude: { type: 'number' }, gps_longitude: { type: 'number' }, survey_statement: { type: 'string' } } } } } }, example: { surveys: [{ job_id: '{{job_id}}', gps_latitude: 1.35, gps_longitude: 103.81, survey_statement: 'Offline survey data' }] } },
  'POST /system/maintenance/:action': { schema: { type: 'object' }, example: {} },
  'POST /notifications/rules': { schema: { type: 'object' }, example: {} },
  'POST /support': {
    schema: { type: 'object', required: ['subject', 'description'], properties: { subject: { type: 'string' }, description: { type: 'string' }, priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] } } },
    example: { subject: 'Cannot login', description: 'I am getting 401 even with correct password', priority: 'HIGH' }
  },
  'PUT /support/:id/status': {
    schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] }, internal_note: { type: 'string' } } },
    example: { status: 'RESOLVED', internal_note: 'User error. Reset password.' }
  },
};

function getRequestBody(method, path) {
  const key = `${method} ${path}`;
  return BODIES[key] || null;
}

/** API entry: [method, path, summary] */
function api(method, path, summary) {
  return { method, path, summary };
}

// ---------- Public (no auth) ----------
const publicApis = [
  api('GET', '/public/certificate/verify/:number', 'Verify Certificate'),
  api('GET', '/public/vessel/:imo', 'Verify Vessel'),
  api('POST', '/surveyors/apply', 'Surveyor Apply (multipart)'),
];

// ---------- Authentication ----------
const authApis = [
  api('POST', '/auth/login', 'Login'),
  api('POST', '/auth/logout', 'Logout'),
  api('POST', '/auth/refresh-token', 'Refresh Token'),
  api('POST', '/auth/forgot-password', 'Forgot Password'),
  api('POST', '/auth/reset-password', 'Reset Password'),
];

// ---------- By role (same as Postman collection) ----------
const adminApis = [
  api('GET', '/users', 'List Users'),
  api('POST', '/users', 'Create User'),
  api('PUT', '/users/:id', 'Update User'),
  api('PUT', '/users/:id/status', 'Update User Status'),
  api('DELETE', '/users/:id', 'Delete User'),
  api('GET', '/system/metrics', 'System Metrics'),
  api('GET', '/system/migrations', 'System Migrations'),
  api('GET', '/system/jobs/failed', 'Failed Jobs'),
  api('POST', '/system/jobs/:id/retry', 'Retry Job'),
  api('POST', '/system/maintenance/:action', 'Maintenance Action'),
  api('POST', '/flags', 'Create Flag'),
  api('PUT', '/flags/:id', 'Update Flag'),
  api('DELETE', '/clients/:id', 'Delete Client'),
  api('POST', '/payments/writeoff', 'Write Off Payment'),
  api('GET', '/notifications/rules', 'Get Notification Rules'),
  api('POST', '/notifications/rules', 'Create Notification Rule'),
  api('POST', '/certificate-templates', 'Create Template'),
  api('GET', '/certificate-templates', 'List Templates'),
  api('GET', '/certificate-templates/:id', 'Get Template'),
  api('PUT', '/certificate-templates/:id', 'Update Template'),
  api('DELETE', '/certificate-templates/:id', 'Delete Template'),
  api('POST', '/compliance/anonymize/:id', 'Anonymize Compliance Data'),
  api('GET', '/compliance/export/:id', 'Export Compliance Data'),
  api('PUT', '/support/:id/status', 'Update Support Ticket Status'),
];

const gmApis = [
  api('POST', '/clients', 'Create Client (with optional user)'),
  api('GET', '/clients', 'List Clients'),
  api('GET', '/clients/:id', 'Get Client'),
  api('PUT', '/clients/:id', 'Update Client'),
  api('POST', '/vessels', 'Create Vessel'),
  api('GET', '/vessels', 'List Vessels'),
  api('GET', '/vessels/:id', 'Get Vessel'),
  api('PUT', '/vessels/:id', 'Update Vessel'),
  api('POST', '/jobs', 'Create Job'),
  api('PUT', '/jobs/:id/assign', 'Assign Surveyor'),
  api('PUT', '/jobs/:id/status', 'Update Job Status'),
  api('PUT', '/jobs/:id/cancel', 'Cancel Job'),
  api('PUT', '/jobs/:id/hold', 'Hold Job'),
  api('PUT', '/jobs/:id/resume', 'Resume Job'),
  api('POST', '/jobs/:id/clone', 'Clone Job'),
  api('GET', '/certificates/types', 'Get Certificate Types'),
  api('POST', '/certificates', 'Generate Certificate'),
  api('POST', '/certificates/:id/sign', 'Sign Certificate'),
  api('POST', '/certificates/:id/transfer', 'Transfer Certificate'),
  api('POST', '/certificates/:id/extend', 'Extend Certificate'),
  api('PUT', '/certificates/:id/downgrade', 'Downgrade Certificate'),
  api('POST', '/payments/invoice', 'Create Invoice'),
  api('PUT', '/payments/:id/pay', 'Mark Paid'),
  api('GET', '/payments/:id/ledger', 'Get Ledger'),
  api('GET', '/reports/certificates', 'Report Certificates'),
  api('GET', '/reports/surveyors', 'Report Surveyors'),
  api('GET', '/reports/non-conformities', 'Report NC'),
  api('GET', '/reports/financials', 'Report Financials'),
  api('PUT', '/change-requests/:id/approve', 'Approve Change Request'),
  api('PUT', '/change-requests/:id/reject', 'Reject Change Request'),
  api('GET', '/activity-requests', 'List Activity Requests'),
  api('GET', '/activity-requests/:id', 'Get Activity Request'),
  api('POST', '/activity-requests/:id/approve', 'Approve Activity Request'),
  api('POST', '/activity-requests/:id/reject', 'Reject Activity Request'),
  api('GET', '/customer-feedback', 'List Feedback'),
  api('POST', '/providers', 'Create Provider'),
  api('PUT', '/providers/:id/status', 'Update Provider Status'),
  api('PUT', '/support/:id/status', 'Update Support Ticket Status'),
];

const tmApis = [
  api('PUT', '/jobs/:id/reassign', 'Reassign Surveyor'),
  api('PUT', '/jobs/:id/escalate', 'Escalate Job'),
  api('GET', '/surveys/:id/timeline', 'Survey Timeline'),
  api('POST', '/surveys/:id/violation', 'Flag Violation'),
  api('PUT', '/certificates/:id/suspend', 'Suspend Certificate'),
  api('PUT', '/certificates/:id/revoke', 'Revoke Certificate'),
  api('PUT', '/certificates/:id/restore', 'Restore Certificate'),
  api('PUT', '/certificates/:id/renew', 'Renew Certificate'),
  api('POST', '/certificates/:id/reissue', 'Reissue Certificate'),
  api('POST', '/toca', 'Create TOCA'),
  api('PUT', '/toca/:id/status', 'Update TOCA Status'),
  api('PUT', '/non-conformities/:id/close', 'Close NC'),
  api('GET', '/surveyors/applications', 'List Surveyor Applications'),
  api('PUT', '/surveyors/applications/:id/review', 'Review Application'),
  api('GET', '/surveyors/:id/profile', 'Get Surveyor Profile'),
  api('PUT', '/surveyors/:id/profile', 'Update Surveyor Profile'),
  api('POST', '/providers/:id/evaluations', 'Evaluate Provider'),
  api('GET', '/providers/:id/evaluations', 'Get Provider Evaluations'),
];

const toApis = [
  api('PUT', '/jobs/:id/status', 'Update Job Status'),
  api('PUT', '/jobs/:id/escalate', 'Escalate Job'),
  api('GET', '/surveys', 'List Survey Reports'),
  api('POST', '/non-conformities', 'Create NC'),
  api('PUT', '/non-conformities/:id/close', 'Close NC'),
  api('GET', '/clients', 'List Clients'),
  api('GET', '/clients/:id', 'Get Client'),
  api('GET', '/vessels', 'List Vessels'),
  api('GET', '/vessels/:id', 'Get Vessel'),
  api('GET', '/providers', 'List Providers'),
];

const sharedAuthApis = [
  api('GET', '/dashboard', 'Dashboard (role-specific summary)'),
  api('GET', '/jobs', 'List Jobs'),
  api('GET', '/jobs/:id', 'Get Job'),
  api('GET', '/jobs/:id/history', 'Job History'),
  api('GET', '/certificates', 'List Certificates'),
  api('GET', '/certificates/:id/preview', 'Certificate Preview'),
  api('GET', '/certificates/:id/signature', 'Certificate Signature'),
  api('GET', '/certificates/:id/history', 'Certificate History'),
  api('POST', '/documents/upload', 'Upload Document'),
  api('GET', '/documents/:entity/:id', 'Get Documents'),
  api('DELETE', '/documents/:id', 'Delete Document'),
  api('GET', '/health', 'System Health'),
  api('GET', '/system/readiness', 'Readiness'),
  api('GET', '/system/version', 'Version'),
  api('GET', '/system/feature-flags', 'Feature Flags'),
  api('GET', '/system/locales', 'Locales'),
  api('POST', '/approvals', 'Create Approval'),
  api('PUT', '/approvals/:id/step', 'Approval Step'),
  api('GET', '/notifications', 'List Notifications'),
  api('PUT', '/notifications/:id/read', 'Mark Read'),
  api('GET', '/notifications/preferences', 'Get Preferences'),
  api('PUT', '/notifications/preferences', 'Update Preferences'),
  api('POST', '/change-requests', 'Create Change Request'),
  api('GET', '/change-requests', 'List Change Requests'),
  api('POST', '/incidents', 'Create Incident'),
  api('GET', '/incidents', 'List Incidents'),
  api('PUT', '/incidents/:id/resolve', 'Resolve Incident'),
  api('GET', '/client/dashboard', 'Client Dashboard'),
  api('GET', '/client/jobs', 'Client Jobs'),
  api('GET', '/client/certificates', 'Client Certificates'),
  api('GET', '/toca', 'List TOCAs'),
  api('GET', '/flags', 'List Flags'),
  api('GET', '/jobs/:jobId/checklist', 'Get Checklist'),
  api('GET', '/non-conformities/job/:jobId', 'NC by Job'),
  api('POST', '/mobile/sync', 'Mobile Sync'),
  api('GET', '/mobile/offline/jobs', 'Offline Jobs'),
  api('POST', '/mobile/offline/surveys', 'Offline Surveys'),
  api('GET', '/search', 'Global Search'),
  api('POST', '/support', 'Create Support Ticket'),
  api('GET', '/support', 'List Support Tickets'),
  api('GET', '/support/:id', 'Get Support Ticket'),
];

const surveyorApis = [
  api('POST', '/surveys/start', 'Start Survey'),
  api('POST', '/surveys', 'Submit Survey Report'),
  api('PUT', '/surveys/:id/finalize', 'Finalize Survey'),
  api('POST', '/surveys/:id/location', 'Stream Location'),
  api('POST', '/surveys/:id/proof', 'Upload Proof'),
  api('GET', '/jobs/:jobId/checklist', 'Get Checklist'),
  api('PUT', '/jobs/:jobId/checklist', 'Submit Checklist'),
  api('POST', '/non-conformities', 'Create NC'),
  api('GET', '/surveyors/:id/profile', 'Get My Profile'),
  api('GET', '/vessels', 'List Vessels'),
  api('GET', '/vessels/:id', 'Get Vessel'),
];

const clientApis = [
  api('GET', '/dashboard', 'Dashboard (role-specific summary)'),
  api('GET', '/certificates/types', 'Get Certificate Types'),
  api('POST', '/jobs', 'Create Job'),
  api('GET', '/jobs', 'List My Jobs'),
  api('GET', '/jobs/:id', 'Get Job'),
  api('GET', '/jobs/:id/history', 'Job History'),
  api('GET', '/jobs/:jobId/checklist', 'Get Checklist'),
  api('GET', '/certificates', 'List Certificates'),
  api('GET', '/certificates/expiring', 'Expiring Certificates'),
  api('GET', '/certificates/:id/preview', 'Certificate Preview'),
  api('GET', '/certificates/:id/signature', 'Certificate Signature'),
  api('GET', '/certificates/:id/history', 'Certificate History'),
  api('GET', '/vessels', 'List Vessels'),
  api('GET', '/vessels/:id', 'Get Vessel'),
  api('GET', '/client/dashboard', 'Client Dashboard'),
  api('GET', '/client/profile', 'Client Profile'),
  api('GET', '/client/jobs', 'Client Jobs'),
  api('GET', '/client/certificates', 'Client Certificates'),
  api('POST', '/activity-requests', 'Create Activity Request'),
  api('GET', '/activity-requests', 'List My Requests'),
  api('GET', '/activity-requests/:id', 'Get Request'),
  api('POST', '/customer-feedback', 'Submit Feedback'),
  api('GET', '/customer-feedback/job/:jobId', 'Feedback for Job'),
  api('POST', '/documents/upload', 'Upload Document'),
  api('GET', '/documents/:entity/:id', 'Get Documents'),
  api('DELETE', '/documents/:id', 'Delete Document'),
  api('GET', '/health', 'System Health'),
  api('GET', '/system/readiness', 'Readiness'),
  api('GET', '/system/version', 'Version'),
  api('GET', '/system/feature-flags', 'Feature Flags'),
  api('GET', '/system/locales', 'Locales'),
  api('POST', '/approvals', 'Create Approval'),
  api('PUT', '/approvals/:id/step', 'Approval Step'),
  api('GET', '/notifications', 'List Notifications'),
  api('PUT', '/notifications/:id/read', 'Mark Read'),
  api('GET', '/notifications/preferences', 'Get Preferences'),
  api('PUT', '/notifications/preferences', 'Update Preferences'),
  api('POST', '/change-requests', 'Create Change Request'),
  api('GET', '/change-requests', 'List Change Requests'),
  api('POST', '/incidents', 'Create Incident'),
  api('GET', '/incidents', 'List Incidents'),
  api('PUT', '/incidents/:id/resolve', 'Resolve Incident'),
  api('GET', '/toca', 'List TOCAs'),
  api('GET', '/flags', 'List Flags'),
  api('GET', '/non-conformities/job/:jobId', 'NC by Job'),
  api('POST', '/mobile/sync', 'Mobile Sync'),
  api('GET', '/mobile/offline/jobs', 'Offline Jobs'),
  api('POST', '/mobile/offline/surveys', 'Offline Surveys'),
  api('GET', '/compliance/export/:id', 'Export Compliance Data'),
];

// Role -> list of { method, path, summary }
const roleToApis = {
  Admin: [...adminApis, ...gmApis, ...toApis],
  GM: gmApis,
  TM: [...tmApis],
  TO: [...toApis],
  TA: [],
  Surveyor: surveyorApis,
  Client: clientApis,
  'Flag Admin': [],
};

// Add shared auth APIs to Admin, GM, TM, TO, TA, Surveyor, Client, Flag Admin
['Admin', 'GM', 'TM', 'TO', 'TA', 'Surveyor', 'Client', 'Flag Admin'].forEach((role) => {
  const list = roleToApis[role] || [];
  roleToApis[role] = list;
  sharedAuthApis.forEach((a) => {
    if (!list.some((x) => x.method === a.method && x.path === a.path)) {
      list.push(a);
    }
  });
});

// Merge: for each (method, path) collect roles and build tags "Role » Module"
const opKey = (method, path) => `${method.toUpperCase()} ${path}`;
const opMap = new Map(); // key = opKey, value = { method, path, summary, roles: Set }

function addOp(method, path, summary, role) {
  const key = opKey(method, path);
  if (!opMap.has(key)) {
    opMap.set(key, { method: method.toUpperCase(), path, summary, roles: new Set() });
  }
  opMap.get(key).roles.add(role);
}

publicApis.forEach((a) => addOp(a.method, a.path, a.summary, 'Public'));
authApis.forEach((a) => addOp(a.method, a.path, a.summary, 'Authentication'));

ROLES_ORDER.forEach((role) => {
  const list = roleToApis[role];
  if (!list) return;
  list.forEach((a) => addOp(a.method, a.path, a.summary, role));
});

// Build unique tags in order: Public, Authentication, then for each role all "Role » Module"
const tagSet = new Set();
tagSet.add('Public');
tagSet.add('Authentication');
ROLES_ORDER.forEach((role) => {
  opMap.forEach((op) => {
    if (op.roles.has(role)) {
      const mod = getModuleName(op.path);
      tagSet.add(`${role} » ${mod}`);
    }
  });
});

const tagOrder = ['Public', 'Authentication'];
ROLES_ORDER.forEach((role) => {
  const mods = new Set();
  opMap.forEach((op) => {
    if (op.roles.has(role)) mods.add(getModuleName(op.path));
  });
  const modOrder = ['Users', 'System', 'Health & Readiness', 'Flags', 'Clients', 'Vessels', 'Jobs', 'Surveys', 'Certificates', 'Payments', 'Documents', 'Reports', 'Change Requests', 'Certificate Templates', 'Incidents', 'Activity Requests', 'Notifications', 'Providers', 'Customer Feedback', 'Approvals', 'TOCA', 'Non-Conformities', 'Surveyors', 'Mobile', 'Support', 'Search', 'Compliance', 'Client Portal', 'Dashboard', 'Other'];
  modOrder.forEach((m) => {
    if (mods.has(m)) tagOrder.push(`${role} » ${m}`);
  });
  mods.forEach((m) => {
    if (!modOrder.includes(m)) tagOrder.push(`${role} » ${m}`);
  });
});

// Build OpenAPI paths (with proper params + request body schemas and examples)
const paths = {};
opMap.forEach((op) => {
  const openPath = toOpenApiPath(op.path);
  const method = op.method.toLowerCase();
  const moduleName = getModuleName(op.path);
  const tags = Array.from(op.roles)
    .filter((r) => r !== 'Public' && r !== 'Authentication')
    .map((r) => `${r} » ${moduleName}`);
  if (op.roles.has('Public')) tags.unshift('Public');
  if (op.roles.has('Authentication')) tags.unshift('Authentication');

  if (!paths[openPath]) paths[openPath] = {};
  const pathParams = getPathParams(openPath);
  const bodySpec = getRequestBody(op.method, op.path);

  paths[openPath][method] = {
    tags: tags.length ? tags : [`Other » ${moduleName}`],
    summary: op.summary,
    responses: { '200': { description: 'Success' }, '201': { description: 'Created' }, '400': { description: 'Bad Request' }, '401': { description: 'Unauthorized' }, '404': { description: 'Not Found' } },
  };
  if (pathParams.length) paths[openPath][method].parameters = pathParams;

  if (op.path.includes('/upload')) {
    paths[openPath][method].requestBody = {
      content: {
        'multipart/form-data': {
          schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' }, entity_type: { type: 'string' }, entity_id: { type: 'string' }, document_type: { type: 'string' }, description: { type: 'string' } } },
        },
      },
    };
  } else if (op.path === '/surveyors/apply') {
    paths[openPath][method].requestBody = {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            required: ['full_name', 'email', 'phone', 'nationality', 'qualification', 'years_of_experience'],
            properties: {
              full_name: { type: 'string', example: 'John Doe' },
              email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
              phone: { type: 'string', example: '+1-234-567-8900' },
              nationality: { type: 'string', example: 'United Kingdom' },
              qualification: { type: 'string', example: 'Master Mariner (Class 1)' },
              years_of_experience: { type: 'integer', example: 12 },
              cv: { type: 'string', format: 'binary' },
              id_proof: { type: 'string', format: 'binary' },
              certificates: { type: 'array', items: { type: 'string', format: 'binary' } }
            }
          },
        },
      },
    };
  } else if (bodySpec) {
    paths[openPath][method].requestBody = {
      content: {
        'application/json': {
          schema: bodySpec.schema,
          example: bodySpec.example,
        },
      },
    };
  } else if (['post', 'put', 'patch'].includes(method)) {
    paths[openPath][method].requestBody = {
      content: {
        'application/json': {
          schema: { type: 'object', additionalProperties: true },
        },
      },
    };
  }
});

const doc = {
  openapi: '3.0.0',
  info: {
    title: 'GIRIK Backend API',
    version: '1.0.0',
    description: [
      '## Choose role, then see APIs',
      '',
      '**Sections below are ordered by role.** Under each role, APIs are grouped by module (folder).',
      '',
      '| Role | Jump to first section |',
      '|------|------------------------|',
      ...tagOrder
        .filter((t) => t.includes(' » '))
        .reduce((acc, t) => {
          const [role] = t.split(' » ');
          if (acc.seen.has(role)) return acc;
          acc.seen.add(role);
          acc.lines.push(`| ${role} | Use the **Filter** box and type \`${role}\` to show only ${role} APIs |`);
          return acc;
        }, { seen: new Set(), lines: [] }).lines,
      '',
      'Use the **Filter** box above the endpoints to type a role name (e.g. `Admin`, `Client`) and see only that role\'s APIs. Each section heading is **Role » Module** (e.g. **Admin » Users**, **Client » Jobs**).',
    ].join('\n'),
  },
  servers: [
    { url: 'http://localhost:3000/api/v1', description: 'Local' },
    { url: 'https://api.girik.com/api/v1', description: 'Production' },
  ],
  tags: tagOrder.map((name) => ({ name, description: name.includes(' » ') ? `APIs for ${name}` : name })),
  paths,
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Use the token from POST /auth/login',
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

// Remove security from Public and Authentication paths
Object.keys(doc.paths).forEach((p) => {
  Object.keys(doc.paths[p]).forEach((method) => {
    const op = doc.paths[p][method];
    if (op.tags && (op.tags.includes('Public') || op.tags.includes('Authentication'))) {
      op.security = [];
    }
  });
});

const outDir = path.join(__dirname, '..', 'src', 'docs');
const rolesDir = path.join(outDir, 'roles');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
if (!fs.existsSync(rolesDir)) fs.mkdirSync(rolesDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'swagger-by-role.json'), JSON.stringify(doc, null, 2), 'utf8');
console.log('Written: src/docs/swagger-by-role.json');

// ---------- Per-role Swagger docs (one page per role, section-wise by module) ----------
const roleSlug = (r) => r.toLowerCase().replace(/\s+/g, '-');
const roleTitle = (r) => (r === 'Flag Admin' ? 'Flag Admin' : r);

ROLES_ORDER.forEach((role) => {
  const slug = roleSlug(role);
  const rolePaths = {};
  opMap.forEach((op) => {
    if (!op.roles.has(role)) return;
    const openPath = toOpenApiPath(op.path);
    const method = op.method.toLowerCase();
    const moduleName = getModuleName(op.path);
    if (!rolePaths[openPath]) rolePaths[openPath] = {};
    const pathParams = getPathParams(openPath);
    const bodySpec = getRequestBody(op.method, op.path);
    rolePaths[openPath][method] = {
      tags: [moduleName],
      summary: op.summary,
      responses: { '200': { description: 'Success' }, '201': { description: 'Created' }, '400': { description: 'Bad Request' }, '401': { description: 'Unauthorized' }, '404': { description: 'Not Found' } },
    };
    if (pathParams.length) rolePaths[openPath][method].parameters = pathParams;
    if (op.path.includes('/upload')) {
      rolePaths[openPath][method].requestBody = {
        content: { 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } } },
      };
    } else if (op.path === '/surveyors/apply') {
      rolePaths[openPath][method].requestBody = {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['full_name', 'email', 'phone', 'nationality', 'qualification', 'years_of_experience'],
              properties: {
                full_name: { type: 'string', example: 'John Doe' },
                email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
                phone: { type: 'string', example: '+1-234-567-8900' },
                nationality: { type: 'string', example: 'United Kingdom' },
                qualification: { type: 'string', example: 'Master Mariner (Class 1)' },
                years_of_experience: { type: 'integer', example: 12 },
                cv: { type: 'string', format: 'binary' },
                id_proof: { type: 'string', format: 'binary' },
                certificates: { type: 'array', items: { type: 'string', format: 'binary' } }
              }
            },
          },
        },
      };
    } else if (bodySpec) {

      rolePaths[openPath][method].requestBody = {
        content: { 'application/json': { schema: bodySpec.schema, example: bodySpec.example } },
      };
    } else if (['post', 'put', 'patch'].includes(method)) {
      rolePaths[openPath][method].requestBody = {
        content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } },
      };
    }
  });
  // Include Public + Authentication for every role doc
  ['Public', 'Authentication'].forEach((r) => {
    opMap.forEach((op) => {
      if (!op.roles.has(r)) return;
      const openPath = toOpenApiPath(op.path);
      const method = op.method.toLowerCase();
      const moduleName = getModuleName(op.path);
      if (!rolePaths[openPath]) rolePaths[openPath] = {};
      if (rolePaths[openPath][method]) return; // already added
      const pathParams = getPathParams(openPath);
      const bodySpec = getRequestBody(op.method, op.path);
      rolePaths[openPath][method] = {
        tags: [moduleName],
        summary: op.summary,
        security: [],
        responses: { '200': { description: 'Success' }, '201': { description: 'Created' }, '400': { description: 'Bad Request' } },
      };
      if (pathParams.length) rolePaths[openPath][method].parameters = pathParams;
      if (bodySpec) rolePaths[openPath][method].requestBody = { content: { 'application/json': { schema: bodySpec.schema, example: bodySpec.example } } };
      else if (['post', 'put', 'patch'].includes(method)) rolePaths[openPath][method].requestBody = { content: { 'application/json': { schema: { type: 'object' } } } };
    });
  });

  const modOrder = ['Public', 'Authentication', 'Users', 'System', 'Health & Readiness', 'Flags', 'Clients', 'Vessels', 'Jobs', 'Surveys', 'Certificates', 'Payments', 'Documents', 'Reports', 'Change Requests', 'Certificate Templates', 'Incidents', 'Activity Requests', 'Notifications', 'Providers', 'Customer Feedback', 'Approvals', 'TOCA', 'Non-Conformities', 'Surveyors', 'Mobile', 'Support', 'Search', 'Compliance', 'Client Portal', 'Dashboard', 'Other'];
  const tagsForRole = [...new Set(Object.values(rolePaths).flatMap((m) => Object.values(m).flatMap((o) => o.tags)))];
  const tagOrder = modOrder.filter((t) => tagsForRole.includes(t));

  const roleDoc = {
    openapi: '3.0.0',
    info: {
      title: `GIRIK API - ${roleTitle(role)}`,
      version: '1.0.0',
      description: `APIs for **${roleTitle(role)}** role. Sections are grouped by module (Users, Clients, Vessels, Jobs, etc.). Use \`POST /auth/login\` first and set the token in Authorize.`,
    },
    servers: [
      { url: 'http://localhost:3000/api/v1', description: 'Local' },
      { url: 'https://api.girik.com/api/v1', description: 'Production' },
    ],
    tags: tagOrder.map((name) => ({ name, description: name })),
    paths: rolePaths,
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Token from POST /auth/login' },
      },
    },
    security: [{ bearerAuth: [] }],
  };

  fs.writeFileSync(path.join(rolesDir, `swagger-role-${slug}.json`), JSON.stringify(roleDoc, null, 2), 'utf8');
  console.log(`Written: src/docs/roles/swagger-role-${slug}.json`);
});

// Role selector HTML (for app to serve at GET /api-docs)
const selectorHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>GIRIK API Docs - Choose Role</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 2rem; background: #f5f5f5; min-height: 100vh; }
    h1 { color: #1a202c; margin-bottom: 0.5rem; }
    p { color: #4a5568; margin-bottom: 1.5rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }
    a { display: block; padding: 1.25rem; background: #fff; border-radius: 8px; text-decoration: none; color: #2d3748; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: transform .15s, box-shadow .15s; }
    a:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    a.all { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; }
  </style>
</head>
<body>
  <h1>GIRIK API Documentation</h1>
  <p>Choose a role to see only that role's APIs (section-wise by module).</p>
  <div class="grid">
    <a class="all" href="/api-docs/all">All APIs (by role)</a>
    <a href="/api-docs/role/admin">Admin</a>
    <a href="/api-docs/role/gm">GM</a>
    <a href="/api-docs/role/tm">TM</a>
    <a href="/api-docs/role/to">TO</a>
    <a href="/api-docs/role/ta">TA</a>
    <a href="/api-docs/role/surveyor">Surveyor</a>
    <a href="/api-docs/role/client">Client</a>
    <a href="/api-docs/role/flag-admin">Flag Admin</a>
  </div>
</body>
</html>`;
fs.writeFileSync(path.join(outDir, 'api-docs-index.html'), selectorHtml, 'utf8');
console.log('Written: src/docs/api-docs-index.html');
