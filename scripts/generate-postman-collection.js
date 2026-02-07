/**
 * Generates GIRIK Postman collection with folders per role.
 * Every request that accepts body has FULL sample data so developers know exact API input.
 * Run: node scripts/generate-postman-collection.js > GIRIK_Postman_Collection.json
 */

const base = '{{base_url}}';

// ---------- Full request bodies (match validation schemas & API contracts) ----------
const B = {
  login: { email: 'admin@girik.com', password: 'admin123' },
  refreshToken: { token: '{{refresh_token}}' },
  forgotPassword: { email: 'user@example.com' },
  resetPassword: { token: 'RESET_TOKEN_FROM_EMAIL', newPassword: 'NewSecurePass123!' },

  createUser: { name: 'Full Name', email: 'user@girik.com', password: 'Password123!', role: 'TM', phone: '+919876543210', client_id: '{{client_id}}' },
  updateUser: { name: 'Updated Name', phone: '+919876543211' },
  updateUserStatus: { status: 'SUSPENDED' },

  createClient: { company_name: 'Acme Shipping Ltd', company_code: 'ACME-01', email: 'contact@acme.com', address: '123 Harbour Road', country: 'Singapore', phone: '+65 6123 4567', contact_person_name: 'John Doe', contact_person_email: 'john@acme.com', status: 'ACTIVE', user: { name: 'Client Login User', email: 'clientuser@acme.com', password: 'SecurePass123!', role: 'CLIENT', phone: '+65 6123 4568' } },
  updateClient: { company_name: 'Acme Shipping Ltd', address: '456 New Harbour Rd', country: 'Singapore', phone: '+65 6123 4599', contact_person_name: 'Jane Doe', contact_person_email: 'jane@acme.com' },

  createVessel: { vessel_name: 'SEA MAJESTY', imo_number: 'IMO9876543', client_id: '{{client_id}}', flag_state: 'Panama', ship_type: 'Cargo', call_sign: 'HPAB', year_built: 2015, gross_tonnage: 25000, net_tonnage: 12000 },
  updateVessel: { vessel_name: 'SEA MAJESTY II', flag_state: 'Liberia', phone: '+1 234 567 8900' },

  createJob: { vessel_id: '{{vessel_id}}', certificate_type_id: '{{certificate_type_id}}', reason: 'Annual survey and class renewal', target_port: 'Port of Singapore', target_date: '2025-12-15' },
  /** Client: vessel_id from Client Dashboard/Client Certificates response; certificate_type_id from GET /certificates/types */
  createJobClient: { vessel_id: '{{vessel_id}}', certificate_type_id: '{{certificate_type_id}}', reason: 'Annual survey and class renewal', target_port: 'Port of Singapore', target_date: '2025-12-15' },
  assignSurveyor: { surveyorId: '{{surveyor_id}}' },
  updateJobStatus: { status: 'ASSIGNED', remarks: 'Job assigned to surveyor' },
  reassignJob: { surveyorId: '{{surveyor_id}}', reason: 'Original surveyor unavailable' },
  escalateJob: { reason: 'Urgent client request', target_role: 'GM' },
  cancelJob: { reason: 'Client requested cancellation' },
  holdJob: { reason: 'Awaiting documents' },
  resumeJob: { reason: 'Documents received' },

  generateCertificate: { job_id: '{{job_id}}', validity_years: 1 },
  certReason: { reason: 'Administrative suspension' },
  renewCert: { validity_years: 2, reason: 'Standard renewal' },
  transferCert: { newOwnerId: '{{vessel_id}}', reason: 'Vessel sold' },
  extendCert: { extensionMonths: 6, reason: 'Extension granted' },
  downgradeCert: { newTypeId: '{{certificate_type_id}}', reason: 'Downgrade requested' },

  createInvoice: { job_id: '{{job_id}}', amount: 3500.00, currency: 'USD' },
  writeOff: { paymentId: '{{payment_id}}', reason: 'Bad debt - client insolvent' },

  createFlag: { flag_name: 'Panama', country: 'Panama', authority_name: 'Panama Maritime Authority', contact_email: 'pma@panama.gob.pa' },
  updateFlag: { flag_name: 'Panama', country: 'Panama', authority_name: 'Panama Maritime Authority (Updated)', contact_email: 'contact@pma.gob.pa' },

  createTemplate: { name: 'Annual Survey Checklist', code: 'ANNUAL-01', description: 'Standard annual survey', sections: [{ title: 'Hull', items: [{ code: 'H1', text: 'Hull condition', type: 'YES_NO_NA' }, { code: 'H2', text: 'Thickness reading', type: 'NUMBER' }] }, { title: 'Machinery', items: [{ code: 'M1', text: 'Main engine condition', type: 'YES_NO_NA' }] }], status: 'ACTIVE' },
  updateTemplate: { name: 'Annual Survey Checklist (Revised)', description: 'Updated description', status: 'ACTIVE' },

  createToca: { vessel_id: '{{vessel_id}}', losing_class_society: 'Lloyd\'s Register', gaining_class_society: 'DNV', request_date: '2025-06-01' },
  updateTocaStatus: { status: 'ACCEPTED' },

  createNC: { job_id: '{{job_id}}', description: 'Crack found on hull plate section 3', severity: 'MAJOR' },
  closeNC: { closure_remarks: 'Repair completed and verified by surveyor' },

  submitChecklist: { items: [{ question_code: 'Q1', answer: 'YES', remarks: 'All OK' }, { question_code: 'Q2', answer: 'NO', remarks: 'Minor defect noted' }, { question_code: 'Q3', answer: 'NA', remarks: '' }] },

  startSurvey: { job_id: '{{job_id}}', latitude: 1.3521, longitude: 103.8198 },
  submitSurvey: { job_id: '{{job_id}}', gps_latitude: 1.3521, gps_longitude: 103.8198, survey_statement: 'Survey completed as per checklist. All items verified.', reason_if_outside: '' },
  streamLocation: { latitude: 1.3521, longitude: 103.8198 },
  flagViolation: { description: 'Surveyor arrived outside permitted geofence' },

  createChangeRequest: { entity_type: 'VESSEL', entity_id: '{{vessel_id}}', change_description: 'Update vessel flag state', old_value: 'Panama', new_value: 'Liberia', priority: 'MEDIUM' },
  approveChangeRequest: { remarks: 'Approved after verification' },
  rejectChangeRequest: { remarks: 'Insufficient documentation' },

  createIncident: { incident_type: 'SAFETY', entity_type: 'JOB', entity_id: '{{job_id}}', description: 'Minor injury during survey - first aid applied', severity: 'LOW' },
  resolveIncident: { resolution: 'Closed. No further action required.' },

  updateNotifPrefs: { email_enabled: true, app_enabled: true, alert_types: ['JOB_ASSIGNED', 'CERTIFICATE_EXPIRY', 'PAYMENT_DUE'] },

  createApproval: { entity_type: 'CERTIFICATE', entity_id: '{{id}}', approval_type: 'SIGN_OFF', requested_by: '{{target_user_id}}' },
  approvalStep: { status: 'APPROVED' },

  createActivityRequest: { activity_type: 'INSPECTION', vessel_id: '{{vessel_id}}', requested_service: 'Annual Survey', priority: 'HIGH', description: 'Request for annual survey at next port', location_port: 'Port of Singapore', proposed_date: '2025-08-15' },
  rejectActivityRequest: { reason: 'Slot not available for requested date' },

  createProvider: { company_name: 'Marine Services Co', service_type: 'DRY_DOCK', contact_person: 'John Smith', email: 'john@marineservices.com', phone: '+65 6123 4000' },
  updateProviderStatus: { status: 'APPROVED' },
  evaluateProvider: { rating: 4.5, comment: 'Good quality work, on time' },

  customerFeedback: { job_id: '{{job_id}}', rating: 5, comment: 'Excellent service and professional surveyor' },

  mobileSync: { last_sync_timestamp: '2025-02-07T10:00:00.000Z', offline_data: {} },
  mobileOfflineSurveys: { surveys: [{ job_id: '{{job_id}}', gps_latitude: 1.35, gps_longitude: 103.81, survey_statement: 'Offline survey data' }] },

  maintenanceAction: {},
  createNotificationRule: {},
};

