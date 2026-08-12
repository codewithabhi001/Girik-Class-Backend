import fs from 'fs';
import path from 'path';

/**
 * GR CLASS - Class & Statutory Survey Status Report Generator
 * 
 * Generates an official GR CLASS Class & Statutory Survey Status Report
 * using the template stored in `ONLY CERTIFICATES/Class and Statutory Survey Status Report/html/Survey_Status_Report.html`
 * (and seeded into the `certificate_templates` database table).
 */

let cachedTemplate = null;

function loadTemplateHtml() {
  // Always read from disk so template polish shows up without process restart
  try {
    const htmlPath = path.resolve('ONLY CERTIFICATES/Class and Statutory Survey Status Report/html/Survey_Status_Report.html');
    if (fs.existsSync(htmlPath)) {
      cachedTemplate = fs.readFileSync(htmlPath, 'utf-8');
      return cachedTemplate;
    }
  } catch (err) {
    console.error('Error loading Survey_Status_Report.html:', err);
  }
  return cachedTemplate || '';
}

/** Parse DD/MM/YYYY, DD-MM-YYYY, or ISO into a date at local midnight */
function parseReportDate(value) {
  if (!value || value === '—') return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const d = new Date(value);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const raw = String(value).trim();
  const iso = new Date(raw);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw) && !Number.isNaN(iso.getTime())) {
    iso.setHours(0, 0, 0, 0);
    return iso;
  }
  const m = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10) - 1;
  let year = parseInt(m[3], 10);
  if (year < 100) year += 2000;
  const d = new Date(year, month, day);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function todayLocal() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Runtime certificate status from Valid Until (keeps admin locks like SUSPENDED/REVOKED) */
function resolveCertStatus(dbStatus, validUntil) {
  const locked = new Set(['SUSPENDED', 'REVOKED', 'CANCELLED', 'TRANSFERRED', 'DOWNGRADED', 'DRAFT']);
  const upper = String(dbStatus || '').toUpperCase();
  if (locked.has(upper)) return upper;

  const expiry = parseReportDate(validUntil);
  if (!expiry) return upper === 'ISSUED' || !upper ? 'VALID' : upper;

  const today = todayLocal();
  if (expiry < today) return 'EXPIRED';
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 30) return 'DUE SOON';
  return 'VALID';
}

/** Runtime survey window status from due date / range text */
function resolveSurveyStatus(dueDate, rangeText) {
  const today = todayLocal();
  let start = null;
  let end = parseReportDate(dueDate);

  if (rangeText) {
    const parts = String(rangeText).split(/\s*[-–—]\s*/);
    if (parts.length >= 2) {
      start = parseReportDate(parts[0]);
      end = parseReportDate(parts[1]) || end;
    }
  }

  if (end && today > end) return 'OVERDUE';
  if (start && end && today >= start && today <= end) return 'WITHIN RANGE';
  if (end && !start) {
    const windowStart = new Date(end);
    windowStart.setMonth(windowStart.getMonth() - 3);
    if (today >= windowStart && today <= end) return 'WITHIN RANGE';
  }
  if (end && today <= end) return 'BEFORE RANGE';
  return 'BEFORE RANGE';
}

function statusBadgeHtml(status) {
  const s = String(status || 'VALID').toUpperCase();
  let cls = 'badge-valid';
  if (['EXPIRED', 'REVOKED', 'CANCELLED', 'OVERDUE', 'WITHDRAWN'].includes(s)) cls = 'badge-expired';
  else if (['DUE SOON', 'SUSPENDED', 'WITHIN RANGE', 'OPEN'].includes(s)) cls = 'badge-due';
  return `<span class="badge ${cls}" data-runtime-status="1">${s}</span>`;
}

