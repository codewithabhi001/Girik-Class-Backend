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
    // Vessel Particulars
    vesselName = 'ENABLE',
    imoNumber = '9246891',
    classNumber = '0026891',
    callSign = '3E6099',
    flag = 'PANAMA',
    portOfRegistry = 'PANAMA',
    shipType = 'BULK CARRIER',
    keelLayingDate = '28-07-2000',
    dateOfBuild = '17-04-2001',
    vesselEntryDate = '27-09-2025',
    classNotation = 'GR.BULK CARRIER.ESP.BC-A. Holds 2&4 may be empty.IC.CDC.',
    deadweight = '48910 MT',
    grossTonnage = '27198 GT',
    netTonnage = '15365 NT',
    length = '187.500 Meter',
    breadth = '31.000 Meter',
    depth = '16.750 Meter',
    radioArea = 'Area A1+A2+A3',
    registeredOwner = 'Cassini Shipping Services LLC',
    ownerAddress = 'Office 29, Al Khabaisi Street, Dubai, United Arab Emirates',
    managementCompany = 'TOTAL VSV SHIPPING SERVICES LLC-FZ',
    managementAddress = 'Office 1314-1315, Level 13, Burjuman Business Tower, Al-Mankhool Road, Dubai, United Arab Emirates',
    classStatus = 'ACTIVE',

    // Dynamic QR & Branding Assets
    logo = '',
    signature = '',
    qrCodeHtml = '',
    utnNumber = `00270904325020255972`,

    // Lists
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

    manualNotes = '1. Annual Survey due within window 28/07/2026 - 28/10/2026.\n2. Intermediate Shafting inspection verified cleanly.',
    printDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } = data;

  let templateHtml = loadTemplateHtml();

  // 1. Build Class Certificates Rows
  const defaultClassCerts = classCertificates.length > 0 ? classCertificates : [
    { description: 'Hull & Machinery', code: 'H22879', issuedDate: '26-04-2026', validUntil: '17-07-2026', type: 'COND', status: 'VALID' }
  ];

  const classCertRowsHtml = defaultClassCerts.map(c => {
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
  }).join('');

  // 2. Build Statutory Certificates Rows
  const defaultStatCerts = statutoryCertificates.length > 0 ? statutoryCertificates : [
    { convention: 'LOAD LINE & TONNAGE CONVENTIONS', description: 'International Load Line Certificate', code: 'LL22879', issuedDate: '26-04-2026', validUntil: '17-07-2026', type: 'COND', status: 'VALID' },
    { convention: 'LOAD LINE & TONNAGE CONVENTIONS', description: 'International Tonnage Certificate', code: 'ITC22122', issuedDate: '09-02-2026', validUntil: '06-07-2026', type: 'ST', status: 'VALID' },
    { convention: 'IMO CODES', description: 'Certificate of Compliance with the International Maritime Solid Bulk Cargoes (IMSBC) CODE', code: 'IMSBC22122', issuedDate: '09-02-2026', validUntil: '06-07-2026', type: 'ST', status: 'VALID' },
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
    { convention: 'ILO CONVENTION', description: 'Crew Accommodation Inspection Certificate', code: 'GRCA22122', issuedDate: '18-03-2026', validUntil: '06-07-2026', type: 'ST', status: 'VALID' },
    { convention: 'ILO CONVENTION', description: 'Maritime Labor Convention Certificate', code: 'MLC22122', issuedDate: '09-02-2026', validUntil: '07-08-2026', type: 'IT', status: 'VALID' }
  ];

  const statGroups = {};
  defaultStatCerts.forEach(c => {
    const conv = c.convention || 'STATUTORY CONVENTIONS';
    if (!statGroups[conv]) statGroups[conv] = [];
    statGroups[conv].push(c);
  });

  let statCertRowsHtml = '';
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

  // 3. Plan Approval Rows
  const defaultPlanApproval = planApprovalCertificates.length > 0 ? planApprovalCertificates : [
    { description: 'Stability Information Booklet', code: 'SIB22879', issuedDate: '26-04-2026' },
    { description: 'Loading Manual', code: 'LM22879', issuedDate: '26-04-2026' }
  ];

  const planApprovalRowsHtml = defaultPlanApproval.map(p => `
    <tr>
      <td contenteditable="true">${p.description}</td>
      <td style="font-family:monospace; font-weight:bold;" contenteditable="true">${p.code}</td>
      <td contenteditable="true">${p.issuedDate}</td>
      <td class="col-action"><button type="button" class="remove-row-btn" onclick="removeRow(this)" contenteditable="false" title="Remove">✕</button></td>
    </tr>
  `).join('');

  // 4. Classification Surveys Rows
  const defaultClassSurveys = classificationSurveys.length > 0 ? classificationSurveys : [
    { name: 'Annual Hull Survey', lastDate: '24-10-2025', dueDate: '28-10-2026', range: '28-07-2026 - 28-01-2027', postponed: '—', status: 'BEFORE RANGE' },
    { name: 'Annual Machinery Survey', lastDate: '24-10-2025', dueDate: '28-10-2026', range: '28-07-2026 - 28-01-2027', postponed: '—', status: 'BEFORE RANGE' },
    { name: 'Boiler Survey', lastDate: '24-10-2025', dueDate: '28-10-2027', range: '28-04-2027 - 28-10-2027', postponed: '—', status: 'BEFORE RANGE' }
  ];

  const classSurveysRowsHtml = defaultClassSurveys.map(s => {
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
  }).join('');

  // 5. Statutory Surveys Rows
  const defaultStatSurveys = statutorySurveys.length > 0 ? statutorySurveys : [
    { name: 'Load Line Annual Survey', lastDate: '24-10-2025', dueDate: '28-10-2026', range: '28-07-2026 - 28-01-2027', postponed: '—', status: 'BEFORE RANGE' },
    { name: 'Safety Construction Annual Survey', lastDate: '24-10-2025', dueDate: '28-10-2026', range: '28-07-2026 - 28-01-2027', postponed: '—', status: 'BEFORE RANGE' },
    { name: 'Safety Equipment Annual Survey', lastDate: '24-10-2025', dueDate: '28-10-2026', range: '28-07-2026 - 28-01-2027', postponed: '—', status: 'BEFORE RANGE' }
  ];

  const statSurveysRowsHtml = defaultStatSurveys.map(s => {
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
  }).join('');

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
  const defaultPsc = pscRecords.length > 0 ? pscRecords : [
    { docNo: 'PSC-2025-01', date: '14-03-2025', port: 'SINGAPORE', mou: 'TOKYO MOU', defs: '0', detained: 'NO' },
    { docNo: 'PSC-2024-08', date: '19-11-2024', port: 'ROTTERDAM', mou: 'PARIS MOU', defs: '1 (RECTIFIED)', detained: 'NO' }
  ];

  const pscRowsHtml = defaultPsc.map(p => `
    <tr>
      <td style="font-family:monospace;" contenteditable="true">${p.docNo}</td>
      <td contenteditable="true">${p.date}</td>
      <td style="font-weight:bold;" contenteditable="true">${p.port}</td>
      <td contenteditable="true">${p.mou}</td>
      <td contenteditable="true">${p.defs}</td>
      <td><span class="badge badge-valid">${p.detained}</span></td>
      <td class="col-action"><button type="button" class="remove-row-btn" onclick="removeRow(this)" contenteditable="false" title="Remove">✕</button></td>
    </tr>
  `).join('');

  // 9. Information Rows
  const defaultInfoRows = ownerInformation.length > 0 ? ownerInformation : [
    { no: '090', issueDate: '16-04-2024', entryInForce: '01-08-2025', description: 'MARPOL *** / MARPOL 2024 Amendment (81st) / ANNEX VI / Reg. 27 — The new requirements of collection and reporting of ship fuel oil consumption data like new paragraph 14 in regulation 27 allowing the IMO to share data with analytical consultancies and research entities...' },
    { no: '095', issueDate: '26-09-2024', entryInForce: '06-06-2025', description: 'The Hong Kong International Convention for the Safe and Environmentally Sound Recycling of Ships, 2009 (the Hong Kong Convention) enters into force...' }
  ];

  const infoRowsHtml = defaultInfoRows.map(i => `
    <tr>
      <td style="font-weight:bold;" contenteditable="true">${i.no}</td>
      <td contenteditable="true">${i.issueDate}</td>
      <td contenteditable="true">${i.entryInForce}</td>
      <td contenteditable="true">${i.description}</td>
      <td class="col-action"><button type="button" class="remove-row-btn" onclick="removeRow(this)" contenteditable="false" title="Remove">✕</button></td>
    </tr>
  `).join('');

  // 10. Survey History Rows
  const defaultHistory = surveyHistory.length > 0 ? surveyHistory : [
    { type: 'Annual Survey', date: '24-10-2025', location: 'BUSAN, KOREA', surveyor: 'CAPT. R. SHARMA', status: 'COMPLETED' },
    { type: 'Intermediate Survey', date: '28-10-2023', location: 'SINGAPORE', surveyor: 'ENG. M. ALVAREZ', status: 'COMPLETED' }
  ];

  const historyRowsHtml = defaultHistory.map(h => `
    <tr>
      <td style="font-weight:bold;" contenteditable="true">${h.type}</td>
      <td contenteditable="true">${h.date}</td>
      <td contenteditable="true">${h.location}</td>
      <td contenteditable="true">${h.surveyor}</td>
      <td><span class="badge badge-valid">${h.status}</span></td>
      <td class="col-action"><button type="button" class="remove-row-btn" onclick="removeRow(this)" contenteditable="false" title="Remove">✕</button></td>
    </tr>
  `).join('');

  // Process Logo, QR Code & Signature
  const defaultLogo = `<img src="https://grclass.com/grclass-logo.webp" alt="GR Class Logo" style="max-height: 70px; width: auto; object-fit: contain;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"/><div class="cover-logo-emblem" style="display:none;">GR</div>`;
  
  let finalLogo = logo;
  if (!finalLogo) {
    finalLogo = defaultLogo;
  } else if (typeof finalLogo === 'string' && !finalLogo.includes('<img') && !finalLogo.includes('<svg')) {
    finalLogo = `<img src="${finalLogo}" alt="GR Class Logo" style="max-height: 70px; width: auto; object-fit: contain;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"/><div class="cover-logo-emblem" style="display:none;">GR</div>`;
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
    '{manual_notes}': manualNotes.replace(/\n/g, '<br>')
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