function raw(obj) {
  return JSON.stringify(obj, null, 2);
}

function req(name, method, path, body = null, opts = {}) {
  const r = {
    name,
    request: {
      method,
      header: opts.headers || [],
      url: `${base}${path}`,
    },
  };
  if (body && typeof body === 'object' && body.raw) {
    r.request.body = { mode: 'raw', raw: body.raw, options: { raw: { language: 'json' } } };
  } else if (body && body.formdata) {
    r.request.body = { mode: 'formdata', formdata: body.formdata };
  }
  if (opts.testScript) {
    r.event = [{ listen: 'test', script: { exec: opts.testScript, type: 'text/javascript' } }];
  }
  return r;
}

const authFolder = {
  name: 'Authentication',
  description: 'Login first; token is saved automatically. Use this token for all role folders.',
  item: [
    req('Login', 'POST', '/auth/login', { raw: raw(B.login) }, {
      testScript: ['const d = pm.response.json(); if (d.token) pm.collectionVariables.set("token", d.token);'],
    }),
    req('Logout', 'POST', '/auth/logout'),
    req('Refresh Token', 'POST', '/auth/refresh-token', { raw: raw(B.refreshToken) }),
    req('Forgot Password', 'POST', '/auth/forgot-password', { raw: raw(B.forgotPassword) }),
    req('Reset Password', 'POST', '/auth/reset-password', { raw: raw(B.resetPassword) }),
  ],
};