export function generateSurveyStatusReport(data = {}) {
  const {
    // Vessel Particulars — all default to dash (no hardcoded sample data)
    vesselName = '—',
    imoNumber = '—',
    classNumber = '—',
    callSign = '—',
    flag = '—',
    portOfRegistry = '—',
    shipType = '—',
    keelLayingDate = '—',
    dateOfBuild = '—',
    vesselEntryDate = '—',
    classNotation = '—',
    deadweight = '—',
    grossTonnage = '—',
    netTonnage = '—',
    length = '—',
    breadth = '—',
    depth = '—',
    radioArea = '—',
    registeredOwner = '—',
    ownerAddress = '—',
    managementCompany = '—',
    managementAddress = '—',
    classStatus = '—',

    // Dynamic QR & Branding Assets
    logo = '',
    signature = '',
    qrCodeHtml = '',
    utnNumber = '—',

    // Lists — all default to empty (no hardcoded sample rows)
    classCertificates = [],
    statutoryCertificates = [],
    planApprovalCertificates = [],
    classificationSurveys = [],
    statutorySurveys = [],
    conditionsOfClass = [],
    nonConformities = [],
    pscRecords = [],
    ownerInformation = [],
    surveyHistory = [],

    manualNotes = '',
    printDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } = data;

  let templateHtml = loadTemplateHtml();

  // 1. Build Class Certificates Rows
  const classCertRowsHtml = classCertificates.length > 0 ? classCertificates.map(c => {
    const status = resolveCertStatus(c.status, c.validUntil);
    return `
    <tr>
      <td style="font-weight:bold;" contenteditable="true">${c.description}</td>
      <td style="font-family:monospace; font-weight:bold;" contenteditable="true">${c.code}</td>
      <td contenteditable="true">${c.issuedDate}</td>
      <td contenteditable="true" data-date-role="valid-until">${c.validUntil}</td>
      <td contenteditable="true">${c.type || 'ST'}</td>
      <td>${statusBadgeHtml(status)}</td>
      <td class="col-action"><button type="button" class="remove-row-btn" onclick="removeRow(this)" contenteditable="false" title="Remove">✕</button></td>
    </tr>`;
  }).join('') : `
    <tr>
      <td colspan="7" style="text-align:center; color:#777; font-style:italic;">No Class Certificates on record.</td>
    </tr>
  `;

  // 2. Build Statutory Certificates Rows
  let statCertRowsHtml = '';
  if (statutoryCertificates.length > 0) {
    const statGroups = {};
    statutoryCertificates.forEach(c => {
      const conv = c.convention || 'STATUTORY CONVENTIONS';
      if (!statGroups[conv]) statGroups[conv] = [];
      statGroups[conv].push(c);
    });

    for (const [conv, certList] of Object.entries(statGroups)) {
      statCertRowsHtml += `<tr class="convention-row"><td colspan="7">${conv}</td></tr>`;
      certList.forEach(c => {
        const status = resolveCertStatus(c.status, c.validUntil);
        statCertRowsHtml += `
          <tr>
            <td contenteditable="true">${c.description}</td>
            <td style="font-family:monospace; font-weight:bold;" contenteditable="true">${c.code}</td>
            <td contenteditable="true">${c.issuedDate}</td>
            <td contenteditable="true" data-date-role="valid-until">${c.validUntil}</td>
            <td contenteditable="true">${c.type || 'ST'}</td>
            <td>${statusBadgeHtml(status)}</td>
            <td class="col-action"><button type="button" class="remove-row-btn" onclick="removeRow(this)" contenteditable="false" title="Remove">✕</button></td>
          </tr>
        `;
      });
    }
  } else {
    statCertRowsHtml = `
      <tr>
        <td colspan="7" style="text-align:center; color:#777; font-style:italic;">No Statutory Certificates on record.</td>
      </tr>
    `;
  }

  // 3. Plan Approval Rows
  const planApprovalRowsHtml = planApprovalCertificates.length > 0 ? planApprovalCertificates.map(p => `
    <tr>
      <td contenteditable="true">${p.description}</td>
      <td style="font-family:monospace; font-weight:bold;" contenteditable="true">${p.code}</td>
      <td contenteditable="true">${p.issuedDate}</td>
      <td class="col-action"><button type="button" class="remove-row-btn" onclick="removeRow(this)" contenteditable="false" title="Remove">✕</button></td>
    </tr>
  `).join('') : `
    <tr>
      <td colspan="4" style="text-align:center; color:#777; font-style:italic;">No Plan Approval Certificates on record.</td>
    </tr>
  `;

  // 4. Classification Surveys Rows
  const classSurveysRowsHtml = classificationSurveys.length > 0 ? classificationSurveys.map(s => {
    const status = resolveSurveyStatus(s.dueDate, s.range);
    return `
    <tr>
      <td style="font-weight:bold;" contenteditable="true">${s.name}</td>
      <td contenteditable="true">${s.lastDate}</td>
      <td contenteditable="true" data-date-role="due-date">${s.dueDate}</td>
      <td style="font-size:7pt; color:#555;" contenteditable="true" data-date-role="range">${s.range}</td>
      <td contenteditable="true">${s.postponed}</td>
      <td>${statusBadgeHtml(status)}</td>
      <td class="col-action"><button type="button" class="remove-row-btn" onclick="removeRow(this)" contenteditable="false" title="Remove">✕</button></td>
    </tr>`;
  }).join('') : `
    <tr>
      <td colspan="7" style="text-align:center; color:#777; font-style:italic;">No Classification Surveys on record.</td>
    </tr>
  `;

  // 5. Statutory Surveys Rows
  const statSurveysRowsHtml = statutorySurveys.length > 0 ? statutorySurveys.map(s => {
    const status = resolveSurveyStatus(s.dueDate, s.range);
    return `
    <tr>
      <td style="font-weight:bold;" contenteditable="true">${s.name}</td>
      <td contenteditable="true">${s.lastDate}</td>
      <td contenteditable="true" data-date-role="due-date">${s.dueDate}</td>
      <td style="font-size:7pt; color:#555;" contenteditable="true" data-date-role="range">${s.range}</td>
      <td contenteditable="true">${s.postponed}</td>
      <td>${statusBadgeHtml(status)}</td>
      <td class="col-action"><button type="button" class="remove-row-btn" onclick="removeRow(this)" contenteditable="false" title="Remove">✕</button></td>
    </tr>`;
  }).join('') : `
    <tr>
      <td colspan="7" style="text-align:center; color:#777; font-style:italic;">No Statutory Surveys on record.</td>
    </tr>
  `;

  // 6. Conditions of Class Rows
  const conditionsRowsHtml = conditionsOfClass.length > 0 ? conditionsOfClass.map(c => {
    const locked = new Set(['CLOSED', 'CLEARED', 'RECTIFIED', 'COMPLETED']);
    const raw = String(c.status || 'OPEN').toUpperCase();
    let status = raw;
    if (!locked.has(raw)) {
      const due = parseReportDate(c.dueDate);
      if (due && due < todayLocal()) status = 'OVERDUE';
      else status = raw || 'OPEN';
    }
    return `
    <tr>
      <td style="font-family:monospace;" contenteditable="true">${c.requestNo}</td>
      <td contenteditable="true">${c.observation}</td>
      <td contenteditable="true" data-date-role="due-date">${c.dueDate}</td>
      <td contenteditable="true">${c.certificate}</td>
      <td>${statusBadgeHtml(status)}</td>
      <td class="col-action"><button type="button" class="remove-row-btn" onclick="removeRow(this)" contenteditable="false" title="Remove">✕</button></td>
    </tr>`;
  }).join('') : `
    <tr>
      <td colspan="6" style="text-align:center; color:#777; font-style:italic;">No active Conditions of Class or Memoranda logged for this vessel.</td>
    </tr>
  `;

  // 7. Non-Conformities Rows
  const ncRowsHtml = nonConformities.length > 0 ? nonConformities.map(n => {
    const locked = new Set(['CLOSED', 'CLEARED', 'RECTIFIED', 'COMPLETED']);
    const raw = String(n.status || 'OPEN').toUpperCase();
    let status = raw;
    if (!locked.has(raw)) {
      const due = parseReportDate(n.limitDate);
      if (due && due < todayLocal()) status = 'OVERDUE';
      else status = raw || 'OPEN';
    }
    return `
    <tr>
      <td style="font-family:monospace;" contenteditable="true">${n.requestNo}</td>
      <td contenteditable="true">${n.observation}</td>
      <td contenteditable="true" data-date-role="due-date">${n.limitDate}</td>
      <td contenteditable="true">${n.certificate}</td>
      <td>${statusBadgeHtml(status)}</td>
      <td class="col-action"><button type="button" class="remove-row-btn" onclick="removeRow(this)" contenteditable="false" title="Remove">✕</button></td>
    </tr>`;
  }).join('') : `
    <tr>
      <td colspan="6" style="text-align:center; color:#777; font-style:italic;">No outstanding Non-Conformities or Deficiencies.</td>
    </tr>
  `;

  // 8. PSC Performance Rows
  const pscRowsHtml = pscRecords.length > 0 ? pscRecords.map(p => `
    <tr>
      <td style="font-family:monospace;" contenteditable="true">${p.docNo}</td>
      <td contenteditable="true">${p.date}</td>
      <td style="font-weight:bold;" contenteditable="true">${p.port}</td>
      <td contenteditable="true">${p.mou}</td>
      <td contenteditable="true">${p.defs}</td>
      <td><span class="badge badge-valid">${p.detained}</span></td>
      <td class="col-action"><button type="button" class="remove-row-btn" onclick="removeRow(this)" contenteditable="false" title="Remove">✕</button></td>
    </tr>
  `).join('') : `
    <tr>
      <td colspan="7" style="text-align:center; color:#777; font-style:italic;">No PSC Inspection Records on file.</td>
    </tr>
  `;

  // 9. Information Rows
  const infoRowsHtml = ownerInformation.length > 0 ? ownerInformation.map(i => `
    <tr>
      <td style="font-weight:bold;" contenteditable="true">${i.no}</td>
      <td contenteditable="true">${i.issueDate}</td>
      <td contenteditable="true">${i.entryInForce}</td>
      <td contenteditable="true">${i.description}</td>
      <td class="col-action"><button type="button" class="remove-row-btn" onclick="removeRow(this)" contenteditable="false" title="Remove">✕</button></td>
    </tr>
  `).join('') : `
    <tr>
      <td colspan="5" style="text-align:center; color:#777; font-style:italic;">No Owner / Manager Information on record.</td>
    </tr>
  `;

  // 10. Survey History Rows
  const historyRowsHtml = surveyHistory.length > 0 ? surveyHistory.map(h => `
    <tr>
      <td style="font-weight:bold;" contenteditable="true">${h.type}</td>
      <td contenteditable="true">${h.date}</td>
      <td contenteditable="true">${h.location}</td>
      <td contenteditable="true">${h.surveyor}</td>
      <td><span class="badge badge-valid">${h.status}</span></td>
      <td class="col-action"><button type="button" class="remove-row-btn" onclick="removeRow(this)" contenteditable="false" title="Remove">✕</button></td>
    </tr>
  `).join('') : `
    <tr>
      <td colspan="6" style="text-align:center; color:#777; font-style:italic;">No Survey History on record.</td>
    </tr>
  `;

  // Process Logo, QR Code & Signature
  const defaultLogo = `<img src="https://grclass.com/grclass-logo.webp" alt="GR Class Logo" style="max-height: 48px; width: auto; object-fit: contain;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"/><div class="cover-logo-emblem" style="display:none;">GR</div>`;
  
  let finalLogo = logo;
  if (!finalLogo) {
    finalLogo = defaultLogo;
  } else if (typeof finalLogo === 'string' && !finalLogo.includes('<img') && !finalLogo.includes('<svg')) {
    finalLogo = `<img src="${finalLogo}" alt="GR Class Logo" style="max-height: 48px; width: auto; object-fit: contain;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"/><div class="cover-logo-emblem" style="display:none;">GR</div>`;
  }

  let finalQrCode = qrCodeHtml;
  if (!finalQrCode) {
    finalQrCode = `<svg width="72" height="72" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#ffffff"/>
      <path d="M10,10 h30 v30 h-30 z M15,15 v20 h20 v-20 z M22,22 h6 v6 h-6 z" fill="#0b2545"/>
      <path d="M60,10 h30 v30 h-30 z M65,15 v20 h20 v-20 z M72,22 h6 v6 h-6 z" fill="#0b2545"/>
      <path d="M10,60 h30 v30 h-30 z M15,65 v20 h20 v-20 z M22,72 h6 v6 h-6 z" fill="#0b2545"/>
      <rect x="45" y="45" width="12" height="12" fill="#b08d57"/>
      <rect x="60" y="60" width="10" height="10" fill="#0b2545"/>
      <rect x="75" y="75" width="15" height="15" fill="#0b2545"/>
    </svg>`;
  }

  // Substitutions dictionary
  const replacements = {
    '{logo}': finalLogo,
    '{qr_code}': finalQrCode,
    '{signature}': signature,
    '{vessel_name}': vesselName,
    '{imo_number}': imoNumber,
    '{class_number}': classNumber,
    '{call_sign}': callSign,
    '{flag_state}': flag,
    '{port_of_registry}': portOfRegistry,
    '{vessel_type}': shipType,
    '{keel_date}': keelLayingDate,
    '{build_date}': dateOfBuild,
    '{entry_date}': vesselEntryDate,
    '{class_notation}': classNotation,
    '{deadweight}': deadweight,
    '{gross_tonnage}': grossTonnage,
    '{net_tonnage}': netTonnage,
    '{length_overall}': length,
    '{breadth}': breadth,
    '{depth}': depth,
    '{radio_area}': radioArea,
    '{registered_owner}': registeredOwner,
    '{owner_address}': ownerAddress,
    '{management_company}': managementCompany,
    '{management_address}': managementAddress,
    '{class_status}': classStatus,
    '{print_date}': printDate,
    '{utn_number}': utnNumber,
    '{class_certificates_rows}': classCertRowsHtml,
    '{statutory_certificates_rows}': statCertRowsHtml,
    '{plan_approval_rows}': planApprovalRowsHtml,
    '{classification_surveys_rows}': classSurveysRowsHtml,
    '{statutory_surveys_rows}': statSurveysRowsHtml,
    '{conditions_of_class_rows}': conditionsRowsHtml,
    '{non_conformities_rows}': ncRowsHtml,
    '{psc_performance_rows}': pscRowsHtml,
    '{information_rows}': infoRowsHtml,
    '{survey_history_rows}': historyRowsHtml,
    '{manual_notes}': (manualNotes || '').replace(/\n/g, '<br>')
  };

  let renderedHtml = templateHtml;
  for (const [key, val] of Object.entries(replacements)) {
    renderedHtml = renderedHtml.split(key).join(val);
  }

  return renderedHtml;
}

export function generateSampleReport() {
  return generateSurveyStatusReport({});
}

