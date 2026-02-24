#!/usr/bin/env node
/**
 * Test all APIs of each module using a JWT token.
 * Usage: node scripts/test-all-apis.js [BASE_URL]
 * Example: node scripts/test-all-apis.js http://localhost:3000
 *
 * Set token via: TOKEN="your-jwt" node scripts/test-all-apis.js
 * Or paste token in TOKEN constant below.
 */

const TOKEN = process.env.TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAxOWM1MWUxLTMxNmMtNzI0NC1iOWZjLWIxZmEyYzEwOGZlZSIsInJvbGUiOiJBRE1JTiIsImVtYWlsIjoiYWRtaW5AZ21haWwuY29tIiwiaWF0IjoxNzcwOTUxMDgyLCJleHAiOjE3NzEwMzc0ODJ9.60r4xrgOlRU56hWcIG5QkCHY6FCHsJhpQSXvRp5iJK4';
const BASE_URL = process.env.BASE_URL || process.argv[2] || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1`;

// Placeholder IDs for routes that require :id, :jobId, etc.
const PID = '019c51e1-316c-7244-b9fc-b1fa2c108fee';
const JOB_ID = PID;
const CLIENT_ID = PID;

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TOKEN}`,
};

const FETCH_TIMEOUT_MS = 5000;

async function request(method, path, body = null) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const opts = { method, headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) };
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    opts.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_) { }
    return { status: res.status, ok: res.ok, data, text: text?.slice(0, 200) };
  } catch (err) {
    return { status: 0, ok: false, error: err.message };
  }
}

function summarize(result) {
  if (result.error) return `ERR: ${result.error}`;
  const s = result.status;
  if (s >= 200 && s < 300) return `${s} OK`;
  if (s === 400) return '400 Bad Request';
  if (s === 401) return '401 Unauthorized';
  if (s === 403) return '403 Forbidden';
  if (s === 404) return '404 Not Found';
  if (s >= 500) return `${s} Server Error`;
  return `${s}`;
}

async function runTests() {
  const results = [];
  const test = async (method, path, body, label) => {
    const result = await request(method, path, body);
    const summary = summarize(result);
    results.push({ method, path: path.replace(API_BASE, ''), label: label || path, summary, result });
    return result;
  };

  console.log('\n=== GIRIK Backend – API tests (Admin token) ===');
  console.log(`Base: ${API_BASE}\n`);

  // Health (no auth)
  await test('GET', '/health');

  // --- Public (no auth) ---
  await test('GET', '/public/certificate/verify/TEST-NUMBER');
  await test('GET', '/public/vessel/1234567');

  // --- Dashboard ---
  await test('GET', '/dashboard');

  // --- Clients ---
  await test('GET', '/clients');
  await test('GET', `/clients/${PID}`);

  // --- Vessels ---
  await test('GET', '/vessels');
  await test('GET', `/vessels/client/${CLIENT_ID}`);
  await test('GET', `/vessels/${PID}`);

  // --- Jobs ---
  await test('GET', '/jobs');
  await test('GET', `/jobs/${PID}`);
  await test('GET', `/jobs/${PID}/history`);
  await test('GET', `/jobs/${PID}/messages/external`);
  await test('GET', `/jobs/${PID}/messages/internal`);

  // --- Surveys ---
  await test('GET', '/surveys');
  await test('GET', `/surveys/${PID}/timeline`);

  // --- Certificates ---
  await test('GET', '/certificates/verify/TEST-NUM');
  await test('GET', '/certificates/types');
  await test('GET', '/certificates');
  await test('GET', '/certificates/expiring');
  await test('GET', `/certificates/job/${JOB_ID}`);
  await test('GET', `/certificates/${PID}`);
  await test('GET', `/certificates/${PID}/preview`);
  await test('GET', `/certificates/${PID}/signature`);
  await test('GET', `/certificates/${PID}/history`);

  // --- Payments ---
  await test('GET', '/payments');
  await test('GET', '/payments/summary');
  await test('GET', `/payments/${PID}`);
  await test('GET', `/payments/${PID}/ledger`);

  // --- Surveyors ---
  await test('GET', '/surveyors/applications');
  await test('GET', `/surveyors/${PID}/profile`);
  await test('GET', `/surveyors/${PID}/location-history`);

  // --- Checklists ---
  await test('GET', `/checklists/jobs/${JOB_ID}`);

  // --- Checklist templates ---
  await test('GET', '/checklist-templates');
  await test('GET', `/checklist-templates/job/${JOB_ID}`);
  await test('GET', `/checklist-templates/${PID}`);

  // --- Non-conformities ---
  await test('GET', `/non-conformities/job/${JOB_ID}`);

  // --- TOCA ---
  await test('GET', '/toca');

  // --- Flags ---
  await test('GET', '/flags');

  // --- Notifications ---
  await test('GET', '/notifications');

  // --- Users ---
  await test('GET', '/users/me');
  await test('GET', '/users');

  // --- Documents (entityType/entityId) ---
  await test('GET', `/documents/job/${JOB_ID}`);
  await test('GET', `/documents/vessel/${PID}`);
  await test('GET', `/documents/certificate/${PID}`);

  // --- System ---
  await test('GET', '/system/health');
  await test('GET', '/system/readiness');
  await test('GET', '/system/version');
  await test('GET', '/system/metrics');
  await test('GET', '/system/audit-logs');
  await test('GET', '/system/migrations');
  await test('GET', '/system/jobs/failed');
  await test('GET', '/system/feature-flags');
  await test('GET', '/system/locales');

  // --- Reports ---
  await test('GET', '/reports/certificates');
  await test('GET', '/reports/surveyors');
  await test('GET', '/reports/non-conformities');
  await test('GET', '/reports/financials');

  // --- Activity requests ---
  await test('GET', '/activity-requests');
  await test('GET', `/activity-requests/${PID}`);

  // --- Customer feedback ---
  await test('GET', '/customer-feedback');
  await test('GET', `/customer-feedback/job/${JOB_ID}`);

  // --- Change requests ---
  await test('GET', '/change-requests');

  // --- Certificate templates ---
  await test('GET', '/certificate-templates');
  await test('GET', `/certificate-templates/${PID}`);

  // --- Incidents ---
  await test('GET', '/incidents');
  await test('GET', `/incidents/${PID}`);

  // --- Support ---
  await test('GET', '/support');
  await test('GET', `/support/${PID}`);

  // --- Search ---
  await test('GET', '/search?q=test');

  // --- Compliance ---
  await test('GET', `/compliance/export/${PID}`);

  // --- Approvals (GET not in routes; list might be via different path - skip if no GET)
  // Approval routes only have POST and PUT - no GET list

  return results;
}

function printReport(results) {
  const byStatus = {};
  results.forEach((r) => {
    const s = r.summary;
    byStatus[s] = (byStatus[s] || 0) + 1;
  });

  console.log('--- Results by status ---');
  Object.entries(byStatus).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log('\n--- Per request ---\n');

  results.forEach((r) => {
    const path = r.path.startsWith('/') ? r.path : `/${r.path}`;
    console.log(`${r.method.padEnd(6)} ${path.padEnd(55)} ${r.summary}`);
  });

  const failed = results.filter((r) => r.result.status === 401 || r.result.status === 403);
  if (failed.length) {
    console.log('\n--- Auth failures (401/403) ---');
    failed.forEach((r) => console.log(`  ${r.method} ${r.path} => ${r.summary}`));
  }
}

runTests()
  .then(printReport)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