const publicFolder = {
  name: 'Public (No Auth)',
  item: [
    req('Verify Certificate', 'GET', '/public/certificate/verify/CERT-001'),
    req('Verify Vessel', 'GET', '/public/vessel/IMO1234567'),
    req('Surveyor Apply (multipart: cv, id_proof, certificates)', 'POST', '/surveyors/apply'),
  ],
};

// APIs by role – body = full sample so devs see exact API input
const adminApis = [
  ['GET', '/users', 'List Users'],
  ['POST', '/users', 'Create User', raw(B.createUser)],
  ['PUT', '/users/:id', 'Update User', raw(B.updateUser)],
  ['PUT', '/users/:id/status', 'Update User Status', raw(B.updateUserStatus)],
  ['DELETE', '/users/:id', 'Delete User'],
  ['GET', '/system/metrics', 'System Metrics'],
  ['GET', '/system/migrations', 'System Migrations'],
  ['GET', '/system/jobs/failed', 'Failed Jobs'],
  ['POST', '/system/jobs/:id/retry', 'Retry Job'],
  ['POST', '/system/maintenance/:action', 'Maintenance Action', raw(B.maintenanceAction)],
  ['POST', '/flags', 'Create Flag', raw(B.createFlag)],
  ['PUT', '/flags/:id', 'Update Flag', raw(B.updateFlag)],
  ['DELETE', '/clients/:id', 'Delete Client'],
  ['POST', '/payments/writeoff', 'Write Off Payment', raw(B.writeOff)],
  ['GET', '/notifications/rules', 'Get Notification Rules'],
  ['POST', '/notifications/rules', 'Create Notification Rule', raw(B.createNotificationRule)],
  ['POST', '/certificate-templates', 'Create Template', raw(B.createTemplate)],
  ['GET', '/certificate-templates', 'List Templates'],
  ['GET', '/certificate-templates/:id', 'Get Template'],
  ['PUT', '/certificate-templates/:id', 'Update Template', raw(B.updateTemplate)],
  ['DELETE', '/certificate-templates/:id', 'Delete Template'],
];

