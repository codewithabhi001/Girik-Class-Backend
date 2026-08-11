import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';

/**
 * GR CLASS - Class & Statutory Survey Status Report Generator
 * 
 * Generates an official GR CLASS Class & Statutory Survey Status Report
 * using the template stored in `ONLY CERTIFICATES/Class and Statutory Survey Status Report/html/Survey_Status_Report.html`
 * (and seeded into the `certificate_templates` database table).
 */

let cachedTemplate = null;

function loadTemplateHtml() {
  if (cachedTemplate) return cachedTemplate;
  try {
    const htmlPath = path.resolve('ONLY CERTIFICATES/Class and Statutory Survey Status Report/html/Survey_Status_Report.html');
    if (fs.existsSync(htmlPath)) {
      cachedTemplate = fs.readFileSync(htmlPath, 'utf-8');
      return cachedTemplate;
    }
  } catch (err) {
    console.error('Error loading Survey_Status_Report.html:', err);
  }
  return '';
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

  const classCertRowsHtml = defaultClassCerts.map(c => `
    <tr>
      <td style="font-weight:bold;">${c.description}</td>
      <td style="font-family:monospace; font-weight:bold;">${c.code}</td>
      <td>${c.issuedDate}</td>
      <td>${c.validUntil}</td>
      <td>${c.type || 'ST'}</td>
      <td><span class="badge badge-valid">${c.status || 'VALID'}</span></td>
    </tr>
  `).join('');

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
    statCertRowsHtml += `<tr class="convention-row"><td colspan="6">${conv}</td></tr>`;
    certList.forEach(c => {
      statCertRowsHtml += `
        <tr>
          <td>${c.description}</td>
          <td style="font-family:monospace; font-weight:bold;">${c.code}</td>
          <td>${c.issuedDate}</td>
          <td>${c.validUntil}</td>
          <td>${c.type || 'ST'}</td>
          <td><span class="badge badge-valid">${c.status || 'VALID'}</span></td>
        </tr>
      `;
    });
  }

  // 3. Plan Approval Rows
  const planApprovalRowsHtml = `
    <tr>
      <td colspan="3" style="font-size: 6.5pt; color: #475569; font-style: italic;">
        For ships built under supervision of GR CLASS; the date at which the new-construction survey process is completed (and interim classification certificate is issued). For ships built under the supervision of another classification society or Recognized Organization; the Date of Built as shown in their respective register books.
      </td>
    </tr>
  `;

  // 4. Classification Surveys Rows
  const defaultClassSurveys = classificationSurveys.length > 0 ? classificationSurveys : [
    { name: 'Annual Hull Survey', lastDate: '24-10-2025', dueDate: '28-10-2026', range: '28-07-2026 - 28-01-2027', postponed: '—', status: 'BEFORE RANGE' },
    { name: 'Annual Machinery Survey', lastDate: '24-10-2025', dueDate: '28-10-2026', range: '28-07-2026 - 28-01-2027', postponed: '—', status: 'BEFORE RANGE' },
    { name: 'Boiler Survey', lastDate: '24-10-2025', dueDate: '28-10-2027', range: '28-04-2027 - 28-10-2027', postponed: '—', status: 'BEFORE RANGE' }
  ];

  const classSurveysRowsHtml = defaultClassSurveys.map(s => `
    <tr>
      <td style="font-weight:bold;">${s.name}</td>
      <td>${s.lastDate}</td>
      <td>${s.dueDate}</td>
      <td style="font-size:6.8pt; color:#555;">${s.range}</td>
      <td>${s.postponed}</td>
      <td><span class="badge badge-valid" style="font-size:6pt;">${s.status}</span></td>
    </tr>
  `).join('');

  // 5. Statutory Surveys Rows
  const defaultStatSurveys = statutorySurveys.length > 0 ? statutorySurveys : [
    { name: 'Load Line Annual Survey', lastDate: '24-10-2025', dueDate: '28-10-2026', range: '28-07-2026 - 28-01-2027', postponed: '—', status: 'BEFORE RANGE' },
    { name: 'Safety Construction Annual Survey', lastDate: '24-10-2025', dueDate: '28-10-2026', range: '28-07-2026 - 28-01-2027', postponed: '—', status: 'BEFORE RANGE' },
    { name: 'Safety Equipment Annual Survey', lastDate: '24-10-2025', dueDate: '28-10-2026', range: '28-07-2026 - 28-01-2027', postponed: '—', status: 'BEFORE RANGE' }
  ];

  const statSurveysRowsHtml = defaultStatSurveys.map(s => `
    <tr>
      <td style="font-weight:bold;">${s.name}</td>
      <td>${s.lastDate}</td>
      <td>${s.dueDate}</td>
      <td style="font-size:6.8pt; color:#555;">${s.range}</td>
      <td>${s.postponed}</td>
      <td><span class="badge badge-valid" style="font-size:6pt;">${s.status}</span></td>
    </tr>
  `).join('');

  // 6. Conditions of Class Rows
  const conditionsRowsHtml = conditionsOfClass.length > 0 ? conditionsOfClass.map(c => `
    <tr>
      <td style="font-family:monospace;">${c.requestNo}</td>
      <td>${c.observation}</td>
      <td>${c.dueDate}</td>
      <td>${c.certificate}</td>
      <td><span class="badge badge-valid">${c.status}</span></td>
    </tr>
  `).join('') : `
    <tr>
      <td colspan="5" style="text-align:center; color:#777; font-style:italic;">No active Conditions of Class or Memoranda logged for this vessel.</td>
    </tr>
  `;

  // 7. Non-Conformities Rows
  const ncRowsHtml = nonConformities.length > 0 ? nonConformities.map(n => `
    <tr>
      <td style="font-family:monospace;">${n.requestNo}</td>
      <td>${n.observation}</td>
      <td>${n.limitDate}</td>
      <td>${n.certificate}</td>
      <td><span class="badge badge-valid">${n.status}</span></td>
    </tr>
  `).join('') : `
    <tr>
      <td colspan="5" style="text-align:center; color:#777; font-style:italic;">No outstanding Non-Conformities or Deficiencies.</td>
    </tr>
  `;

  // 8. PSC Performance Rows
  const defaultPsc = pscRecords.length > 0 ? pscRecords : [
    { docNo: 'PSC-2025-01', date: '14-03-2025', port: 'SINGAPORE', mou: 'TOKYO MOU', defs: '0', detained: 'NO' },
    { docNo: 'PSC-2024-08', date: '19-11-2024', port: 'ROTTERDAM', mou: 'PARIS MOU', defs: '1 (RECTIFIED)', detained: 'NO' }
  ];

  const pscRowsHtml = defaultPsc.map(p => `
    <tr>
      <td style="font-family:monospace;">${p.docNo}</td>
      <td>${p.date}</td>
      <td style="font-weight:bold;">${p.port}</td>
      <td>${p.mou}</td>
      <td>${p.defs}</td>
      <td><span class="badge badge-valid">${p.detained}</span></td>
    </tr>
  `).join('');

  // 9. Information Rows
  const infoRowsHtml = `
    <tr>
      <td style="font-weight:bold;">090</td>
      <td>16-04-2024</td>
      <td>01-08-2025</td>
      <td>MARPOL *** / MARPOL 2024 Amendment (81st) / ANNEX VI / Reg. 27<br>The new requirements of collection and reporting of ship fuel oil consumption data like new paragraph 14 in regulation 27 allowing the IMO to share data with analytical consultancies and research entities...</td>
    </tr>
    <tr>
      <td style="font-weight:bold;">095</td>
      <td>26-09-2024</td>
      <td>06-06-2025</td>
      <td>The Hong Kong International Convention for the Safe and Environmentally Sound Recycling of Ships, 2009 (the Hong Kong Convention) enters into force...</td>
    </tr>
  `;

  // 10. Survey History Rows
  const defaultHistory = surveyHistory.length > 0 ? surveyHistory : [
    { type: 'Annual Survey', date: '24-10-2025', location: 'BUSAN, KOREA', surveyor: 'CAPT. R. SHARMA', status: 'COMPLETED' },
    { type: 'Intermediate Survey', date: '28-10-2023', location: 'SINGAPORE', surveyor: 'ENG. M. ALVAREZ', status: 'COMPLETED' }
  ];

  const historyRowsHtml = defaultHistory.map(h => `
    <tr>
      <td style="font-weight:bold;">${h.type}</td>
      <td>${h.date}</td>
      <td>${h.location}</td>
      <td>${h.surveyor}</td>
      <td><span class="badge badge-valid">${h.status}</span></td>
    </tr>
  `).join('');

  // Process Logo, QR Code & Signature
  const finalLogo = logo || `<div class="p1-logo-emblem">GR</div>`;
  let finalQrCode = qrCodeHtml;
  if (!finalQrCode) {
    const qrUrl = `https://trust.grclass.com/verify?utn=${utnNumber}&imo=${imoNumber}`;
    try {
      // Inline SVG or placeholder
      finalQrCode = `<svg width="44" height="44" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#ffffff"/>
        <path d="M10,10 h30 v30 h-30 z M15,15 v20 h20 v-20 z M22,22 h6 v6 h-6 z" fill="#0b2545"/>
        <path d="M60,10 h30 v30 h-30 z M65,15 v20 h20 v-20 z M72,22 h6 v6 h-6 z" fill="#0b2545"/>
        <path d="M10,60 h30 v30 h-30 z M15,65 v20 h20 v-20 z M22,72 h6 v6 h-6 z" fill="#0b2545"/>
        <rect x="45" y="45" width="12" height="12" fill="#b08d57"/>
        <rect x="60" y="60" width="10" height="10" fill="#0b2545"/>
        <rect x="75" y="75" width="15" height="15" fill="#0b2545"/>
      </svg>`;
    } catch (e) {
      finalQrCode = `<div style="font-size:6pt; text-align:center;">QR CODE</div>`;
    }
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
