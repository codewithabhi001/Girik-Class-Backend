/**
 * GR CLASS - Class & Statutory Survey Status Report Template
 * 
 * Generates a comprehensive, editable HTML report for a particular job/vessel
 * covering all survey, certificate, and compliance details.
 * 
 * Sections:
 *   1. Vessel Identification & Particulars
 *   2. Vessel Certificates (Class + Statutory)
 *   3. Current Survey Status (Classification + Statutory)
 *   4. Conditions of Class, Memorandas, Deficiencies, Non-Conformities
 *   5. PSC Performance
 *   6. Information to Ship Owners/Managers
 *   7. Survey History (Previous surveys with dates)
 *   8. Manual Notes
 * 
 * Usage:
 *   import { generateSurveyStatusReport } from './survey-status-report.template.js';
 *   const html = generateSurveyStatusReport(data);
 */

export function generateSurveyStatusReport(data = {}) {
  const {
    // Vessel Particulars
    vesselName = '',
    imoNumber = '',
    classNumber = '',
    callSign = '',
    flag = '',
    portOfRegistry = '',
    shipType = '',
    keelLayingDate = '',
    dateOfBuild = '',
    vesselEntryDate = '',
    classNotation = '',
    deadweight = '',
    grossTonnage = '',
    netTonnage = '',
    length = '',
    breadth = '',
    depth = '',
    radioArea = '',
    registeredOwner = '',
    ownerAddress = '',
    managementCompany = '',
    managementAddress = '',
    classStatus = 'ACTIVE',

    // Job Info
    jobNumber = '',
    jobType = '',
    surveyLocation = '',

    // Certificates
    classCertificates = [],
    statutoryCertificates = [],
    planApprovalCertificates = [],

    // Survey Status
    classificationSurveys = [],
    statutorySurveys = [],

    // Conditions of Class
    conditionsOfClass = [],
    nonConformities = [],

    // PSC Performance
    pscRecords = [],

    // Information to Owners
    ownerInformation = [],

    // Survey History
    surveyHistory = [],

    // Manual Notes
    manualNotes = '',

    // Report metadata
    printDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    preparedBy = '',
    reportVersion = '1.0',
  } = data;

  // Helper to group statutory certificates by convention
  function groupCertificatesByConvention(certs) {
    const groups = {};
    certs.forEach(cert => {
      const convention = cert.convention || 'OTHER';
      if (!groups[convention]) groups[convention] = [];
      groups[convention].push(cert);
    });
    return groups;
  }

  // Certificate status badge color
  function statusBadgeClass(status) {
    if (!status) return 'badge-na';
    const s = status.toUpperCase();
    if (s === 'VALID') return 'badge-valid';
    if (s === 'EXPIRED') return 'badge-expired';
    if (s === 'SUSPENDED') return 'badge-suspended';
    if (s === 'PENDING') return 'badge-pending';
    if (s === 'CONDITIONAL') return 'badge-conditional';
    return 'badge-na';
  }

  // Survey status indicator
  function surveyStatusClass(status) {
    if (!status) return 'status-na';
    const s = status.toUpperCase();
    if (s === 'COMPLETED' || s === 'DONE') return 'status-done';
    if (s === 'OVERDUE') return 'status-overdue';
    if (s === 'DUE' || s === 'WITHIN RANGE') return 'status-due';
    if (s === 'BEFORE RANGE') return 'status-before';
    return 'status-na';
  }

  const statutoryGroups = groupCertificatesByConvention(statutoryCertificates);

  // Build certificate rows
  const classCertRows = classCertificates.length > 0
    ? classCertificates.map(c => `
        <tr>
          <td class="cert-desc">${c.description || '—'}</td>
          <td class="mono">${c.code || '—'}</td>
          <td>${c.issuedDate || '—'}</td>
          <td>${c.validUntil || '—'}</td>
          <td><span class="cert-type-tag">${c.type || '—'}</span></td>
          <td><span class="badge ${statusBadgeClass(c.status)}">${c.status || '—'}</span></td>
        </tr>`).join('')
    : `<tr><td colspan="6" class="empty-state">No class certificates on record</td></tr>`;

  // Build statutory cert sections
  let statutoryCertSections = '';
  if (Object.keys(statutoryGroups).length > 0) {
    for (const [convention, certs] of Object.entries(statutoryGroups)) {
      statutoryCertSections += `
        <tr class="convention-header-row">
          <td colspan="6">${convention}</td>
        </tr>`;
      certs.forEach(c => {
        statutoryCertSections += `
          <tr>
            <td class="cert-desc">${c.description || '—'}</td>
            <td class="mono">${c.code || '—'}</td>
            <td>${c.issuedDate || '—'}</td>
            <td>${c.validUntil || '—'}</td>
            <td><span class="cert-type-tag">${c.type || '—'}</span></td>
            <td><span class="badge ${statusBadgeClass(c.status)}">${c.status || '—'}</span></td>
          </tr>`;
      });
    }
  } else {
    statutoryCertSections = `<tr><td colspan="6" class="empty-state">No statutory certificates on record</td></tr>`;
  }

  // Build survey status rows
  const classificationSurveyRows = classificationSurveys.length > 0
    ? classificationSurveys.map(s => `
        <tr>
          <td class="survey-desc">${s.description || '—'}</td>
          <td>${s.lastDate || '—'}</td>
          <td>${s.dueDate || '—'}</td>
          <td>${s.range || '—'}</td>
          <td>${s.postponementDate || '—'}</td>
          <td><span class="survey-status ${surveyStatusClass(s.status)}">${s.status || '—'}</span></td>
        </tr>`).join('')
    : `<tr><td colspan="6" class="empty-state">No classification surveys on record</td></tr>`;

  const statutorySurveyRows = statutorySurveys.length > 0
    ? statutorySurveys.map(s => `
        <tr>
          <td class="survey-desc">${s.description || '—'}</td>
          <td>${s.lastDate || '—'}</td>
          <td>${s.dueDate || '—'}</td>
          <td>${s.range || '—'}</td>
          <td>${s.postponementDate || '—'}</td>
          <td><span class="survey-status ${surveyStatusClass(s.status)}">${s.status || '—'}</span></td>
        </tr>`).join('')
    : `<tr><td colspan="6" class="empty-state">No statutory surveys on record</td></tr>`;

  // Build conditions of class rows
  const conditionRows = conditionsOfClass.length > 0
    ? conditionsOfClass.map(c => `
        <tr>
          <td class="mono">${c.requestNo || '—'}</td>
          <td>${c.description || '—'}</td>
          <td>${c.dueDate || '—'}</td>
          <td>${c.certificate || '—'}</td>
          <td><span class="badge ${statusBadgeClass(c.status)}">${c.status || '—'}</span></td>
        </tr>`).join('')
    : `<tr><td colspan="5" class="empty-state">No conditions of class on record</td></tr>`;

  // Build non-conformities rows
  const ncRows = nonConformities.length > 0
    ? nonConformities.map(nc => `
        <tr>
          <td class="mono">${nc.requestNo || '—'}</td>
          <td>${nc.observation || '—'}</td>
          <td>${nc.limitDate || '—'}</td>
          <td>${nc.certificate || '—'}</td>
          <td><span class="badge ${statusBadgeClass(nc.status)}">${nc.status || '—'}</span></td>
        </tr>`).join('')
    : `<tr><td colspan="5" class="empty-state">No non-conformities on record</td></tr>`;

  // Build PSC rows
  const pscRows = pscRecords.length > 0
    ? pscRecords.map(p => `
        <tr>
          <td class="mono">${p.docNo || '—'}</td>
          <td>${p.date || '—'}</td>
          <td>${p.portName || '—'}</td>
          <td>${p.mou || '—'}</td>
          <td class="center">${p.totalDeficiencies ?? '—'}</td>
          <td class="center"><span class="badge ${p.detained ? 'badge-expired' : 'badge-valid'}">${p.detained ? 'Yes' : 'No'}</span></td>
        </tr>`).join('')
    : `<tr><td colspan="6" class="empty-state">No PSC records on file</td></tr>`;

  // Build owner information rows
  const infoRows = ownerInformation.length > 0
    ? ownerInformation.map(info => `
        <tr>
          <td class="mono center">${info.number || '—'}</td>
          <td>${info.issueDate || '—'}</td>
          <td>${info.entryInForce || '—'}</td>
          <td class="info-desc">${info.description || '—'}</td>
        </tr>`).join('')
    : `<tr><td colspan="4" class="empty-state">No information items on record</td></tr>`;

  // Build survey history rows
  const historyRows = surveyHistory.length > 0
    ? surveyHistory.map(h => `
        <tr>
          <td>${h.surveyType || '—'}</td>
          <td>${h.surveyDate || '—'}</td>
          <td>${h.location || '—'}</td>
          <td>${h.surveyor || '—'}</td>
          <td>${h.findings || '—'}</td>
          <td><span class="badge ${statusBadgeClass(h.status)}">${h.status || '—'}</span></td>
        </tr>`).join('')
    : `<tr><td colspan="6" class="empty-state">No survey history on record</td></tr>`;

  // Plan approval rows
  const planApprovalRows = planApprovalCertificates.length > 0
    ? planApprovalCertificates.map(c => `
        <tr>
          <td class="cert-desc">${c.description || '—'}</td>
          <td class="mono">${c.code || '—'}</td>
          <td>${c.issuedDate || '—'}</td>
        </tr>`).join('')
    : `<tr><td colspan="3" class="empty-state">No plan approval certificates on record</td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GR Class – Survey Status Report – ${vesselName || 'Vessel'}</title>
  <meta name="description" content="Class and Statutory Survey Status Report for ${vesselName} (IMO ${imoNumber})">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    /* ═══════════════════════════════════════════════════════
       GR CLASS – SURVEY STATUS REPORT
       Premium Maritime Design System
    ═══════════════════════════════════════════════════════ */
    :root {
      /* Core Brand */
      --navy: #0B2443;
      --navy-deep: #071a33;
      --navy-light: #133c6d;
      --navy-surface: #0d2d52;
      --gold: #B5891F;
      --gold-light: #d4a94a;
      --gold-pale: #f5ecd4;
      --gold-glow: rgba(181, 137, 31, 0.15);

      /* Surfaces */
      --bg-page: #0a0f1a;
      --bg-report: #ffffff;
      --bg-section: #fafbfc;
      --bg-header-gradient: linear-gradient(135deg, #0B2443 0%, #133c6d 50%, #0B2443 100%);
      --bg-row-alt: #f8f9fb;
      --bg-row-hover: #eef3fa;
      
      /* Text */
      --text-primary: #0f172a;
      --text-secondary: #475569;
      --text-muted: #94a3b8;
      --text-white: #ffffff;
      --text-gold: #B5891F;
      
      /* Status Colors */
      --status-valid: #059669;
      --status-valid-bg: #ecfdf5;
      --status-expired: #dc2626;
      --status-expired-bg: #fef2f2;
      --status-pending: #d97706;
      --status-pending-bg: #fffbeb;
      --status-conditional: #2563eb;
      --status-conditional-bg: #eff6ff;
      --status-suspended: #7c3aed;
      --status-suspended-bg: #f5f3ff;
      --status-na: #64748b;
      --status-na-bg: #f1f5f9;

      /* Survey Status */
      --survey-done: #059669;
      --survey-due: #d97706;
      --survey-overdue: #dc2626;
      --survey-before: #2563eb;

      /* Borders & Shadows */
      --border-light: #e2e8f0;
      --border-medium: #cbd5e1;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
      --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
      --shadow-lg: 0 12px 40px rgba(0,0,0,0.12);
      --shadow-glow: 0 0 30px rgba(181, 137, 31, 0.1);

      /* Radius */
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 16px;
      --radius-xl: 20px;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg-page);
      color: var(--text-primary);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* ── TOOLBAR ── */
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(11, 36, 67, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(181, 137, 31, 0.3);
      padding: 12px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .toolbar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .toolbar-logo {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: var(--gold);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 14px;
      color: var(--navy);
    }
    .toolbar-title {
      color: var(--text-white);
      font-weight: 600;
      font-size: 15px;
      letter-spacing: 0.3px;
    }
    .toolbar-subtitle {
      color: var(--gold-light);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .toolbar-actions {
      display: flex;
      gap: 10px;
    }
    .btn {
      padding: 8px 18px;
      border: none;
      border-radius: var(--radius-sm);
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-primary {
      background: var(--gold);
      color: var(--navy);
    }
    .btn-primary:hover {
      background: var(--gold-light);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(181, 137, 31, 0.3);
    }
    .btn-outline {
      background: transparent;
      color: var(--text-white);
      border: 1px solid rgba(255,255,255,0.2);
    }
    .btn-outline:hover {
      background: rgba(255,255,255,0.1);
      border-color: rgba(255,255,255,0.4);
    }
    .btn-danger {
      background: transparent;
      color: #fca5a5;
      border: 1px solid rgba(252,165,165,0.3);
    }
    .btn-danger:hover {
      background: rgba(220,38,38,0.15);
    }

    /* ── REPORT CONTAINER ── */
    .report-container {
      max-width: 1100px;
      margin: 32px auto;
      padding: 0 24px 80px;
    }

    /* ── REPORT HEADER ── */
    .report-header {
      background: var(--bg-header-gradient);
      border-radius: var(--radius-xl);
      padding: 40px 48px;
      margin-bottom: 28px;
      position: relative;
      overflow: hidden;
      box-shadow: var(--shadow-lg), var(--shadow-glow);
    }
    .report-header::before {
      content: '';
      position: absolute;
      top: -60%;
      right: -20%;
      width: 500px;
      height: 500px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(181,137,31,0.08) 0%, transparent 70%);
      pointer-events: none;
    }
    .report-header::after {
      content: 'GR CLASS';
      position: absolute;
      bottom: -10px;
      right: 40px;
      font-size: 80px;
      font-weight: 900;
      color: rgba(255,255,255,0.03);
      letter-spacing: 5px;
      pointer-events: none;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
      position: relative;
      z-index: 1;
    }
    .header-brand {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .header-logo {
      width: 60px;
      height: 60px;
      border-radius: 14px;
      background: rgba(255,255,255,0.1);
      border: 2px solid var(--gold);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 22px;
      color: var(--gold);
      backdrop-filter: blur(10px);
    }
    .header-org {
      display: flex;
      flex-direction: column;
    }
    .header-org-name {
      font-size: 20px;
      font-weight: 800;
      color: var(--text-white);
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .header-org-sub {
      font-size: 11px;
      color: var(--gold-light);
      letter-spacing: 2px;
      text-transform: uppercase;
      font-weight: 500;
    }
    .header-meta {
      text-align: right;
      color: rgba(255,255,255,0.7);
      font-size: 12px;
    }
    .header-meta-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: rgba(255,255,255,0.4);
      margin-bottom: 2px;
    }
    .header-meta-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 600;
      color: var(--gold-light);
    }
    .report-title-area {
      position: relative;
      z-index: 1;
    }
    .report-title {
      font-size: 28px;
      font-weight: 800;
      color: var(--text-white);
      margin-bottom: 4px;
      letter-spacing: 0.5px;
    }
    .report-subtitle {
      font-size: 14px;
      color: rgba(255,255,255,0.6);
      font-weight: 400;
    }
    .vessel-hero {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-top: 24px;
      position: relative;
      z-index: 1;
    }
    .vessel-name-big {
      font-size: 36px;
      font-weight: 900;
      color: var(--text-white);
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .vessel-flag-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-white);
    }
    .vessel-class-status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .class-active {
      background: rgba(5, 150, 105, 0.2);
      color: #6ee7b7;
      border: 1px solid rgba(5, 150, 105, 0.3);
    }
    .class-suspended {
      background: rgba(220, 38, 38, 0.2);
      color: #fca5a5;
      border: 1px solid rgba(220, 38, 38, 0.3);
    }

    /* ── KEY METRICS ROW ── */
    .metrics-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 28px;
    }
    .metric-card {
      background: var(--bg-report);
      border-radius: var(--radius-md);
      padding: 20px 24px;
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--border-light);
      position: relative;
      overflow: hidden;
      transition: all 0.2s ease;
    }
    .metric-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }
    .metric-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
    }
    .metric-card:nth-child(1)::before { background: var(--navy); }
    .metric-card:nth-child(2)::before { background: var(--gold); }
    .metric-card:nth-child(3)::before { background: var(--status-valid); }
    .metric-card:nth-child(4)::before { background: var(--status-conditional); }
    .metric-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .metric-value {
      font-size: 28px;
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1;
    }
    .metric-sub {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    /* ── SECTION CARDS ── */
    .section-card {
      background: var(--bg-report);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--border-light);
      margin-bottom: 24px;
      overflow: hidden;
      transition: box-shadow 0.2s ease;
    }
    .section-card:hover {
      box-shadow: var(--shadow-md);
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 28px;
      background: var(--bg-section);
      border-bottom: 1px solid var(--border-light);
      cursor: pointer;
      user-select: none;
    }
    .section-header:hover {
      background: #f1f5f9;
    }
    .section-header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .section-number {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--navy);
      color: var(--gold);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 14px;
      flex-shrink: 0;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: 0.2px;
    }
    .section-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 12px;
      background: var(--gold-pale);
      color: var(--gold);
    }
    .section-toggle {
      font-size: 18px;
      color: var(--text-muted);
      transition: transform 0.3s ease;
    }
    .section-body {
      padding: 24px 28px;
    }

    /* ── DATA TABLES ── */
    .data-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 13px;
    }
    .data-table thead th {
      background: #f1f5f9;
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 12px 16px;
      border-bottom: 2px solid var(--border-light);
      text-align: left;
      white-space: nowrap;
      position: sticky;
      top: 0;
    }
    .data-table thead th:first-child {
      border-radius: var(--radius-sm) 0 0 0;
    }
    .data-table thead th:last-child {
      border-radius: 0 var(--radius-sm) 0 0;
    }
    .data-table tbody td {
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
      color: var(--text-primary);
      vertical-align: middle;
    }
    .data-table tbody tr:nth-child(even) {
      background: var(--bg-row-alt);
    }
    .data-table tbody tr:hover {
      background: var(--bg-row-hover);
    }
    .data-table tbody tr:last-child td {
      border-bottom: none;
    }

    /* Convention header rows */
    .convention-header-row td {
      background: #eef3fa !important;
      font-weight: 700;
      color: var(--navy);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 16px !important;
      border-left: 3px solid var(--gold);
    }

    /* Cell types */
    .cert-desc { font-weight: 500; max-width: 280px; }
    .survey-desc { font-weight: 500; max-width: 300px; }
    .info-desc { font-size: 12px; line-height: 1.5; max-width: 500px; }
    .mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; }
    .center { text-align: center; }
    .empty-state {
      text-align: center;
      color: var(--text-muted);
      font-style: italic;
      padding: 24px !important;
      font-size: 13px;
    }

    /* ── BADGES ── */
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.3px;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .badge-valid { background: var(--status-valid-bg); color: var(--status-valid); }
    .badge-expired { background: var(--status-expired-bg); color: var(--status-expired); }
    .badge-pending { background: var(--status-pending-bg); color: var(--status-pending); }
    .badge-conditional { background: var(--status-conditional-bg); color: var(--status-conditional); }
    .badge-suspended { background: var(--status-suspended-bg); color: var(--status-suspended); }
    .badge-na { background: var(--status-na-bg); color: var(--status-na); }

    .cert-type-tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      background: #f1f5f9;
      color: var(--text-secondary);
      letter-spacing: 0.5px;
    }

    /* ── SURVEY STATUS INDICATORS ── */
    .survey-status {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .survey-status::before {
      content: '';
      width: 7px;
      height: 7px;
      border-radius: 50%;
    }
    .status-done { color: var(--survey-done); background: var(--status-valid-bg); }
    .status-done::before { background: var(--survey-done); }
    .status-due { color: var(--survey-due); background: var(--status-pending-bg); }
    .status-due::before { background: var(--survey-due); }
    .status-overdue { color: var(--survey-overdue); background: var(--status-expired-bg); }
    .status-overdue::before { background: var(--survey-overdue); animation: pulse-dot 1.5s infinite; }
    .status-before { color: var(--survey-before); background: var(--status-conditional-bg); }
    .status-before::before { background: var(--survey-before); }
    .status-na { color: var(--status-na); background: var(--status-na-bg); }
    .status-na::before { background: var(--status-na); }

    @keyframes pulse-dot {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    /* ── VESSEL PARTICULARS GRID ── */
    .particulars-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .particular-item {
      padding: 14px 18px;
      background: var(--bg-section);
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-light);
      transition: all 0.15s ease;
    }
    .particular-item:hover {
      border-color: var(--gold);
      background: var(--gold-glow);
    }
    .particular-label {
      font-size: 10px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 4px;
    }
    .particular-value {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
    }
    .particular-value.mono-val {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
    }
    .particular-full {
      grid-column: 1 / -1;
    }
    .particular-half {
      grid-column: span 2;
    }

    /* Owner/Manager cards */
    .stakeholder-cards {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-top: 16px;
    }
    .stakeholder-card {
      padding: 18px 22px;
      background: linear-gradient(135deg, var(--bg-section) 0%, #ffffff 100%);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-light);
      border-left: 3px solid var(--navy);
    }
    .stakeholder-role {
      font-size: 10px;
      font-weight: 700;
      color: var(--gold);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    .stakeholder-name {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 4px;
    }
    .stakeholder-address {
      font-size: 12px;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    /* ── SURVEY STATUS LEGEND ── */
    .status-legend {
      display: flex;
      gap: 20px;
      padding: 14px 20px;
      background: var(--bg-section);
      border-radius: var(--radius-sm);
      margin-top: 16px;
      border: 1px solid var(--border-light);
      flex-wrap: wrap;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: var(--text-secondary);
      font-weight: 500;
    }
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    /* ── MANUAL NOTES ── */
    .notes-area {
      width: 100%;
      min-height: 200px;
      padding: 18px 22px;
      border: 2px dashed var(--border-medium);
      border-radius: var(--radius-md);
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      line-height: 1.7;
      color: var(--text-primary);
      background: var(--bg-section);
      resize: vertical;
      transition: border-color 0.2s ease;
      outline: none;
    }
    .notes-area:focus {
      border-color: var(--gold);
      background: var(--bg-report);
      box-shadow: 0 0 0 3px var(--gold-glow);
    }
    .notes-area::placeholder {
      color: var(--text-muted);
      font-style: italic;
    }

    /* ── DISCLAIMER ── */
    .report-disclaimer {
      background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
      border: 1px solid #fde68a;
      border-radius: var(--radius-md);
      padding: 18px 24px;
      margin-bottom: 24px;
    }
    .disclaimer-title {
      font-size: 12px;
      font-weight: 700;
      color: #92400e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .disclaimer-text {
      font-size: 12px;
      color: #78350f;
      line-height: 1.5;
    }

    /* ── FOOTER ── */
    .report-footer {
      background: var(--bg-report);
      border-radius: var(--radius-lg);
      padding: 24px 28px;
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--border-light);
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
    }
    .footer-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .footer-label {
      font-size: 10px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .footer-value {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
    }
    .footer-brand {
      text-align: right;
    }
    .footer-brand-name {
      font-size: 16px;
      font-weight: 800;
      color: var(--navy);
      letter-spacing: 1px;
    }
    .footer-brand-sub {
      font-size: 10px;
      color: var(--text-muted);
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }

    /* ── EDITABLE HIGHLIGHTS ── */
    [contenteditable="true"] {
      outline: none;
      border-radius: 3px;
      transition: background 0.2s ease, box-shadow 0.2s ease;
      padding: 1px 4px;
      margin: -1px -4px;
    }
    [contenteditable="true"]:hover {
      background: rgba(181, 137, 31, 0.06);
    }
    [contenteditable="true"]:focus {
      background: rgba(181, 137, 31, 0.1);
      box-shadow: 0 0 0 2px var(--gold-glow);
    }

    /* ── PRINT STYLES ── */
    @page {
      size: A4;
      margin: 12mm;
    }
    @media print {
      body {
        background: #fff !important;
        color: #000;
      }
      .toolbar { display: none !important; }
      .report-container {
        max-width: none;
        margin: 0;
        padding: 0;
      }
      .report-header {
        background: #0B2443 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        border-radius: 0;
        margin-bottom: 16px;
        padding: 24px 32px;
      }
      .section-card {
        break-inside: avoid;
        box-shadow: none;
        border: 1px solid #ddd;
        border-radius: 4px;
        margin-bottom: 12px;
      }
      .metric-card {
        box-shadow: none;
        border: 1px solid #ddd;
      }
      .notes-area {
        border: 1px solid #ccc;
      }
      .report-footer {
        box-shadow: none;
        border: 1px solid #ddd;
      }
      [contenteditable] {
        background: transparent !important;
        box-shadow: none !important;
      }
    }

    /* ── RESPONSIVE ── */
    @media (max-width: 768px) {
      .metrics-row { grid-template-columns: repeat(2, 1fr); }
      .particulars-grid { grid-template-columns: 1fr; }
      .stakeholder-cards { grid-template-columns: 1fr; }
      .report-header { padding: 24px; }
      .vessel-name-big { font-size: 24px; }
      .header-logo { width: 44px; height: 44px; font-size: 18px; }
      .toolbar { padding: 10px 16px; }
      .report-container { padding: 0 12px 40px; }
      .section-body { padding: 16px; }
      .data-table { font-size: 12px; }
      .data-table thead th, .data-table tbody td { padding: 8px 10px; }
      .vessel-hero { flex-wrap: wrap; }
      .status-legend { flex-direction: column; gap: 8px; }
    }

    /* ── ANIMATIONS ── */
    .section-card {
      animation: slideUp 0.4s ease forwards;
      opacity: 0;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .section-card:nth-child(1) { animation-delay: 0.05s; }
    .section-card:nth-child(2) { animation-delay: 0.1s; }
    .section-card:nth-child(3) { animation-delay: 0.15s; }
    .section-card:nth-child(4) { animation-delay: 0.2s; }
    .section-card:nth-child(5) { animation-delay: 0.25s; }
    .section-card:nth-child(6) { animation-delay: 0.3s; }
    .section-card:nth-child(7) { animation-delay: 0.35s; }
    .section-card:nth-child(8) { animation-delay: 0.4s; }
    .metric-card {
      animation: slideUp 0.3s ease forwards;
      opacity: 0;
    }
    .metric-card:nth-child(1) { animation-delay: 0.05s; }
    .metric-card:nth-child(2) { animation-delay: 0.1s; }
    .metric-card:nth-child(3) { animation-delay: 0.15s; }
    .metric-card:nth-child(4) { animation-delay: 0.2s; }
  </style>
</head>
<body>

  <!-- ═══════ TOOLBAR ═══════ -->
  <div class="toolbar" id="toolbar">
    <div class="toolbar-brand">
      <div class="toolbar-logo">GR</div>
      <div>
        <div class="toolbar-title">Survey Status Report</div>
        <div class="toolbar-subtitle">Class & Statutory</div>
      </div>
    </div>
    <div class="toolbar-actions">
      <button class="btn btn-outline" onclick="toggleAllSections()" id="toggleAllBtn">
        <span>📂</span> Collapse All
      </button>
      <button class="btn btn-outline" onclick="exportReport()">
        <span>📋</span> Copy Report
      </button>
      <button class="btn btn-primary" onclick="window.print()">
        <span>🖨</span> Print / PDF
      </button>
    </div>
  </div>

  <div class="report-container">

    <!-- ═══════ DISCLAIMER ═══════ -->
    <div class="report-disclaimer">
      <div class="disclaimer-title">⚠️ Disclaimer</div>
      <div class="disclaimer-text">
        This report has been produced from GR CLASS survey manager and is subject to errors and changes 
        that may occur outside the GR CLASS survey manager application. GR CLASS assumes no responsibility 
        for errors or actions taken based on the information herein. All editable fields are marked with 
        a subtle highlight on hover.
      </div>
    </div>

    <!-- ═══════ REPORT HEADER ═══════ -->
    <div class="report-header">
      <div class="header-top">
        <div class="header-brand">
          <div class="header-logo">GR</div>
          <div class="header-org">
            <div class="header-org-name">GR CLASS</div>
            <div class="header-org-sub">Classified for Standard</div>
          </div>
        </div>
        <div class="header-meta">
          <div>
            <div class="header-meta-label">Report Date</div>
            <div class="header-meta-value">${printDate}</div>
          </div>
          <div style="margin-top: 10px;">
            <div class="header-meta-label">${jobNumber ? 'Job No.' : 'Class No.'}</div>
            <div class="header-meta-value">${jobNumber || classNumber || '—'}</div>
          </div>
        </div>
      </div>
      <div class="report-title-area">
        <div class="report-title">Class & Statutory Survey Status Report</div>
        <div class="report-subtitle">${jobType ? `Job Type: ${jobType}` : 'Complete survey and certificate overview for the vessel below'}</div>
      </div>
      <div class="vessel-hero">
        <div class="vessel-name-big" contenteditable="true">${vesselName || 'VESSEL NAME'}</div>
        <div class="vessel-flag-tag">🏳️ <span contenteditable="true">${flag || 'FLAG'}</span></div>
        <div class="vessel-class-status ${classStatus === 'ACTIVE' ? 'class-active' : 'class-suspended'}">
          <span>●</span> ${classStatus}
        </div>
      </div>
    </div>

    <!-- ═══════ KEY METRICS ═══════ -->
    <div class="metrics-row">
      <div class="metric-card">
        <div class="metric-label">IMO Number</div>
        <div class="metric-value mono" contenteditable="true">${imoNumber || '—'}</div>
        <div class="metric-sub">Vessel Identification</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Class Number</div>
        <div class="metric-value mono" contenteditable="true">${classNumber || '—'}</div>
        <div class="metric-sub">GR CLASS Registration</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Gross Tonnage</div>
        <div class="metric-value" contenteditable="true">${grossTonnage || '—'}</div>
        <div class="metric-sub">GT</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Deadweight</div>
        <div class="metric-value" contenteditable="true">${deadweight || '—'}</div>
        <div class="metric-sub">DWT</div>
      </div>
    </div>

    <!-- ═══════ SECTION 1: VESSEL PARTICULARS ═══════ -->
    <div class="section-card" id="section-1">
      <div class="section-header" onclick="toggleSection('section-1')">
        <div class="section-header-left">
          <div class="section-number">1</div>
          <div class="section-title">Vessel Identification & Particulars</div>
        </div>
        <div class="section-toggle">▼</div>
      </div>
      <div class="section-body">
        <div class="particulars-grid">
          <div class="particular-item">
            <div class="particular-label">Name of Ship</div>
            <div class="particular-value" contenteditable="true">${vesselName || '—'}</div>
          </div>
          <div class="particular-item">
            <div class="particular-label">IMO No.</div>
            <div class="particular-value mono-val" contenteditable="true">${imoNumber || '—'}</div>
          </div>
          <div class="particular-item">
            <div class="particular-label">Call Sign</div>
            <div class="particular-value mono-val" contenteditable="true">${callSign || '—'}</div>
          </div>
          <div class="particular-item">
            <div class="particular-label">Flag</div>
            <div class="particular-value" contenteditable="true">${flag || '—'}</div>
          </div>
          <div class="particular-item">
            <div class="particular-label">Port of Registry</div>
            <div class="particular-value" contenteditable="true">${portOfRegistry || '—'}</div>
          </div>
          <div class="particular-item">
            <div class="particular-label">Type of Ship</div>
            <div class="particular-value" contenteditable="true">${shipType || '—'}</div>
          </div>
          <div class="particular-item">
            <div class="particular-label">Keel Laying Date</div>
            <div class="particular-value" contenteditable="true">${keelLayingDate || '—'}</div>
          </div>
          <div class="particular-item">
            <div class="particular-label">Date of Build</div>
            <div class="particular-value" contenteditable="true">${dateOfBuild || '—'}</div>
          </div>
          <div class="particular-item">
            <div class="particular-label">Vessel Entry Date</div>
            <div class="particular-value" contenteditable="true">${vesselEntryDate || '—'}</div>
          </div>
          <div class="particular-item">
            <div class="particular-label">Class Notation</div>
            <div class="particular-value" contenteditable="true">${classNotation || '—'}</div>
          </div>
          <div class="particular-item">
            <div class="particular-label">Deadweight</div>
            <div class="particular-value" contenteditable="true">${deadweight || '—'}</div>
          </div>
          <div class="particular-item">
            <div class="particular-label">Gross Tonnage (GT)</div>
            <div class="particular-value" contenteditable="true">${grossTonnage || '—'}</div>
          </div>
          <div class="particular-item">
            <div class="particular-label">Net Tonnage (NT)</div>
            <div class="particular-value" contenteditable="true">${netTonnage || '—'}</div>
          </div>
          <div class="particular-item">
            <div class="particular-label">Length</div>
            <div class="particular-value" contenteditable="true">${length || '—'}</div>
          </div>
          <div class="particular-item">
            <div class="particular-label">Breadth</div>
            <div class="particular-value" contenteditable="true">${breadth || '—'}</div>
          </div>
          <div class="particular-item">
            <div class="particular-label">Depth</div>
            <div class="particular-value" contenteditable="true">${depth || '—'}</div>
          </div>
          <div class="particular-item">
            <div class="particular-label">Radio Installations Area</div>
            <div class="particular-value" contenteditable="true">${radioArea || '—'}</div>
          </div>
          <div class="particular-item">
            <div class="particular-label">Class/Statutory Status</div>
            <div class="particular-value">
              <span class="badge ${classStatus === 'ACTIVE' ? 'badge-valid' : 'badge-expired'}">${classStatus}</span>
            </div>
          </div>
        </div>

        <div class="stakeholder-cards">
          <div class="stakeholder-card">
            <div class="stakeholder-role">Registered Owner</div>
            <div class="stakeholder-name" contenteditable="true">${registeredOwner || '—'}</div>
            <div class="stakeholder-address" contenteditable="true">${ownerAddress || '—'}</div>
          </div>
          <div class="stakeholder-card">
            <div class="stakeholder-role">Management Company</div>
            <div class="stakeholder-name" contenteditable="true">${managementCompany || '—'}</div>
            <div class="stakeholder-address" contenteditable="true">${managementAddress || '—'}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════ SECTION 2: VESSEL CERTIFICATES ═══════ -->
    <div class="section-card" id="section-2">
      <div class="section-header" onclick="toggleSection('section-2')">
        <div class="section-header-left">
          <div class="section-number">2</div>
          <div class="section-title">Vessel Certificates</div>
        </div>
        <div class="section-badge">${classCertificates.length + statutoryCertificates.length} Certificates</div>
        <div class="section-toggle">▼</div>
      </div>
      <div class="section-body">
        <!-- Class Certificates -->
        <h3 style="font-size: 14px; font-weight: 700; color: var(--navy); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <span style="width: 4px; height: 16px; background: var(--gold); border-radius: 2px; display: inline-block;"></span>
          Class Certificates
        </h3>
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Certificate Description</th>
                <th>Code</th>
                <th>Issued</th>
                <th>Valid Until</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${classCertRows}
            </tbody>
          </table>
        </div>

        <!-- Statutory Certificates -->
        <h3 style="font-size: 14px; font-weight: 700; color: var(--navy); margin: 28px 0 12px; display: flex; align-items: center; gap: 8px;">
          <span style="width: 4px; height: 16px; background: var(--gold); border-radius: 2px; display: inline-block;"></span>
          Statutory Certificates
        </h3>
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Certificate Description</th>
                <th>Code</th>
                <th>Issued</th>
                <th>Valid Until</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${statutoryCertSections}
            </tbody>
          </table>
        </div>

        <!-- Plan Approval Certificates -->
        <h3 style="font-size: 14px; font-weight: 700; color: var(--navy); margin: 28px 0 12px; display: flex; align-items: center; gap: 8px;">
          <span style="width: 4px; height: 16px; background: var(--gold); border-radius: 2px; display: inline-block;"></span>
          Plan Approval Certificates
        </h3>
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Certificate Description</th>
                <th>Code</th>
                <th>Issued</th>
              </tr>
            </thead>
            <tbody>
              ${planApprovalRows}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ═══════ SECTION 3: CURRENT SURVEY STATUS ═══════ -->
    <div class="section-card" id="section-3">
      <div class="section-header" onclick="toggleSection('section-3')">
        <div class="section-header-left">
          <div class="section-number">3</div>
          <div class="section-title">Current Survey Status</div>
        </div>
        <div class="section-badge">${classificationSurveys.length + statutorySurveys.length} Surveys</div>
        <div class="section-toggle">▼</div>
      </div>
      <div class="section-body">
        <!-- Classification Surveys -->
        <h3 style="font-size: 14px; font-weight: 700; color: var(--navy); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <span style="width: 4px; height: 16px; background: var(--gold); border-radius: 2px; display: inline-block;"></span>
          Classification Surveys
        </h3>
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Survey Description</th>
                <th>Last Date</th>
                <th>Due Date</th>
                <th>Range</th>
                <th>Postponement Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${classificationSurveyRows}
            </tbody>
          </table>
        </div>

        <!-- Statutory Surveys -->
        <h3 style="font-size: 14px; font-weight: 700; color: var(--navy); margin: 28px 0 12px; display: flex; align-items: center; gap: 8px;">
          <span style="width: 4px; height: 16px; background: var(--gold); border-radius: 2px; display: inline-block;"></span>
          Statutory Surveys
        </h3>
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Survey Description</th>
                <th>Last Date</th>
                <th>Due Date</th>
                <th>Range</th>
                <th>Postponement Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${statutorySurveyRows}
            </tbody>
          </table>
        </div>

        <!-- Survey Status Legend -->
        <div class="status-legend">
          <div class="legend-item"><div class="legend-dot" style="background: var(--survey-before);"></div> Before Range of Surveys</div>
          <div class="legend-item"><div class="legend-dot" style="background: var(--survey-due);"></div> Within Range of Surveys</div>
          <div class="legend-item"><div class="legend-dot" style="background: var(--survey-overdue);"></div> Overdue / After Range</div>
          <div class="legend-item"><div class="legend-dot" style="background: var(--survey-done);"></div> Completed</div>
          <div class="legend-item"><div class="legend-dot" style="background: var(--status-na);"></div> N/A</div>
        </div>
      </div>
    </div>

    <!-- ═══════ SECTION 4: CONDITIONS OF CLASS ═══════ -->
    <div class="section-card" id="section-4">
      <div class="section-header" onclick="toggleSection('section-4')">
        <div class="section-header-left">
          <div class="section-number">4</div>
          <div class="section-title">Conditions of Class, Memorandas, Deficiencies & Non-Conformities</div>
        </div>
        <div class="section-toggle">▼</div>
      </div>
      <div class="section-body">
        <!-- Conditions of Class -->
        <h3 style="font-size: 14px; font-weight: 700; color: var(--navy); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <span style="width: 4px; height: 16px; background: var(--gold); border-radius: 2px; display: inline-block;"></span>
          Conditions of Class / Deficiencies / Memoranda to Owners
        </h3>
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Request No.</th>
                <th>Condition / Deficiency / Memo</th>
                <th>Due Date</th>
                <th>Class/Statutory Certificate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${conditionRows}
            </tbody>
          </table>
        </div>

        <!-- Non-Conformities -->
        <h3 style="font-size: 14px; font-weight: 700; color: var(--navy); margin: 28px 0 12px; display: flex; align-items: center; gap: 8px;">
          <span style="width: 4px; height: 16px; background: var(--gold); border-radius: 2px; display: inline-block;"></span>
          Non-Conformities / Observations
        </h3>
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Request No.</th>
                <th>NC / Observation</th>
                <th>Limit Date</th>
                <th>Statutory Certificate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${ncRows}
            </tbody>
          </table>
        </div>

        <!-- Legend for conditions -->
        <div class="status-legend">
          <div class="legend-item"><div class="legend-dot" style="background: var(--survey-before);"></div> More than 3 months before due date</div>
          <div class="legend-item"><div class="legend-dot" style="background: var(--survey-due);"></div> 1 month before due date</div>
          <div class="legend-item"><div class="legend-dot" style="background: var(--survey-overdue);"></div> Condition or deficiency duly expired</div>
        </div>
      </div>
    </div>

    <!-- ═══════ SECTION 5: PSC PERFORMANCE ═══════ -->
    <div class="section-card" id="section-5">
      <div class="section-header" onclick="toggleSection('section-5')">
        <div class="section-header-left">
          <div class="section-number">5</div>
          <div class="section-title">PSC Performance</div>
        </div>
        <div class="section-badge">${pscRecords.length} Records</div>
        <div class="section-toggle">▼</div>
      </div>
      <div class="section-body">
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Doc. No.</th>
                <th>Date</th>
                <th>Port Name</th>
                <th>MOU</th>
                <th>Total Deficiencies</th>
                <th>Vessel Detained</th>
              </tr>
            </thead>
            <tbody>
              ${pscRows}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ═══════ SECTION 6: INFORMATION TO OWNERS ═══════ -->
    <div class="section-card" id="section-6">
      <div class="section-header" onclick="toggleSection('section-6')">
        <div class="section-header-left">
          <div class="section-number">6</div>
          <div class="section-title">Information to Ship Owners / Managers</div>
        </div>
        <div class="section-badge">${ownerInformation.length} Items</div>
        <div class="section-toggle">▼</div>
      </div>
      <div class="section-body">
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 70px;">No.</th>
                <th style="width: 110px;">Issue Date</th>
                <th style="width: 110px;">Entry in Force</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${infoRows}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ═══════ SECTION 7: SURVEY HISTORY ═══════ -->
    <div class="section-card" id="section-7">
      <div class="section-header" onclick="toggleSection('section-7')">
        <div class="section-header-left">
          <div class="section-number">7</div>
          <div class="section-title">Survey History</div>
        </div>
        <div class="section-badge">${surveyHistory.length} Records</div>
        <div class="section-toggle">▼</div>
      </div>
      <div class="section-body">
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Survey Type</th>
                <th>Survey Date</th>
                <th>Location</th>
                <th>Surveyor</th>
                <th>Findings</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${historyRows}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ═══════ SECTION 8: MANUAL NOTES ═══════ -->
    <div class="section-card" id="section-8">
      <div class="section-header" onclick="toggleSection('section-8')">
        <div class="section-header-left">
          <div class="section-number">8</div>
          <div class="section-title">Manual Notes & Remarks</div>
        </div>
        <div class="section-toggle">▼</div>
      </div>
      <div class="section-body">
        <textarea class="notes-area" placeholder="Add manual notes, remarks, or observations here...&#10;&#10;Examples:&#10;• Vessel condition observations&#10;• Surveyor recommendations&#10;• Follow-up actions required&#10;• Additional documentation needed">${manualNotes}</textarea>
      </div>
    </div>

    <!-- ═══════ FOOTER ═══════ -->
    <div class="report-footer">
      <div style="display: flex; gap: 40px;">
        <div class="footer-info">
          <div class="footer-label">Printout Date</div>
          <div class="footer-value">${printDate}</div>
        </div>
        <div class="footer-info">
          <div class="footer-label">Prepared By</div>
          <div class="footer-value" contenteditable="true">${preparedBy || 'GR CLASS Operations'}</div>
        </div>
        <div class="footer-info">
          <div class="footer-label">Version</div>
          <div class="footer-value">${reportVersion}</div>
        </div>
      </div>
      <div class="footer-brand">
        <div class="footer-brand-name">GR CLASS</div>
        <div class="footer-brand-sub">Classified for Standard</div>
      </div>
    </div>

  </div>

  <script>
    // ── Section Toggle ──
    function toggleSection(sectionId) {
      const section = document.getElementById(sectionId);
      const body = section.querySelector('.section-body');
      const toggle = section.querySelector('.section-toggle');
      
      if (body.style.display === 'none') {
        body.style.display = 'block';
        toggle.textContent = '▼';
        toggle.style.transform = 'rotate(0deg)';
      } else {
        body.style.display = 'none';
        toggle.textContent = '▶';
        toggle.style.transform = 'rotate(0deg)';
      }
    }

    // ── Toggle All Sections ──
    let allExpanded = true;
    function toggleAllSections() {
      const sections = document.querySelectorAll('.section-card');
      const btn = document.getElementById('toggleAllBtn');
      allExpanded = !allExpanded;
      
      sections.forEach(section => {
        const body = section.querySelector('.section-body');
        const toggle = section.querySelector('.section-toggle');
        if (allExpanded) {
          body.style.display = 'block';
          toggle.textContent = '▼';
        } else {
          body.style.display = 'none';
          toggle.textContent = '▶';
        }
      });
      
      btn.innerHTML = allExpanded 
        ? '<span>📂</span> Collapse All' 
        : '<span>📂</span> Expand All';
    }

    // ── Export Report ──
    function exportReport() {
      const content = document.querySelector('.report-container').innerText;
      navigator.clipboard.writeText(content).then(() => {
        const btn = event.target.closest('.btn');
        const original = btn.innerHTML;
        btn.innerHTML = '<span>✅</span> Copied!';
        setTimeout(() => btn.innerHTML = original, 2000);
      });
    }

    // ── Auto-save notes to localStorage ──
    const notesArea = document.querySelector('.notes-area');
    if (notesArea) {
      const storageKey = 'grclass-survey-notes-' + '${imoNumber || "default"}';
      const saved = localStorage.getItem(storageKey);
      if (saved && !notesArea.value) {
        notesArea.value = saved;
      }
      notesArea.addEventListener('input', function() {
        localStorage.setItem(storageKey, this.value);
      });
    }
  </script>

</body>
</html>`;
}