const gmApis = [
  ['POST', '/clients', 'Create Client (with optional user)', raw(B.createClient)],
  ['GET', '/clients', 'List Clients'],
  ['GET', '/clients/:id', 'Get Client'],
  ['PUT', '/clients/:id', 'Update Client', raw(B.updateClient)],
  ['POST', '/vessels', 'Create Vessel', raw(B.createVessel)],
  ['GET', '/vessels', 'List Vessels'],
  ['GET', '/vessels/:id', 'Get Vessel'],
  ['PUT', '/vessels/:id', 'Update Vessel', raw(B.updateVessel)],
  ['POST', '/jobs', 'Create Job', raw(B.createJob)],
  ['PUT', '/jobs/:id/assign', 'Assign Surveyor', raw(B.assignSurveyor)],
  ['PUT', '/jobs/:id/status', 'Update Job Status', raw(B.updateJobStatus)],
  ['PUT', '/jobs/:id/cancel', 'Cancel Job', raw(B.cancelJob)],
  ['PUT', '/jobs/:id/hold', 'Hold Job', raw(B.holdJob)],
  ['PUT', '/jobs/:id/resume', 'Resume Job', raw(B.resumeJob)],
  ['POST', '/jobs/:id/clone', 'Clone Job'],
  ['GET', '/certificates/types', 'Get Certificate Types'],
  ['POST', '/certificates', 'Generate Certificate', raw(B.generateCertificate)],
  ['POST', '/certificates/:id/sign', 'Sign Certificate', raw(B.certReason)],
  ['POST', '/certificates/:id/transfer', 'Transfer Certificate', raw(B.transferCert)],
  ['POST', '/certificates/:id/extend', 'Extend Certificate', raw(B.extendCert)],
  ['PUT', '/certificates/:id/downgrade', 'Downgrade Certificate', raw(B.downgradeCert)],
  ['POST', '/payments/invoice', 'Create Invoice', raw(B.createInvoice)],
  ['PUT', '/payments/:id/pay', 'Mark Paid'],
  ['GET', '/payments/:id/ledger', 'Get Ledger'],
  ['GET', '/reports/certificates', 'Report Certificates'],
  ['GET', '/reports/surveyors', 'Report Surveyors'],
  ['GET', '/reports/non-conformities', 'Report NC'],
  ['GET', '/reports/financials', 'Report Financials'],
  ['PUT', '/change-requests/:id/approve', 'Approve Change Request', raw(B.approveChangeRequest)],
  ['PUT', '/change-requests/:id/reject', 'Reject Change Request', raw(B.rejectChangeRequest)],
  ['GET', '/activity-requests', 'List Activity Requests'],
  ['GET', '/activity-requests/:id', 'Get Activity Request'],
  ['POST', '/activity-requests/:id/approve', 'Approve Activity Request'],
  ['POST', '/activity-requests/:id/reject', 'Reject Activity Request', raw(B.rejectActivityRequest)],
  ['GET', '/customer-feedback', 'List Feedback'],
  ['POST', '/providers', 'Create Provider', raw(B.createProvider)],
  ['PUT', '/providers/:id/status', 'Update Provider Status', raw(B.updateProviderStatus)],
];

