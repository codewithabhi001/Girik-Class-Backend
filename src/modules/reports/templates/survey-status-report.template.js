import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';

/**
 * GR CLASS - Class & Statutory Survey Status Report Generator
 * 
 * Renders an authentic official document certificate (A4 multi-page format)
 * using the HTML template stored in `ONLY CERTIFICATES/Class and Statutory Survey Status Report/html/Survey_Status_Report.html`
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
    vesselName = 'EAVLE',
    imoNumber = '9246891',
    classNumber = '0026891',
    callSign = 'HP9241',
    flag = 'PANAMA',
    portOfRegistry = 'PANAMA',
    shipType = 'OIL TANKER',
    keelLayingDate = '15/04/2002',
    dateOfBuild = '28/10/2003',
    vesselEntryDate = '12/01/2021',
    classNotation = 'OU 100 A1 OIL TANKER, ESP, AMS, ACCU',
    deadweight = '48910 MT',
    grossTonnage = '27198.00 GT',
    netTonnage = '14520.00 NT',
    length = '182.50 M',
    breadth = '32.20 M',
    depth = '19.10 M',
    radioArea = 'Area A1+A2+A3',
    registeredOwner = 'NAVIGATOR MARITIME INC.',
    ownerAddress = 'TRUST COMPANY COMPLEX, AJELTAKE ROAD, MAJURO, MARSHALL ISLANDS',
    managementCompany = 'GLOBAL VESSEL MANAGEMENT LTD.',
    managementAddress = 'SUITE 401, MARITIME TOWER, PANAMA CITY, PANAMA',
    classStatus = 'ACTIVE',

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
    printDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    utnNumber = `GR-SSR-${Date.now().toString(36).toUpperCase()}`
  } = data;

  let templateHtml = loadTemplateHtml();

  // 1. Build Class Certificates Rows
  const defaultClassCerts = classCertificates.length > 0 ? classCertificates : [
    { description: 'CERTIFICATE OF CLASS (HULL)', code: 'GR-CLC-9241-01', issuedDate: '28/10/2023', validUntil: '27/10/2028', type: 'FT', status: 'VALID' },
    { description: 'CERTIFICATE OF CLASS (MACHINERY)', code: 'GR-CLC-9241-02', issuedDate: '28/10/2023', validUntil: '27/10/2028', type: 'FT', status: 'VALID' }
  ];

  const classCertRowsHtml = defaultClassCerts.map(c => `
    <tr>
      <td>${c.description || 'CERTIFICATE OF CLASS'}</td>
      <td style="font-family:monospace; font-weight:bold;">${c.code || '—'}</td>
      <td>${c.issuedDate || '—'}</td>
      <td>${c.validUntil || '—'}</td>
      <td><span class="badge badge-valid">${c.type || 'FT'}</span></td>
      <td><span class="badge badge-valid">${c.status || 'VALID'}</span></td>
    </tr>
  `).join('');

  // 2. Build Statutory Certificates Rows
  const defaultStatCerts = statutoryCertificates.length > 0 ? statutoryCertificates : [
    { convention: 'LOAD LINE & TONNAGE CONVENTIONS', description: 'INTERNATIONAL LOAD LINE CERTIFICATE', code: 'GR-ILL-9241', issuedDate: '28/10/2023', validUntil: '27/10/2028', type: 'FT', status: 'VALID' },
    { convention: 'LOAD LINE & TONNAGE CONVENTIONS', description: 'INTERNATIONAL TONNAGE CERTIFICATE (1969)', code: 'GR-ITC-9241', issuedDate: '28/10/2023', validUntil: 'PERMANENT', type: 'FT', status: 'VALID' },
    { convention: 'SOLAS CONVENTION', description: 'CARGO SHIP SAFETY CONSTRUCTION CERTIFICATE', code: 'GR-SCC-9241', issuedDate: '28/10/2023', validUntil: '27/10/2028', type: 'FT', status: 'VALID' },
    { convention: 'SOLAS CONVENTION', description: 'CARGO SHIP SAFETY EQUIPMENT CERTIFICATE', code: 'GR-SEC-9241', issuedDate: '28/10/2023', validUntil: '27/10/2028', type: 'FT', status: 'VALID' },
    { convention: 'SOLAS CONVENTION', description: 'CARGO SHIP SAFETY RADIO CERTIFICATE', code: 'GR-SRC-9241', issuedDate: '28/10/2023', validUntil: '27/10/2028', type: 'FT', status: 'VALID' },
    { convention: 'MARPOL CONVENTION', description: 'INTERNATIONAL OIL POLLUTION PREVENTION CERTIFICATE (IOPP)', code: 'GR-IOPP-9241', issuedDate: '28/10/2023', validUntil: '27/10/2028', type: 'FT', status: 'VALID' },
    { convention: 'MARPOL CONVENTION', description: 'INTERNATIONAL SEWAGE POLLUTION PREVENTION CERTIFICATE (ISPP)', code: 'GR-ISPP-9241', issuedDate: '28/10/2023', validUntil: '27/10/2028', type: 'FT', status: 'VALID' },
    { convention: 'MARPOL CONVENTION', description: 'INTERNATIONAL AIR POLLUTION PREVENTION CERTIFICATE (IAPP)', code: 'GR-IAPP-9241', issuedDate: '28/10/2023', validUntil: '27/10/2028', type: 'FT', status: 'VALID' }
  ];

  // Group statutory certs by convention
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
          <td><span class="badge badge-valid">${c.type || 'FT'}</span></td>
          <td><span class="badge badge-valid">${c.status || 'VALID'}</span></td>
        </tr>
      `;
    });
  }

  // 3. Plan Approval Rows
  const planApprovalRowsHtml = `
    <tr>
      <td>SOPEP & SMPEP MANUAL APPROVAL</td>
      <td style="font-family:monospace; font-weight:bold;">GR-PA-SOPEP-01</td>
      <td>15/11/2023</td>
    </tr>
    <tr>
      <td>BALLAST WATER MANAGEMENT PLAN (BWMP)</td>
      <td style="font-family:monospace; font-weight:bold;">GR-PA-BWMP-02</td>
      <td>20/11/2023</td>
    </tr>
  `;

  // 4. Classification Surveys Rows
  const defaultClassSurveys = classificationSurveys.length > 0 ? classificationSurveys : [
    { name: 'ANNUAL HULL SURVEY', lastDate: '24/10/2025', dueDate: '28/10/2026', range: '28/07/2026 - 28/01/2027', postponed: '—', status: 'BEFORE RANGE' },
    { name: 'ANNUAL MACHINERY SURVEY', lastDate: '24/10/2025', dueDate: '28/10/2026', range: '28/07/2026 - 28/01/2027', postponed: '—', status: 'BEFORE RANGE' },
    { name: 'BOILER SURVEY', lastDate: '24/10/2025', dueDate: '28/10/2027', range: '28/04/2027 - 28/10/2027', postponed: '—', status: 'BEFORE RANGE' },
    { name: 'TAILSHAFT SURVEY', lastDate: '28/10/2023', dueDate: '27/10/2028', range: '27/04/2028 - 27/10/2028', postponed: '—', status: 'BEFORE RANGE' }
  ];

  const classSurveysRowsHtml = defaultClassSurveys.map(s => `
    <tr>
      <td style="font-weight:bold;">${s.name}</td>
      <td>${s.lastDate}</td>
      <td>${s.dueDate}</td>
      <td style="font-size:7pt; color:#555;">${s.range}</td>
      <td>${s.postponed}</td>
      <td><span class="badge badge-valid" style="font-size:6.5pt;">${s.status}</span></td>
    </tr>
  `).join('');

  // 5. Statutory Surveys Rows
  const defaultStatSurveys = statutorySurveys.length > 0 ? statutorySurveys : [
    { name: 'LOAD LINE ANNUAL SURVEY', lastDate: '24/10/2025', dueDate: '28/10/2026', range: '28/07/2026 - 28/01/2027', postponed: '—', status: 'BEFORE RANGE' },
    { name: 'SAFETY CONSTRUCTION ANNUAL SURVEY', lastDate: '24/10/2025', dueDate: '28/10/2026', range: '28/07/2026 - 28/01/2027', postponed: '—', status: 'BEFORE RANGE' },
    { name: 'SAFETY EQUIPMENT ANNUAL SURVEY', lastDate: '24/10/2025', dueDate: '28/10/2026', range: '28/07/2026 - 28/01/2027', postponed: '—', status: 'BEFORE RANGE' },
    { name: 'SAFETY RADIO ANNUAL SURVEY', lastDate: '24/10/2025', dueDate: '28/10/2026', range: '28/07/2026 - 28/01/2027', postponed: '—', status: 'BEFORE RANGE' },
    { name: 'IOPP ANNUAL SURVEY', lastDate: '24/10/2025', dueDate: '28/10/2026', range: '28/07/2026 - 28/01/2027', postponed: '—', status: 'BEFORE RANGE' }
  ];

  const statSurveysRowsHtml = defaultStatSurveys.map(s => `
    <tr>
      <td style="font-weight:bold;">${s.name}</td>
      <td>${s.lastDate}</td>
      <td>${s.dueDate}</td>
      <td style="font-size:7pt; color:#555;">${s.range}</td>
      <td>${s.postponed}</td>
      <td><span class="badge badge-valid" style="font-size:6.5pt;">${s.status}</span></td>
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
    { docNo: 'PSC-2025-01', date: '14/03/2025', port: 'SINGAPORE', mou: 'TOKYO MOU', defs: '0', detained: 'NO' },
    { docNo: 'PSC-2024-08', date: '19/11/2024', port: 'ROTTERDAM', mou: 'PARIS MOU', defs: '1 (RECTIFIED)', detained: 'NO' }
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
      <td style="font-weight:bold;">CIRC-042</td>
      <td>01/01/2025</td>
      <td>01/07/2025</td>
      <td>Implementation of revised MARPOL Annex VI regulations concerning CII & EEXI requirements.</td>
    </tr>
    <tr>
      <td style="font-weight:bold;">CIRC-039</td>
      <td>15/06/2024</td>
      <td>01/01/2025</td>
      <td>Mandatory installation of cyber risk management protocols onboard cargo vessels.</td>
    </tr>
  `;

  // 10. Survey History Rows
  const defaultHistory = surveyHistory.length > 0 ? surveyHistory : [
    { type: 'ANNUAL SURVEY', date: '24/10/2025', location: 'BUSAN, KOREA', surveyor: 'CAPT. R. SHARMA', status: 'COMPLETED' },
    { type: 'INTERMEDIATE SURVEY', date: '28/10/2023', location: 'SINGAPORE', surveyor: 'ENG. M. ALVAREZ', status: 'COMPLETED' }
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

  // Substitutions dictionary
  const replacements = {
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