/**
 * Generate a standalone HTML preview file with sample data 
 * matching the OMCS/ENABLE PDF format
 */
export function generateSampleReport() {
  return generateSurveyStatusReport({
    vesselName: 'ENABLE',
    imoNumber: '9246891',
    classNumber: '0026891',
    callSign: '3E6099',
    flag: 'PANAMA',
    portOfRegistry: 'PANAMA',
    shipType: 'BULK CARRIER',
    keelLayingDate: '28-07-2000',
    dateOfBuild: '17-04-2001',
    vesselEntryDate: '27-09-2025',
    classNotation: '',
    deadweight: '48910',
    grossTonnage: '27198',
    netTonnage: '15365',
    length: '187.500 Meter',
    breadth: '31.000 Meter',
    depth: '16.750 Meter',
    radioArea: 'Area A1+A2+A3',
    registeredOwner: 'Cassini Shipping Services LLC',
    ownerAddress: 'Office 29, Al Khabaisi Street, Dubai, United Arab Emirates',
    managementCompany: 'TOTAL VSV SHIPPING SERVICES LLC-FZ',
    managementAddress: 'Office 1314-1315, Level 13, Burjuman Business Tower, Al-Mankhool Road, Dubai, United Arab Emirates',
    classStatus: 'ACTIVE',
    jobNumber: 'GRJ-BCF604',
    jobType: 'Classification Survey',
    printDate: '16/06/2026',

    classCertificates: [
      { description: 'Hull & Machinery', code: 'H22879', issuedDate: '26-04-2026', validUntil: '17-07-2026', type: 'COND', status: 'VALID' },
    ],

    statutoryCertificates: [
      { convention: 'LOAD LINE & TONNAGE CONVENTIONS', description: 'International Load Line Certificate', code: 'LL22879', issuedDate: '26-04-2026', validUntil: '17-07-2026', type: 'COND', status: 'VALID' },
      { convention: 'LOAD LINE & TONNAGE CONVENTIONS', description: 'International Tonnage Certificate', code: 'ITC22122', issuedDate: '09-02-2026', validUntil: '06-07-2026', type: 'ST', status: 'VALID' },
      { convention: 'IMO CODES', description: 'Certificate of Compliance with IMSBC CODE', code: 'IMSBC22122', issuedDate: '09-02-2026', validUntil: '06-07-2026', type: 'ST', status: 'VALID' },
      { convention: 'SOLAS CONVENTION', description: 'Cargo Ship Safety Construction Certificate', code: 'CCC22879', issuedDate: '26-04-2026', validUntil: '17-07-2026', type: 'COND', status: 'VALID' },
      { convention: 'SOLAS CONVENTION', description: 'Cargo Ship Safety Equipment Certificate', code: 'CEC22879', issuedDate: '26-04-2026', validUntil: '17-07-2026', type: 'COND', status: 'VALID' },
      { convention: 'SOLAS CONVENTION', description: 'Cargo Ship Safety Radio Certificate', code: 'CRC22879', issuedDate: '26-04-2026', validUntil: '17-07-2026', type: 'COND', status: 'VALID' },
      { convention: 'MARPOL CONVENTION', description: 'International Air Pollution Prevention Certificate', code: 'IAPP22122', issuedDate: '09-02-2026', validUntil: '06-07-2026', type: 'ST', status: 'VALID' },
      { convention: 'MARPOL CONVENTION', description: 'International Energy Efficiency Certificate', code: 'IEEC22122', issuedDate: '09-02-2026', validUntil: '06-07-2026', type: 'ST', status: 'VALID' },
      { convention: 'MARPOL CONVENTION', description: 'International Oil Pollution Prevention Certificate', code: 'IOPP22122', issuedDate: '09-02-2026', validUntil: '06-07-2026', type: 'ST', status: 'VALID' },
      { convention: 'MARPOL CONVENTION', description: 'International Sewage Pollution Prevention Certificate', code: 'ISPP22122', issuedDate: '09-02-2026', validUntil: '06-07-2026', type: 'ST', status: 'VALID' },
      { convention: 'BALLAST WATER MANAGEMENT CONVENTION', description: 'Ballast Water Management Certificate', code: 'BWMC22122', issuedDate: '09-02-2026', validUntil: '06-07-2026', type: 'ST', status: 'VALID' },
      { convention: 'ANTIFOULING CONVENTION', description: 'Antifouling System Certificate', code: 'AFS22122', issuedDate: '09-02-2026', validUntil: '06-07-2026', type: 'ST', status: 'VALID' },
      { convention: 'ISM CODE', description: 'Safety Management Certificate', code: 'SMC22122', issuedDate: '09-02-2026', validUntil: '07-08-2026', type: 'IT', status: 'VALID' },
      { convention: 'ISPS CODE', description: 'International Ship Security Certificate', code: 'ISSC22122', issuedDate: '09-02-2026', validUntil: '07-08-2026', type: 'IT', status: 'VALID' },
      { convention: 'ILO CONVENTION', description: 'Crew Accommodation Inspection Certificate', code: 'OMCA22122', issuedDate: '18-03-2026', validUntil: '06-07-2026', type: 'ST', status: 'VALID' },
      { convention: 'ILO CONVENTION', description: 'Maritime Labor Convention Certificate', code: 'MLC22122', issuedDate: '09-02-2026', validUntil: '07-08-2026', type: 'IT', status: 'VALID' },
    ],

    classificationSurveys: [
      { description: 'Bottom Survey - Renewal / Special in dry dock survey', lastDate: '25-02-2022', dueDate: '25-02-2027', range: '25-11-2026 - 25-02-2027', postponementDate: '—', status: 'BEFORE RANGE' },
      { description: 'Bottom Survey - Intermediate in dry dock', lastDate: '—', dueDate: '25-02-2025', range: '25-02-2024 - 25-02-2025', postponementDate: '—', status: 'OVERDUE' },
    ],

    statutorySurveys: [
      { description: 'Crew Accommodation Inspection Certificate - Initial Survey', lastDate: '—', dueDate: '—', range: '—', postponementDate: '—', status: 'N/A' },
      { description: 'Crew Accommodation Inspection Certificate - Renewal survey', lastDate: '—', dueDate: '—', range: '—', postponementDate: '—', status: 'N/A' },
      { description: 'Antifouling System Certificate - Renewal survey', lastDate: '—', dueDate: '—', range: '—', postponementDate: '—', status: 'N/A' },
      { description: 'Ballast Water Management Certificate - Renewal survey', lastDate: '—', dueDate: '—', range: '—', postponementDate: '—', status: 'N/A' },
      { description: 'Ballast Water Management Certificate - Intermediate survey', lastDate: '—', dueDate: '—', range: '—', postponementDate: '—', status: 'N/A' },
      { description: 'Ballast Water Management Certificate - Annual survey', lastDate: '—', dueDate: '—', range: '—', postponementDate: '—', status: 'N/A' },
      { description: 'International Sewage Pollution Prevention Certificate - Renewal survey', lastDate: '—', dueDate: '—', range: '—', postponementDate: '—', status: 'N/A' },
      { description: 'International Oil Pollution Prevention Certificate - Renewal survey', lastDate: '—', dueDate: '—', range: '—', postponementDate: '—', status: 'N/A' },
      { description: 'International Oil Pollution Prevention Certificate - Intermediate survey', lastDate: '—', dueDate: '—', range: '—', postponementDate: '—', status: 'N/A' },
      { description: 'International Oil Pollution Prevention Certificate - Annual survey', lastDate: '—', dueDate: '—', range: '—', postponementDate: '—', status: 'N/A' },
      { description: 'International Energy Efficiency Certificate - Renewal survey', lastDate: '—', dueDate: '—', range: '—', postponementDate: '—', status: 'N/A' },
      { description: 'International Air Pollution Prevention Certificate - Renewal survey', lastDate: '—', dueDate: '—', range: '—', postponementDate: '—', status: 'N/A' },
      { description: 'International Air Pollution Prevention Certificate - Intermediate survey', lastDate: '—', dueDate: '—', range: '—', postponementDate: '—', status: 'N/A' },
      { description: 'International Air Pollution Prevention Certificate - Annual survey', lastDate: '—', dueDate: '—', range: '—', postponementDate: '—', status: 'N/A' },
      { description: 'IMSBC CODE - Renewal survey', lastDate: '—', dueDate: '—', range: '—', postponementDate: '—', status: 'N/A' },
      { description: 'International Tonnage Certificate - Renewal survey', lastDate: '—', dueDate: '—', range: '—', postponementDate: '—', status: 'N/A' },
    ],

    conditionsOfClass: [],
    nonConformities: [],
    pscRecords: [],

    ownerInformation: [
      { number: '086', issueDate: '13-02-2024', entryInForce: '01-01-2026', description: 'SOLAS 2023 Amendment (107th) / Chapter II-1 / Reg.3-13.1 — Lifting appliances and anchor handling winches. The requirements of Design, construction and installation, Maintenance, operation, inspection and testing have been amended.' },
      { number: '087', issueDate: '20-02-2024', entryInForce: '01-01-2026', description: 'SOLAS 2023 Amendment (107th) / Chapter V / Reg. 19.2.12 — Containerships and bulk carriers of 3,000 GT and upwards constructed on or after 1 January 2026 shall be fitted with an electronic inclinometer.' },
      { number: '088', issueDate: '19-03-2024', entryInForce: '01-01-2026', description: 'SOLAS 2023 Amendment (107th) / Chapter V / Reg. 18 — New requirements of approval, surveys and performance standards of navigational systems, equipment, and voyage data recorder.' },
      { number: '089', issueDate: '09-04-2024', entryInForce: '01-08-2025', description: 'MARPOL 2024 Amendment (81st) / ANNEX VI / Reg. 18 — New requirements of fuel oil availability and quality.' },
      { number: '090', issueDate: '16-04-2024', entryInForce: '01-08-2025', description: 'MARPOL 2024 Amendment (81st) / ANNEX VI / Reg. 27 — New requirements of collection and reporting of ship fuel oil consumption data.' },
    ],

    surveyHistory: [
      { surveyType: 'Class Entry Survey', surveyDate: '27-09-2025', location: 'Dubai, UAE', surveyor: 'GR Class Surveyor', findings: 'Vessel accepted into class', status: 'VALID' },
      { surveyType: 'Conditional Classification', surveyDate: '26-04-2026', location: 'Tanzania', surveyor: 'GR Class Surveyor', findings: 'Hull & Machinery conditional certificate issued', status: 'VALID' },
    ],

    manualNotes: '',
    preparedBy: 'GR CLASS Operations',
  });
}