const tmApis = [
  ['PUT', '/jobs/:id/reassign', 'Reassign Surveyor', raw(B.reassignJob)],
  ['PUT', '/jobs/:id/escalate', 'Escalate Job', raw(B.escalateJob)],
  ['GET', '/surveys/:id/timeline', 'Survey Timeline'],
  ['POST', '/surveys/:id/violation', 'Flag Violation', raw(B.flagViolation)],
  ['PUT', '/certificates/:id/suspend', 'Suspend Certificate', raw(B.certReason)],
  ['PUT', '/certificates/:id/revoke', 'Revoke Certificate', raw(B.certReason)],
  ['PUT', '/certificates/:id/restore', 'Restore Certificate', raw(B.certReason)],
  ['PUT', '/certificates/:id/renew', 'Renew Certificate', raw(B.renewCert)],
  ['POST', '/certificates/:id/reissue', 'Reissue Certificate', raw(B.certReason)],
  ['POST', '/toca', 'Create TOCA', raw(B.createToca)],
  ['PUT', '/toca/:id/status', 'Update TOCA Status', raw(B.updateTocaStatus)],
  ['PUT', '/non-conformities/:id/close', 'Close NC', raw(B.closeNC)],
  ['GET', '/surveyors/applications', 'List Surveyor Applications'],
  ['PUT', '/surveyors/applications/:id/review', 'Review Application', raw({ status: 'APPROVED', remarks: 'Documents verified' })],
  ['GET', '/surveyors/:id/profile', 'Get Surveyor Profile'],
  ['PUT', '/surveyors/:id/profile', 'Update Surveyor Profile', raw({ license_number: 'SURV-002', status: 'ACTIVE' })],
  ['POST', '/providers/:id/evaluations', 'Evaluate Provider', raw(B.evaluateProvider)],
  ['GET', '/providers/:id/evaluations', 'Get Provider Evaluations'],
];

const toApis = [
  ['PUT', '/jobs/:id/status', 'Update Job Status', raw(B.updateJobStatus)],
  ['PUT', '/jobs/:id/escalate', 'Escalate Job', raw(B.escalateJob)],
  ['GET', '/surveys', 'List Survey Reports'],
  ['POST', '/non-conformities', 'Create NC', raw(B.createNC)],
  ['PUT', '/non-conformities/:id/close', 'Close NC', raw(B.closeNC)],
  ['GET', '/clients', 'List Clients'],
  ['GET', '/clients/:id', 'Get Client'],
  ['GET', '/vessels', 'List Vessels'],
  ['GET', '/vessels/:id', 'Get Vessel'],
  ['GET', '/providers', 'List Providers'],
];

const sharedAuthApis = [
  ['GET', '/dashboard', 'Dashboard (role-specific summary)'],
  ['GET', '/jobs', 'List Jobs'],
  ['GET', '/jobs/:id', 'Get Job'],
  ['GET', '/jobs/:id/history', 'Job History'],
  ['GET', '/certificates', 'List Certificates'],
  ['GET', '/certificates/:id/preview', 'Certificate Preview'],
  ['GET', '/certificates/:id/signature', 'Certificate Signature'],
  ['GET', '/certificates/:id/history', 'Certificate History'],
  ['POST', '/documents/upload', 'Upload Document', null, { formdata: 'document' }],
  ['GET', '/documents/:entity/:id', 'Get Documents'],
  ['DELETE', '/documents/:id', 'Delete Document'],
  ['GET', '/health', 'System Health'],
  ['GET', '/system/readiness', 'Readiness'],
  ['GET', '/system/version', 'Version'],
  ['GET', '/system/feature-flags', 'Feature Flags'],
  ['GET', '/system/locales', 'Locales'],
  ['POST', '/approvals', 'Create Approval', raw(B.createApproval)],
  ['PUT', '/approvals/:id/step', 'Approval Step', raw(B.approvalStep)],
  ['GET', '/notifications', 'List Notifications'],
  ['PUT', '/notifications/:id/read', 'Mark Read'],
  ['GET', '/notifications/preferences', 'Get Preferences'],
  ['PUT', '/notifications/preferences', 'Update Preferences', raw(B.updateNotifPrefs)],
  ['POST', '/change-requests', 'Create Change Request', raw(B.createChangeRequest)],
  ['GET', '/change-requests', 'List Change Requests'],
  ['POST', '/incidents', 'Create Incident', raw(B.createIncident)],
  ['GET', '/incidents', 'List Incidents'],
  ['PUT', '/incidents/:id/resolve', 'Resolve Incident', raw(B.resolveIncident)],
  ['GET', '/client/dashboard', 'Client Dashboard'],
  ['GET', '/client/jobs', 'Client Jobs'],
  ['GET', '/client/certificates', 'Client Certificates'],
  ['GET', '/toca', 'List TOCAs'],
  ['GET', '/flags', 'List Flags'],
  ['GET', '/jobs/:jobId/checklist', 'Get Checklist'],
  ['GET', '/non-conformities/job/:jobId', 'NC by Job'],
  ['POST', '/mobile/sync', 'Mobile Sync', raw(B.mobileSync)],
  ['GET', '/mobile/offline/jobs', 'Offline Jobs'],
  ['POST', '/mobile/offline/surveys', 'Offline Surveys', raw(B.mobileOfflineSurveys)],
];

const surveyorApis = [
  ['POST', '/surveys/start', 'Start Survey', raw(B.startSurvey)],
  ['POST', '/surveys', 'Submit Survey Report', null, { formdata: 'survey' }],
  ['PUT', '/surveys/:id/finalize', 'Finalize Survey'],
  ['POST', '/surveys/:id/location', 'Stream Location', raw(B.streamLocation)],
  ['POST', '/surveys/:id/proof', 'Upload Proof', null, { formdata: 'proof' }],
  ['GET', '/jobs/:jobId/checklist', 'Get Checklist'],
  ['PUT', '/jobs/:jobId/checklist', 'Submit Checklist', raw(B.submitChecklist)],
  ['POST', '/non-conformities', 'Create NC', raw(B.createNC)],
  ['GET', '/surveyors/:id/profile', 'Get My Profile'],
  ['GET', '/vessels', 'List Vessels'],
  ['GET', '/vessels/:id', 'Get Vessel'],
];

// CLIENT folder = all APIs CLIENT role can call (no Admin/GM/TM-only APIs)
const clientApis = [
  ['GET', '/dashboard', 'Dashboard (role-specific summary)'],
  ['GET', '/certificates/types', 'Get Certificate Types (use id in Create Job)'],
  ['POST', '/jobs', 'Create Job', raw(B.createJobClient)],
  ['GET', '/jobs', 'List My Jobs'],
  ['GET', '/jobs/:id', 'Get Job'],
  ['GET', '/jobs/:id/history', 'Job History'],
  ['GET', '/jobs/:jobId/checklist', 'Get Checklist'],
  ['GET', '/certificates', 'List Certificates'],
  ['GET', '/certificates/expiring', 'Expiring Certificates'],
  ['GET', '/certificates/:id/preview', 'Certificate Preview'],
  ['GET', '/certificates/:id/signature', 'Certificate Signature'],
  ['GET', '/certificates/:id/history', 'Certificate History'],
  ['GET', '/vessels', 'List Vessels (use vessel id in Create Job)'],
  ['GET', '/vessels/:id', 'Get Vessel'],
  ['GET', '/client/dashboard', 'Client Dashboard'],
  ['GET', '/client/profile', 'Client Profile'],
  ['GET', '/client/jobs', 'Client Jobs'],
  ['GET', '/client/certificates', 'Client Certificates'],
  ['POST', '/activity-requests', 'Create Activity Request', raw(B.createActivityRequest)],
  ['GET', '/activity-requests', 'List My Requests'],
  ['GET', '/activity-requests/:id', 'Get Request'],
  ['POST', '/customer-feedback', 'Submit Feedback', raw(B.customerFeedback)],
  ['GET', '/customer-feedback/job/:jobId', 'Feedback for Job'],
  ['POST', '/documents/upload', 'Upload Document', null, { formdata: 'document' }],
  ['GET', '/documents/:entity/:id', 'Get Documents'],
  ['DELETE', '/documents/:id', 'Delete Document'],
  ['GET', '/health', 'System Health'],
  ['GET', '/system/readiness', 'Readiness'],
  ['GET', '/system/version', 'Version'],
  ['GET', '/system/feature-flags', 'Feature Flags'],
  ['GET', '/system/locales', 'Locales'],
  ['POST', '/approvals', 'Create Approval', raw(B.createApproval)],
  ['PUT', '/approvals/:id/step', 'Approval Step', raw(B.approvalStep)],
  ['GET', '/notifications', 'List Notifications'],
  ['PUT', '/notifications/:id/read', 'Mark Read'],
  ['GET', '/notifications/preferences', 'Get Preferences'],
  ['PUT', '/notifications/preferences', 'Update Preferences', raw(B.updateNotifPrefs)],
  ['POST', '/change-requests', 'Create Change Request', raw(B.createChangeRequest)],
  ['GET', '/change-requests', 'List Change Requests'],
  ['POST', '/incidents', 'Create Incident', raw(B.createIncident)],
  ['GET', '/incidents', 'List Incidents'],
  ['PUT', '/incidents/:id/resolve', 'Resolve Incident', raw(B.resolveIncident)],
  ['GET', '/toca', 'List TOCAs'],
  ['GET', '/flags', 'List Flags'],
  ['GET', '/non-conformities/job/:jobId', 'NC by Job'],
  ['POST', '/mobile/sync', 'Mobile Sync', raw(B.mobileSync)],
  ['GET', '/mobile/offline/jobs', 'Offline Jobs'],
  ['POST', '/mobile/offline/surveys', 'Offline Surveys', raw(B.mobileOfflineSurveys)],
];

function buildReq(arr) {
  const method = arr[0];
  const path = arr[1];
  const name = arr[2] || path;
  const body = arr[3];
  const opts = arr[4] || {};
  const urlPath = path
    .replace(/:id/g, '{{id}}')
    .replace(/:jobId/g, '{{job_id}}')
    .replace(/:job_id/g, '{{job_id}}')
    .replace(/:entity/g, 'VESSEL')
    .replace(/:number/g, 'CERT-001')
    .replace(/:imo/g, 'IMO1234567')
    .replace(/:action/g, 'status');
  let bodyPayload = undefined;
  if (opts.formdata === 'document') {
    bodyPayload = { formdata: [{ key: 'file', type: 'file', src: [] }, { key: 'entity_type', value: 'VESSEL', type: 'text' }, { key: 'entity_id', value: '{{vessel_id}}', type: 'text' }, { key: 'document_type', value: 'SURVEY_REPORT', type: 'text' }, { key: 'description', value: 'Uploaded document', type: 'text' }] };
  } else if (opts.formdata === 'survey') {
    bodyPayload = { formdata: [{ key: 'photo', type: 'file', src: [] }, { key: 'job_id', value: '{{job_id}}', type: 'text' }, { key: 'gps_latitude', value: '1.3521', type: 'text' }, { key: 'gps_longitude', value: '103.8198', type: 'text' }, { key: 'survey_statement', value: 'Survey completed as per checklist.', type: 'text' }, { key: 'reason_if_outside', value: '', type: 'text' }] };
  } else if (opts.formdata === 'proof') {
    bodyPayload = { formdata: [{ key: 'proof', type: 'file', src: [] }] };
  } else if (body && typeof body === 'string') {
    bodyPayload = { raw: body };
  }
  return req(name, method, urlPath, bodyPayload, opts);
}

/** Get folder name from path for grouping */
function getModuleName(path) {
  const seg = path.split('/').filter(Boolean)[0] || '';
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
  };
  return map[seg] || 'Other';
}

/** Group API arrays into subfolders by module. Dedupes by method+path. */
function groupIntoSubfolders(...apiArrays) {
  const seen = new Set();
  const flat = [];
  apiArrays.flat().forEach((a) => {
    const key = `${a[0]} ${a[1]}`;
    if (seen.has(key)) return;
    seen.add(key);
    flat.push(a);
  });
  const byModule = {};
  flat.forEach((a) => {
    const path = a[1];
    const moduleName = path.startsWith('/health') ? 'Health & Readiness' : getModuleName(path);
    if (!byModule[moduleName]) byModule[moduleName] = [];
    byModule[moduleName].push(a);
  });
  const order = [
    'Dashboard', 'Users', 'System', 'Health & Readiness', 'Flags', 'Clients', 'Vessels', 'Jobs', 'Surveys',
    'Certificates', 'Payments', 'Documents', 'Reports', 'Change Requests', 'Certificate Templates',
    'Incidents', 'Activity Requests', 'Notifications', 'Providers', 'Customer Feedback',
    'Approvals', 'TOCA', 'Non-Conformities', 'Surveyors', 'Mobile', 'Client Portal', 'Other',
  ];
  const result = [];
  order.forEach((name) => {
    if (byModule[name] && byModule[name].length > 0) {
      result.push({ name, item: byModule[name].map(buildReq) });
    }
  });
  Object.keys(byModule).forEach((name) => {
    if (!order.includes(name)) result.push({ name, item: byModule[name].map(buildReq) });
  });
  return result;
}

const adminAllApis = [...adminApis, ...gmApis, ...tmApis, ...toApis, ...sharedAuthApis];
const adminFolder = {
  name: 'Admin',
  description: 'All APIs ADMIN can access. Subfolders grouped by module.',
  item: groupIntoSubfolders(adminAllApis),
};
const gmFolder = { name: 'GM', description: 'APIs GM can access', item: groupIntoSubfolders(gmApis, sharedAuthApis) };
const tmFolder = { name: 'TM', description: 'APIs TM can access', item: groupIntoSubfolders(tmApis, gmApis, sharedAuthApis) };
const toFolder = { name: 'TO', description: 'APIs TO can access', item: groupIntoSubfolders(toApis, sharedAuthApis) };
const taFolder = { name: 'TA', description: 'APIs TA can access', item: groupIntoSubfolders(sharedAuthApis) };
const surveyorFolder = { name: 'Surveyor', description: 'APIs SURVEYOR can access', item: groupIntoSubfolders(surveyorApis, sharedAuthApis) };
const clientFolder = { name: 'Client', description: 'Only CLIENT role APIs. Get certificate_type_id from GET /certificates/types, vessel_id from Client Dashboard.', item: groupIntoSubfolders(clientApis) };
const flagAdminFolder = { name: 'Flag Admin', description: 'APIs FLAG_ADMIN can access', item: groupIntoSubfolders(sharedAuthApis) };

const collection = {
  info: {
    _postman_id: 'girik-full-role-collection',
    name: 'GIRIK BACKEND - Full Role-Based API Collection',
    description: 'Complete API collection with folders per role. Admin folder contains every API in subfolders by module. Use Authentication to login; token is saved.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{token}}', type: 'string' }] },
  variable: [
    { key: 'base_url', value: 'http://localhost:3000/api/v1', type: 'string' },
    { key: 'token', value: '', type: 'string' },
    { key: 'refresh_token', value: '', type: 'string' },
    { key: 'id', value: '', type: 'string' },
    { key: 'client_id', value: '', type: 'string' },
    { key: 'vessel_id', value: '', type: 'string' },
    { key: 'job_id', value: '', type: 'string' },
    { key: 'certificate_type_id', value: '', type: 'string', description: 'Run GET /certificates/types (Client folder) and copy id from response' },
    { key: 'surveyor_id', value: '', type: 'string' },
    { key: 'target_user_id', value: '', type: 'string' },
    { key: 'payment_id', value: '', type: 'string' },
  ],
  item: [
    authFolder,
    publicFolder,
    adminFolder,
    gmFolder,
    tmFolder,
    toFolder,
    taFolder,
    surveyorFolder,
    clientFolder,
    flagAdminFolder,
  ],
};

console.log(JSON.stringify(collection, null, 2));
