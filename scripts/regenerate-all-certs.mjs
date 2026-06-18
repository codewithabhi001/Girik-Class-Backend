/**
 * Regenerate ALL 15 certificate HTML templates.
 * CORRECT short forms as per the official list:
 *   AFS, CSSEC, CSSRC, IOPP, ISPPC, IAPP, IEE, ISSC, LL, MLC, IBWMC, ITC, DOC, ISM, CEC
 * Clean minimal design — no heavy navy, professional certificate layout.
 */
import fs from 'fs';
import path from 'path';

const BASE = path.resolve('ONLY CERTIFICATES');

// ── CLEAN CSS ──
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --primary: #122135; /* Dark, authoritative navy */
  --accent:  #29405c; /* Secondary dark tone */
  --accent2: #404040; /* Dark grey for secondary text */
  --bg:      #f0f2f5;
  --card:    #ffffff;
  --border:  #a6a6a6; /* Clean grey borders */
  --text:    #111111;
  --muted:   #333333;
  --light:   #f7f7f7;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { background: #6b6b6b; }
body {
  font-family: 'Inter', sans-serif;
  font-size: 8pt; /* Tighter layout */
  color: var(--text);
  background: #6b6b6b;
  padding: 16px 0 40px;
}

.no-print {
  width: 210mm; margin: 0 auto 10px;
  display: flex; gap: 8px; align-items: center;
}
.btn-print {
  background: var(--primary); color: #fff; border: none;
  padding: 8px 18px; font-size: 9pt; font-weight: 600;
  cursor: pointer; border-radius: 3px;
}
.btn-print:hover { opacity: .9; }
.tag-hint { font-size: 7.5pt; color: #999; margin-left: 10px; }

/* ═══ CERTIFICATE PAGE ═══ */
.cert {
  width: 210mm; min-height: 297mm; background: var(--card);
  margin: 0 auto; box-shadow: 0 4px 32px rgba(0,0,0,.3);
  display: flex; flex-direction: column; position: relative;
  padding: 12mm 15mm; /* Global padding so nothing touches the edges */
  border: none;
}
.cert * { word-wrap: break-word; overflow-wrap: break-word; position: relative; z-index: 1; }

/* GRCLASS Watermark */
.cert::after {
  content: 'GR CLASS';
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  font-family: 'Inter', sans-serif;
  font-size: 120pt;
  font-weight: 800;
  color: var(--primary);
  opacity: 0.03;
  pointer-events: none;
  z-index: 0;
  white-space: nowrap;
}

/* ═══ HEADER ═══ */
.hdr { padding: 0 0 4mm 0; flex-shrink: 0; border-bottom: 3px double var(--primary); margin-bottom: 2mm; }
.hdr-inner {
  display: flex; align-items: flex-start; justify-content: space-between;
}
.logo-wrap {
  width: 100px; flex-shrink: 0; text-align: left;
}
.logo-wrap img { max-width: 85px; max-height: 85px; object-fit: contain; }

.hdr-center { flex: 1; text-align: center; margin: 0 10px; }
.hdr-flag-state {
  font-family: 'EB Garamond', serif;
  font-size: 16pt; font-weight: 700; color: var(--primary);
  text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;
}
.hdr-org {
  font-size: 7.5pt; font-weight: 700; letter-spacing: 2.5px;
  text-transform: uppercase; color: var(--muted); margin-bottom: 6px;
}
.hdr-certname {
  font-family: 'EB Garamond', serif;
  font-size: 15pt; font-weight: 700; color: var(--primary);
  line-height: 1.1; margin-bottom: 4px; text-transform: uppercase;
}
.hdr-convention {
  font-size: 7pt; color: var(--muted); line-height: 1.4; max-width: 460px; margin: 0 auto;
}

.hdr-meta { text-align: right; flex-shrink: 0; min-width: 150px; }
.hdr-meta-label {
  font-size: 5.5pt; letter-spacing: 1px; text-transform: uppercase;
  color: var(--muted); display: block;
}
.hdr-meta-no {
  font-family: 'EB Garamond', serif;
  font-size: 11pt; font-weight: 700; color: var(--primary);
  display: block; line-height: 1.2; margin-bottom: 2px;
  white-space: nowrap;
}
.hdr-meta-form { font-size: 5.5pt; color: var(--muted); font-weight: 600; }

/* ═══ AUTHORITY ═══ */
.authority {
  background: transparent; border-bottom: 1px solid var(--border);
  padding: 3mm 0; text-align: center;
  font-size: 8pt; color: var(--text); line-height: 1.5;
}
.authority strong { color: var(--primary); font-weight: 700; text-transform: uppercase; }

/* ═══ BODY ═══ */
.body { padding: 3mm 0; flex: 1; display: flex; flex-direction: column; }

.sec-label {
  font-size: 6.5pt; font-weight: 700; letter-spacing: 1.5px;
  text-transform: uppercase; color: var(--primary);
  padding-bottom: 2px; border-bottom: 1px solid var(--primary);
  margin: 3mm 0 2mm;
}

/* Vessel table */
.vtable { width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 1.5mm; }
.vtable th {
  background: var(--light); color: var(--text);
  font-size: 6pt; font-weight: 700; letter-spacing: .5px; text-transform: uppercase;
  padding: 3px 6px; border: 1px solid var(--border); text-align: left;
}
.vtable td {
  padding: 4px 6px; border: 1px solid var(--border); background: transparent;
  vertical-align: middle;
}
.vtable .val {
  font-family: 'EB Garamond', serif; font-size: 10.5pt; font-weight: 600;
  color: var(--primary); line-height: 1.1; text-transform: uppercase;
}

/* Data table */
.mtable { width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 1.5mm; }
.mtable th {
  background: var(--light); color: var(--text);
  font-size: 6.5pt; font-weight: 700; text-transform: uppercase;
  padding: 4px 6px; border: 1px solid var(--border); text-align: left;
}
.mtable td { padding: 4px 6px; border: 1px solid var(--border); background: transparent; }
.mtable .m-val {
  font-family: 'EB Garamond', serif; font-size: 10pt; font-weight: 600; color: var(--primary);
}

/* Checkbox items */
.chk-list { display: flex; flex-direction: column; gap: 2px; margin-bottom: 1.5mm; }
.chk-item {
  display: flex; align-items: flex-start; gap: 6px;
  padding: 3px 6px; border: 1px solid transparent;
  font-size: 8pt; line-height: 1.4; color: var(--text);
}
.chk-item.checked { background: var(--light); border-color: var(--border); font-weight: 500; }
.checkbox {
  width: 10px; height: 10px; border: 1px solid var(--primary); flex-shrink: 0; margin-top: 2px;
  background: #fff; position: relative;
}
.chk-item.checked .checkbox { background: var(--primary); }
.chk-item.checked .checkbox::after {
  content: ''; position: absolute; left: 2px; top: 0;
  width: 4px; height: 6px;
  border-right: 1.5px solid #fff; border-bottom: 1.5px solid #fff;
  transform: rotate(38deg);
}
.chk-text b { color: var(--primary); }
.inline-val {
  display: inline-block; font-family: 'EB Garamond', serif;
  font-size: 10pt; font-weight: 600; color: var(--primary);
  border-bottom: 1px dashed var(--primary);
  padding: 0 3px; min-width: 60px; line-height: 1.1; vertical-align: bottom;
}

/* Certify box */
.certify {
  border: 1px solid var(--border); border-left: 4px solid var(--primary);
  background: var(--light); padding: 5px 8px;
  margin: 1.5mm 0 2mm; font-size: 8pt; line-height: 1.5;
}
.certify-title {
  font-weight: 700; color: var(--primary); font-size: 8pt;
  margin-bottom: 2px; text-transform: uppercase; letter-spacing: .5px;
}
.certify ul { margin-left: 16px; color: var(--text); }
.certify ul li { margin-bottom: 1px; }
.certify ul ul { margin-left: 14px; }

.cert-desc { font-size: 8pt; line-height: 1.5; color: var(--text); margin-bottom: 1.5mm; }

/* Validity grid */
.vgrid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5mm; margin-bottom: 1.5mm; }
.vgrid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5mm; margin-bottom: 1.5mm; }
.vcell { border: 1px solid var(--border); padding: 3px 6px; background: transparent; }
.vcell.hi { border: 1px solid var(--primary); background: var(--light); }
.vc-label {
  font-size: 5.5pt; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
  color: var(--muted); display: block; margin-bottom: 1px;
}
.vc-val {
  font-family: 'EB Garamond', serif; font-size: 11pt; font-weight: 600;
  color: var(--primary); line-height: 1.2; text-transform: uppercase;
}
.vcell.hi .vc-val { color: var(--primary); }

/* Footnotes */
.footnotes {
  border-top: 1px solid var(--border); padding: 1.5mm 0;
  font-size: 6pt; color: var(--muted); line-height: 1.4;
}
.footnotes p { margin-bottom: 1px; }
sup { color: var(--primary); font-weight: 700; font-size: 5.5pt; }

/* Generated notice */
.gen-notice {
  background: var(--light); border: 1px solid var(--border);
  padding: 3mm 5mm; display: flex; align-items: center; justify-content: center;
  gap: 6px; flex-shrink: 0; margin-top: auto; border-radius: 2px;
}
.gen-notice-text {
  font-size: 6.5pt; color: var(--muted);
  letter-spacing: .5px; line-height: 1.2; text-align: center; text-transform: uppercase;
}
.gen-notice-text strong { color: var(--primary); font-weight: 700; }

/* ═══ FOOTER ═══ */
.ftr { background: transparent; flex-shrink: 0; padding-top: 4mm; }
.ftr-inner {
  display: grid;
  grid-template-columns: 1fr auto; gap: 6mm; align-items: end;
}
.sig-area { color: var(--text); position: relative; min-width: 180px; }
.sig-line { border-bottom: 1px solid var(--primary); height: 1px; margin-bottom: 4px; width: 100%; max-width: 200px; }
.sig-label {
  font-size: 6pt; font-weight: 700; letter-spacing: 1.5px;
  text-transform: uppercase; color: var(--primary); margin-bottom: 2px;
}
.sig-name {
  font-family: 'EB Garamond', serif; font-size: 11pt;
  color: var(--primary); font-style: italic; line-height: 1.2;
}
.sig-desig { font-size: 6.5pt; font-weight: 600; color: var(--muted); margin-top: 1px; text-transform: uppercase; }
.ftr-contact { text-align: right; font-size: 6.5pt; color: var(--muted); line-height: 1.5; }
.ftr-contact strong {
  display: block; color: var(--primary); font-size: 8pt;

  font-weight: 700; letter-spacing: .4px; margin-bottom: 2px;
}
.ftr-contact a { color: var(--accent2); text-decoration: none; font-weight: 500; }

/* ═══ PRINT ═══ */
@page { size: A4; margin: 0; }
@media print {
  html, body { background: none !important; padding: 0 !important; margin: 0 !important; }
  .no-print { display: none !important; }
  .cert { margin: 0; box-shadow: none; width: 210mm; min-height: 297mm; overflow: hidden; page-break-inside: avoid; }
  .page-break { page-break-before: always; }
}

/* ═══ ENDORSEMENTS (FT ONLY) ═══ */
.endorsement-page {
  width: 210mm; min-height: 297mm; background: var(--card);
  margin: 10px auto 0; box-shadow: 0 4px 32px rgba(0,0,0,.3);
  position: relative;
  display: flex; flex-direction: column;
  padding: 12mm 15mm;
  border: none;
}
.endorsement-page::after {
  content: 'GR CLASS';
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  font-family: 'Inter', sans-serif;
  font-size: 120pt;
  font-weight: 800;
  color: var(--primary);
  opacity: 0.03;
  pointer-events: none;
  z-index: 0;
  white-space: nowrap;
}
@media print {
  .endorsement-page { margin: 0; box-shadow: none; page-break-before: always; }
}

.end-title {
  font-family: 'EB Garamond', serif; font-size: 14pt; font-weight: 700;
  color: var(--primary); text-align: center; margin: 8mm 0 4mm;
}
.end-subtitle {
  font-size: 8.5pt; color: var(--muted); text-align: center; margin-bottom: 6mm;
  padding: 0 12mm; line-height: 1.6;
}
.end-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 4mm 8mm;
  padding: 0 10mm; margin-bottom: 6mm;
}
.end-box {
  border: 1px solid var(--border); background: #fff; padding: 4mm;
}
.end-box-title {
  font-size: 7.5pt; font-weight: 700; text-transform: uppercase;
  letter-spacing: 1px; color: var(--accent2); border-bottom: 1px solid var(--border);
  padding-bottom: 3px; margin-bottom: 4mm;
}
.end-row {
  display: flex; align-items: flex-end; margin-bottom: 3.5mm; font-size: 8pt;
}
.end-label { width: 80px; color: var(--muted); }
.end-line { flex: 1; border-bottom: 1px dashed #ccc; height: 16px; position: relative; }
.end-line span {
  position: absolute; bottom: 1px; left: 5px; font-family: 'EB Garamond', serif;
  font-size: 11pt; color: var(--primary);
}
.end-full { grid-column: 1 / -1; }
`.trim();

// ── Footer HTML (shared) ──
const FOOTER = `
  <div class="gen-notice">
    <svg width="10" height="11" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: 0.6; flex-shrink: 0; margin-right: 2px; vertical-align: middle;">
      <path d="M10.5 5H9.5V3.5C9.5 1.57 7.93 0 6 0C4.07 0 2.5 1.57 2.5 3.5V5H1.5C0.67 5 0 5.67 0 6.5V12.5C0 13.33 0.67 14 1.5 14H10.5C11.33 14 12 13.33 12 12.5V6.5C12 5.67 11.33 5 10.5 5ZM3.8 3.5C3.8 2.29 4.79 1.3 6 1.3C7.21 1.3 8.2 2.29 8.2 3.5V5H3.8V3.5ZM6.75 9.85V11.5H5.25V9.85C4.8 9.57 4.5 9.07 4.5 8.5C4.5 7.67 5.17 7 6 7C6.83 7 7.5 7.67 7.5 8.5C7.5 9.07 7.2 9.57 6.75 9.85Z" fill="#1b365d"/>
    </svg>
    <span class="gen-notice-text">
      Computer-generated certificate — does not require a physical signature.&nbsp;&nbsp;·&nbsp;&nbsp;
      Verify at <strong>grclass.com</strong>
    </span>
  </div>
  <div class="ftr">
    <div class="ftr-accent"></div>
    <div class="ftr-inner">
      <div class="sig-area">
        <div style="position: relative; height: 65px; margin-bottom: 5px; width: 240px;">
          <!-- Signature Image -->
          <div class="sig-img-wrap" style="position: absolute; left: 10px; bottom: 0; z-index: 2;">
            <img src="{signature}" onerror="this.src='../../../src/modules/payments/Gr-class-sign.png'; this.onerror=function(){ this.src='./src/modules/payments/Gr-class-sign.png'; this.onerror=function(){ this.style.display='none'; } };" alt="Signature" style="max-height: 50px; max-width: 100px; object-fit: contain; display: block;">
          </div>
          <!-- Stamp Image -->
          <div class="stamp-img-wrap" style="position: absolute; left: 110px; bottom: -15px; z-index: 1; opacity: 0.85;">
            <img src="{stamp}" onerror="this.src='../../../src/modules/payments/Gr-class-stamp.png'; this.onerror=function(){ this.src='./src/modules/payments/Gr-class-stamp.png'; this.onerror=function(){ this.style.display='none'; } };" alt="Official Stamp" style="max-height: 70px; max-width: 105px; object-fit: contain; display: block;">
          </div>
        </div>
        <div class="sig-line"></div>
        <div class="sig-label">GR CLASS Representative</div>
        <div class="sig-name">{surveyor_name}</div>
        <div class="sig-desig">GR CLASS Representative · Surveyor</div>
      </div>
      <div class="ftr-contact" style="display:flex;gap:12px;align-items:center;justify-content:flex-end">
        <div style="width:64px;height:64px;flex-shrink:0;background:#fff;padding:2px;border:1px solid var(--border)">
          <style>.qr-wrap img{width:60px!important;height:60px!important;display:block}</style>
          <div class="qr-wrap">{qr_code}</div>
        </div>
        <div style="text-align:right">
          <strong>GR CLASS</strong>
          <a href="mailto:info@grclass.com">info@grclass.com</a><br>
          <a href="https://www.grclass.com">www.grclass.com</a><br>
          Classified for Standard (GR CLASS)<br>
          Recognized Organization · Global Marine Services
        </div>
      </div>
    </div>
  </div>`;

// ── Build certificate HTML ──
function buildCert({ title, shortCode, formCode, convention, vesselRows, bodyContent, footnotes }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>GR Class – ${shortCode}-ST Certificate</title>
<style>
${CSS}
</style>
</head>
<body>

<div class="no-print">
  <button class="btn-print" onclick="window.print()">🖨&nbsp; Print / Save PDF</button>
  <span class="tag-hint">Tags like {tag} are replaced at generation time.</span>
</div>

<div class="cert">

  <!-- HEADER -->
  <div class="hdr">
    <div class="hdr-accent"></div>

    <div class="hdr-inner">
      <div class="logo-wrap">
        <img src="https://grclass.com/grclass-logo.webp" alt="GR Class Logo">
      </div>
      <div class="hdr-center">
        <div class="hdr-flag-state">{flag_state}</div>
        <div class="hdr-org">{certificate_term}</div>
        <div class="hdr-certname">${title}</div>
        <div class="hdr-convention">${convention}</div>
      </div>
      <div class="hdr-meta">
        <span class="hdr-meta-label">${shortCode} No.</span>
        <span class="hdr-meta-no">{certificate_number}</span>
        <div class="hdr-meta-form">Form ${formCode} · Approved by: GM</div>
      </div>
    </div>
    <div class="hdr-accent"></div>
  </div>

  <!-- AUTHORITY -->
  <div class="authority">
    Issued under the authority of the Government of <strong>{flag_state}</strong><br>
    By <strong>GR CLASS</strong> — Classified for Standard (GR CLASS) · Recognized Organization (RO)
  </div>

  <!-- BODY -->
  <div class="body">

    <div class="sec-label">Vessel Particulars</div>
    <table class="vtable">
${vesselRows}
    </table>

${bodyContent}

    <div class="sec-label">Dates &amp; Validity</div>
    <div class="vgrid">
      <div class="vcell">
        <span class="vc-label">Survey Completion Date</span>
        <div class="vc-val">{survey_completion_date}</div>
      </div>
      <div class="vcell">
        <span class="vc-label">Date of Issue</span>
        <div class="vc-val">{issue_date}</div>
      </div>
      <div class="vcell hi">
        <span class="vc-label">Valid Until</span>
        <div class="vc-val">{expiry_date}</div>
      </div>
    </div>
    <div class="vgrid-2">
      <div class="vcell">
        <span class="vc-label">Place of Issue</span>
        <div class="vc-val">{place_of_survey}</div>
      </div>
      <div class="vcell">
        <span class="vc-label">Page</span>
        <div class="vc-val">1 of 1</div>
      </div>
    </div>

    <div class="footnotes">
${footnotes}
    </div>

  </div>

${FOOTER}

</div>
</body>
</html>`;
}

// ── FT Endorsements HTML ──
const FT_ENDORSEMENTS = `
<div class="endorsement-page">
  <div class="end-title">Endorsement for Annual and Intermediate Surveys</div>
  <div class="end-subtitle">THIS IS TO CERTIFY that at a survey required by the Convention the ship was found to comply with the relevant provisions of the Convention:</div>
  
  <div class="end-grid">
    <div class="end-box">
      <div class="end-box-title">Annual Survey</div>
      <div class="end-row"><div class="end-label">Signed</div><div class="end-line"><span>{surveyor_annual}</span></div></div>
      <div class="end-row"><div class="end-label">Place</div><div class="end-line"><span>{place_annual}</span></div></div>
      <div class="end-row"><div class="end-label">Date</div><div class="end-line"><span>{date_annual}</span></div></div>
      <div class="end-row"><div class="end-label">Stamp</div><div style="flex:1;height:40px;border:1px dashed #ccc"></div></div>
    </div>
    
    <div class="end-box">
      <div class="end-box-title">Annual / Intermediate Survey</div>
      <div class="end-row"><div class="end-label">Signed</div><div class="end-line"><span>{surveyor_int1}</span></div></div>
      <div class="end-row"><div class="end-label">Place</div><div class="end-line"><span>{place_int1}</span></div></div>
      <div class="end-row"><div class="end-label">Date</div><div class="end-line"><span>{date_int1}</span></div></div>
      <div class="end-row"><div class="end-label">Stamp</div><div style="flex:1;height:40px;border:1px dashed #ccc"></div></div>
    </div>

    <div class="end-box">
      <div class="end-box-title">Annual / Intermediate Survey</div>
      <div class="end-row"><div class="end-label">Signed</div><div class="end-line"><span>{surveyor_int2}</span></div></div>
      <div class="end-row"><div class="end-label">Place</div><div class="end-line"><span>{place_int2}</span></div></div>
      <div class="end-row"><div class="end-label">Date</div><div class="end-line"><span>{date_int2}</span></div></div>
      <div class="end-row"><div class="end-label">Stamp</div><div style="flex:1;height:40px;border:1px dashed #ccc"></div></div>
    </div>

    <div class="end-box">
      <div class="end-box-title">Annual Survey</div>
      <div class="end-row"><div class="end-label">Signed</div><div class="end-line"><span>{surveyor_annual2}</span></div></div>
      <div class="end-row"><div class="end-label">Place</div><div class="end-line"><span>{place_annual2}</span></div></div>
      <div class="end-row"><div class="end-label">Date</div><div class="end-line"><span>{date_annual2}</span></div></div>
      <div class="end-row"><div class="end-label">Stamp</div><div style="flex:1;height:40px;border:1px dashed #ccc"></div></div>
    </div>
  </div>
</div>

<div class="endorsement-page">
  <div class="end-title">Additional Endorsements</div>
  
  <div class="end-grid">
    <div class="end-box end-full">
      <div class="end-box-title">Endorsement to extend the Certificate if valid for less than 5 years</div>
      <div class="end-subtitle" style="text-align:left;padding:0;margin-bottom:2mm">The ship complies with the relevant provisions of the Convention, and this Certificate shall be accepted as valid until <strong>{extension_date_1}</strong></div>
      <div style="display:flex;gap:4mm">
        <div style="flex:1">
          <div class="end-row"><div class="end-label">Signed</div><div class="end-line"></div></div>
          <div class="end-row"><div class="end-label">Place</div><div class="end-line"></div></div>
          <div class="end-row"><div class="end-label">Date</div><div class="end-line"></div></div>
        </div>
        <div style="flex:1;height:70px;border:1px dashed #ccc;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:8pt">Stamp</div>
      </div>
    </div>

    <div class="end-box end-full">
      <div class="end-box-title">Endorsement where the renewal survey has been completed</div>
      <div class="end-subtitle" style="text-align:left;padding:0;margin-bottom:2mm">The ship complies with the relevant provisions of the Convention, and this Certificate shall be accepted as valid until <strong>{extension_date_2}</strong></div>
      <div style="display:flex;gap:4mm">
        <div style="flex:1">
          <div class="end-row"><div class="end-label">Signed</div><div class="end-line"></div></div>
          <div class="end-row"><div class="end-label">Place</div><div class="end-line"></div></div>
          <div class="end-row"><div class="end-label">Date</div><div class="end-line"></div></div>
        </div>
        <div style="flex:1;height:70px;border:1px dashed #ccc;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:8pt">Stamp</div>
      </div>
    </div>
    
    <div class="end-box end-full">
      <div class="end-box-title">Endorsement for advancement of anniversary date</div>
      <div class="end-subtitle" style="text-align:left;padding:0;margin-bottom:2mm">In accordance with the Convention, the new anniversary date is <strong>{new_anniversary_date}</strong></div>
      <div style="display:flex;gap:4mm">
        <div style="flex:1">
          <div class="end-row"><div class="end-label">Signed</div><div class="end-line"></div></div>
          <div class="end-row"><div class="end-label">Place</div><div class="end-line"></div></div>
          <div class="end-row"><div class="end-label">Date</div><div class="end-line"></div></div>
        </div>
        <div style="flex:1;height:70px;border:1px dashed #ccc;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:8pt">Stamp</div>
      </div>
    </div>
  </div>
</div>
`;

// Helper to make vessel table rows
function vRows(r1h, r1v, r2h, r2v) {
  let html = '      <tr>\n';
  r1h.forEach(h => { html += `        <th>${h}</th>\n`; });
  html += '      </tr>\n      <tr>\n';
  r1v.forEach(v => { html += `        <td><span class="val">${v}</span></td>\n`; });
  html += '      </tr>\n      <tr>\n';
  r2h.forEach(h => { html += `        <th>${h}</th>\n`; });
  html += '      </tr>\n      <tr>\n';
  r2v.forEach(v => { html += `        <td><span class="val">${v}</span></td>\n`; });
  html += '      </tr>';
  return html;
}

const STD_VESSEL = vRows(
  ['Name of Ship', 'Distinctive No. / Letters', 'Port of Registry', 'Gross Tonnage'],
  ['{vessel_name}', '{call_sign}', '{port_of_registry}', '{gross_tonnage}'],
  ['IMO Number <sup>1</sup>', 'Ship Type', 'Net Tonnage', 'Deadweight'],
  ['{imo_number}', '{ship_type}', '{net_tonnage}', '{deadweight}']
);

const FN1 = '      <p><sup>1</sup> In accordance with IMO Ship Identification Number Scheme adopted by the Organization by Resolution A.600(15).</p>';

// ═══════════════════════════════════════════
// ALL 15 CERTIFICATES (correct short forms)
// ═══════════════════════════════════════════

const CERTS = [

  // 1. AFS
  {
    folder: 'ANTI FOULING SYSTEM CERTIFICATE',
    shortCode: 'AFS',
    title: 'International Anti-Fouling System Certificate',
    formCode: 'AFS',
    convention: 'Issued under the International Convention on the Control of Harmful Anti-Fouling Systems on Ships (AFS Convention, 2001)',
    vesselRows: STD_VESSEL,
    bodyContent: `
    <p class="cert-desc" style="margin-bottom:3mm">When a Certificate has been previously issued, this Certificate replaces the certificate dated: <strong>{previous_cert_no}</strong> ({previous_cert_date})</p>
    <div class="sec-label">Anti-Fouling System Status</div>
    <div class="chk-list">
      <div class="chk-item {afs_option_1_check}">
        <div class="checkbox"></div>
        <div class="chk-text">An anti-fouling system controlled under Annex 1 has <b>not been applied</b> during or after construction of this ship.</div>
      </div>
      <div class="chk-item {afs_option_2_check}">
        <div class="checkbox"></div>
        <div class="chk-text">An anti-fouling system controlled under Annex 1 has been applied previously, but has been <b>removed</b> by<sup>2</sup> <span class="inline-val">{facility_name}</span> on<sup>3</sup> <span class="inline-val">{facility_date}</span></div>
      </div>
      <div class="chk-item {afs_option_3_check}">
        <div class="checkbox"></div>
        <div class="chk-text">An anti-fouling system controlled under Annex 1 has been applied previously, but has been <b>covered with a sealer coat</b> applied by<sup>2</sup> <span class="inline-val">{facility_name}</span> on<sup>3</sup> <span class="inline-val">{facility_date}</span></div>
      </div>
      <div class="chk-item {afs_option_4_check}">
        <div class="checkbox"></div>
        <div class="chk-text">An anti-fouling system controlled under Annex 1 was applied prior to<sup>3</sup> <span class="inline-val">{facility_date}</span> but must be removed or covered prior to<sup>4</sup> <span class="inline-val">{compliance_deadline}</span></div>
      </div>
    </div>
    <div class="sec-label">Certification</div>
    <div class="certify">
      <div class="certify-title">This is to certify that:</div>
      <ul>
        <li>The ship has been surveyed in accordance with regulation 1 of the Annex 4 of the Convention; and</li>
        <li>The survey shows that the anti-fouling system on the ship complies with the applicable requirements of Annex 1 to the Convention.</li>
      </ul>
    </div>`,
    footnotes: `${FN1}
      <p><sup>2</sup> Insert name of the facility.</p>
      <p><sup>3</sup> Insert date.</p>
      <p><sup>4</sup> Insert date of expiration of any implementation period specified in article 4(2) of Annex 1.</p>`,
  },

  // 2. CSSEC
  {
    folder: 'CARGO SHIP SAFETY EQUIPMENT CERTIFICATE',
    shortCode: 'CSSEC',
    title: 'Cargo Ship Safety Equipment Certificate',
    formCode: 'CSSEC',
    convention: 'Issued under the provisions of the International Convention for the Safety of Life at Sea (SOLAS), 1974, as amended. Supplemented by a Record of Equipment (Form E)',
    vesselRows: vRows(
      ['Name of Ship', 'Distinctive No. / Letters', 'Port of Registry', 'Gross Tonnage'],
      ['{vessel_name}', '{call_sign}', '{port_of_registry}', '{gross_tonnage}'],
      ['IMO Number <sup>2</sup>', 'Deadweight (metric tons) <sup>1</sup>', 'Length of Ship (Reg. III/3.12)', 'Date of Keel Laying'],
      ['{imo_number}', '{deadweight}', '{ship_length}', '{keel_date}']
    ),
    bodyContent: `
    <div class="sec-label">Type of Ship <sup>3</sup></div>
    <div class="chk-list">
      <div class="chk-item {ship_type_bulk_check}"><div class="checkbox"></div><div class="chk-text">Bulk Carrier</div></div>
      <div class="chk-item {ship_type_oil_check}"><div class="checkbox"></div><div class="chk-text">Oil Tanker</div></div>
      <div class="chk-item {ship_type_chemical_check}"><div class="checkbox"></div><div class="chk-text">Chemical Tanker</div></div>
      <div class="chk-item {ship_type_gas_check}"><div class="checkbox"></div><div class="chk-text">Gas Carrier</div></div>
      <div class="chk-item {ship_type_cargo_check}"><div class="checkbox"></div><div class="chk-text">Cargo ship other than any of the above</div></div>
    </div>
    <div class="sec-label">Certification</div>
    <div class="certify">
      <div class="certify-title">This is to certify:</div>
      <ul>
        <li>That the ship has been surveyed in accordance with the requirements of regulation I/8 of the Convention.</li>
        <li>The ship complied with the requirements of the Convention as regards fire safety systems and appliances and fire control plans.</li>
        <li>The life-saving appliances and the equipment of the lifeboats, liferafts and rescue boats were provided in accordance with the requirements of the Convention.</li>
        <li>The ship was provided with a line-throwing appliance and radio installations used in life-saving appliances in accordance with the requirements of the Convention.</li>
        <li>The ship complied with the requirements of the Convention as regards shipborne navigational equipment, means of embarkation for pilots and nautical publications.</li>
        <li>The ship was provided with lights, shapes and means of making sound signals and distress signals in accordance with the requirements of the Convention and the International Regulations for Preventing Collisions at Sea in force.</li>
        <li>In all other respects the ship complied with the relevant requirements of the Convention.</li>
        <li>The ship was/was not<sup>4</sup> subjected to an alternative design and arrangements in pursuance of regulation(s) II-2/17 / III/38<sup>4</sup> of the Convention.</li>
      </ul>
    </div>
    <p class="cert-desc">That an Exemption Certificate has / has not<sup>3</sup> been issued.</p>`,
    footnotes: `      <p><sup>1</sup> Alternatively, the particulars of the ship may be placed horizontally in boxes.</p>
${FN1.replace('<sup>1</sup>', '<sup>2</sup>')}
      <p><sup>3</sup> Select as appropriate.</p>
      <p><sup>4</sup> Delete as appropriate.</p>
      <p><sup>5</sup> Refer to the 1983 amendments to SOLAS (MSC.6(48)).</p>`,
  },

  // 3. CSSRC
  {
    folder: 'CARGO SHIP SAFETY RADIO CERTIFICATE',
    shortCode: 'CSSRC',
    title: 'Cargo Ship Safety Radio Certificate',
    formCode: 'CSSRC',
    convention: 'Issued under the provisions of the International Convention for the Safety of Life at Sea (SOLAS), 1974, as amended. Supplemented by a Record of Equipment (Form R)',
    vesselRows: vRows(
      ['Name of Ship', 'Distinctive No. / Letters', 'Port of Registry', 'Gross Tonnage'],
      ['{vessel_name}', '{call_sign}', '{port_of_registry}', '{gross_tonnage}'],
      ['IMO Number <sup>1</sup>', 'Sea Areas (Reg. IV/2)', 'Date of Keel Laying', 'Ship Type'],
      ['{imo_number}', '{sea_areas}', '{keel_date}', '{ship_type}']
    ),
    bodyContent: `
    <div class="sec-label">Certification</div>
    <div class="certify">
      <div class="certify-title">This is to certify:</div>
      <ul>
        <li>That the ship has been surveyed in accordance with the requirements of regulation I/9 of the Convention.</li>
        <li>That the survey showed that:
          <ul>
            <li>The ship complied with the requirements of the Convention as regards radio installations;</li>
            <li>The functioning of the radio installations used in life-saving appliances complied with the requirements of the Convention.</li>
          </ul>
        </li>
        <li>That an Exemption Certificate has / has not<sup>2</sup> been issued.</li>
      </ul>
    </div>`,
    footnotes: `${FN1}
      <p><sup>2</sup> Select as appropriate.</p>
      <p><sup>3</sup> Insert the date of expiry as specified.</p>`,
  },

  // 4. IOPP
  {
    folder: 'INTERNATIONAL OIL POLLUTION PREVENTION CERTIFICATE',
    shortCode: 'IOPP',
    title: 'International Oil Pollution Prevention Certificate',
    formCode: 'IOPP',
    convention: 'Issued under the provisions of the International Convention for the Prevention of Pollution from Ships (MARPOL), 1973, as modified by the Protocol of 1978 relating thereto, as amended. Supplemented by a Record of Construction and Equipment',
    vesselRows: vRows(
      ['Name of Ship', 'Distinctive No. / Letters', 'Port of Registry', 'Gross Tonnage'],
      ['{vessel_name}', '{call_sign}', '{port_of_registry}', '{gross_tonnage}'],
      ['IMO Number <sup>2</sup>', 'Deadweight (metric tons) <sup>1</sup>', 'Type of Ship <sup>3</sup>', ''],
      ['{imo_number}', '{deadweight}', '{ship_type}', '']
    ),
    bodyContent: `
    <div class="sec-label">Type of Ship <sup>3</sup></div>
    <div class="chk-list">
      <div class="chk-item {ship_type_oil_check}"><div class="checkbox"></div><div class="chk-text">Oil Tanker</div></div>
      <div class="chk-item {ship_type_cargo_tanks_check}"><div class="checkbox"></div><div class="chk-text">Ship other than an oil tanker with cargo tanks coming under regulation 2.2 of Annex I of the Convention</div></div>
      <div class="chk-item {ship_type_other_check}"><div class="checkbox"></div><div class="chk-text">Ship other than any of the above</div></div>
    </div>
    <div class="sec-label">Certification</div>
    <div class="certify">
      <div class="certify-title">This is to certify:</div>
      <ul>
        <li>That the ship has been surveyed in accordance with regulation 6 of Annex I of the Convention; and</li>
        <li>That the survey shows that the structure, equipment, systems, fittings, arrangements and material of the ship and the condition thereof are in all respects satisfactory and that the ship complies with the applicable requirements of Annex I of the Convention.</li>
      </ul>
    </div>`,
    footnotes: `      <p><sup>1</sup> For Oil Tankers.</p>
      <p><sup>2</sup> Refer to the IMO Ship Identification Number Scheme adopted by the Organization by Resolution A.600(15).</p>
      <p><sup>3</sup> Select as appropriate.</p>
      <p><sup>4</sup> Insert the date of expiry as specified by the Administration in accordance with Regulation 10.1 of Annex I of the Convention.</p>`,
  },

  // 5. ISPPC
  {
    folder: 'INTERNATIONAL SEWAGE POLLUTION PREVENTION CERTIFICATE',
    shortCode: 'ISPPC',
    title: 'International Sewage Pollution Prevention Certificate',
    formCode: 'ISPPC',
    convention: 'Issued under the provisions of Annex IV of the International Convention for the Prevention of Pollution from Ships (MARPOL), 1973, as modified by the Protocol of 1978, and as amended by resolution MEPC 115(51)',
    vesselRows: vRows(
      ['Name of Ship', 'Distinctive No. / Letters', 'Port of Registry', 'Gross Tonnage'],
      ['{vessel_name}', '{call_sign}', '{port_of_registry}', '{gross_tonnage}'],
      ['IMO Number <sup>1</sup>', 'No. of Persons Certified', 'Type of Ship', 'Date of Keel Laying'],
      ['{imo_number}', '{persons_certified}', '{ship_type}', '{keel_date}']
    ),
    bodyContent: `
    <div class="sec-label">Type of Ship (Regulation 11.3)</div>
    <div class="chk-list">
      <div class="chk-item {ship_type_passenger_check}"><div class="checkbox"></div><div class="chk-text">New/Existing Passenger Ship</div></div>
      <div class="chk-item {ship_type_other_check}"><div class="checkbox"></div><div class="chk-text">Ship other than a passenger ship</div></div>
    </div>
    <div class="sec-label">Sewage Treatment Equipment</div>
    <table class="mtable">
      <tr><th>Type of Sewage Treatment Plant</th><th>Name of Manufacturer</th></tr>
      <tr><td><span class="m-val">{sewage_plant_type}</span></td><td><span class="m-val">{sewage_manufacturer}</span></td></tr>
    </table>
    <table class="mtable">
      <tr><th>Type of Comminuter</th><th>Name of Comminuter</th><th>Standard After Disinfection</th></tr>
      <tr><td><span class="m-val">{comminuter_type}</span></td><td><span class="m-val">{comminuter_name}</span></td><td><span class="m-val">{disinfection_standard}</span></td></tr>
    </table>
    <table class="mtable">
      <tr><th>Total Capacity of Holding Tank (m³)</th><th>Location</th></tr>
      <tr><td><span class="m-val">{holding_tank_capacity}</span></td><td><span class="m-val">{holding_tank_location}</span></td></tr>
    </table>
    <p class="cert-desc">Pipeline for the discharge of sewage to a reception facility, fitted with a standard shore connection.</p>
    <div class="sec-label">Certification</div>
    <div class="certify">
      <div class="certify-title">This is to certify:</div>
      <ul>
        <li>That the ship is equipped with a sewage treatment plant / comminuter / holding tank<sup>2</sup> and a discharge pipeline in compliance with regulations 9 and 10 of Annex IV of the Convention.</li>
        <li>The ship has been surveyed in accordance with regulation 4 of Annex IV of the Convention.</li>
        <li>That the survey shows that the structure, equipment, systems, fittings, arrangements and material of the ship and the condition thereof are in all respects satisfactory and that the ship complies with the applicable requirements of Annex IV of the Convention.</li>
      </ul>
    </div>`,
    footnotes: `${FN1}
      <p><sup>2</sup> Select as appropriate.</p>
      <p><sup>3</sup> Insert the date of expiry as specified by the Administration in accordance with regulation 8.1 of Annex IV of the Convention.</p>`,
  },

  // 6. IAPP
  {
    folder: 'International Air Pollution Prevention Certificate',
    shortCode: 'IAPP',
    title: 'International Air Pollution Prevention Certificate',
    formCode: 'IAPP',
    convention: 'Issued under the provisions of the Protocol of 1997, as amended, to the International Convention for the Prevention of Pollution from Ships (MARPOL), 1973/1978 (Annex VI)',
    vesselRows: STD_VESSEL,
    bodyContent: `
    <div class="sec-label">Certification</div>
    <div class="certify">
      <div class="certify-title">This is to certify:</div>
      <ul>
        <li>That the ship has been surveyed in accordance with regulation 5 of Annex VI of the Convention; and</li>
        <li>That the survey shows that the equipment, systems, fittings, arrangements and materials fully comply with the applicable requirements of Annex VI of the Convention.</li>
      </ul>
    </div>`,
    footnotes: `${FN1}
      <p><sup>2</sup> Insert the date of expiry as specified by the Administration in accordance with regulation 9.1 of Annex VI of the Convention.</p>`,
  },

  // 7. IEE
  {
    folder: 'International Energy Efficiency Certificate',
    shortCode: 'IEE',
    title: 'International Energy Efficiency Certificate',
    formCode: 'IEE',
    convention: 'Issued under the provisions of Annex VI, Chapter 4 of the International Convention for the Prevention of Pollution from Ships (MARPOL), as amended by resolution MEPC.203(62)',
    vesselRows: STD_VESSEL,
    bodyContent: `
    <div class="sec-label">Energy Efficiency Details</div>
    <table class="mtable">
      <tr><th>Attained EEDI (g CO₂ / tonne·nm)</th><th>Required EEDI</th><th>EEDI Phase</th></tr>
      <tr><td><span class="m-val">{attained_eedi}</span></td><td><span class="m-val">{required_eedi}</span></td><td><span class="m-val">{eedi_phase}</span></td></tr>
    </table>
    <div class="sec-label">Certification</div>
    <div class="certify">
      <div class="certify-title">This is to certify:</div>
      <ul>
        <li>That the ship has been surveyed in accordance with regulation 5 of Annex VI of the Convention; and</li>
        <li>That the ship has an approved Ship Energy Efficiency Management Plan (SEEMP) on board as required by regulation 22 of Annex VI of the Convention.</li>
        <li>That the attained Energy Efficiency Design Index (EEDI) of the ship is as stated above.</li>
      </ul>
    </div>`,
    footnotes: FN1,
  },

  // 8. ISSC
  {
    folder: 'International Ship Security Certificate',
    shortCode: 'ISSC',
    title: 'International Ship Security Certificate',
    formCode: 'ISSC',
    convention: 'Issued under the provisions of the International Code for the Security of Ships and of Port Facilities (ISPS Code)',
    vesselRows: vRows(
      ['Name of Ship', 'Distinctive No. / Letters', 'Port of Registry', 'Gross Tonnage'],
      ['{vessel_name}', '{call_sign}', '{port_of_registry}', '{gross_tonnage}'],
      ['IMO Number', 'Ship Type', 'Company Name & Address', 'Company ID Number'],
      ['{imo_number}', '{ship_type}', '{company_name}', '{company_id}']
    ),
    bodyContent: `
    <div class="sec-label">Certification</div>
    <div class="certify">
      <div class="certify-title">This is to certify:</div>
      <ul>
        <li>That the security system and any associated security equipment of the ship has been verified in accordance with section 19.1 of Part A of the ISPS Code;</li>
        <li>That the verification showed that the security system and any associated security equipment of the ship is in all respects satisfactory and that the ship complies with the applicable requirements of Chapter XI-2 of the Convention and Part A of the ISPS Code;</li>
        <li>That the ship is provided with an approved Ship Security Plan.</li>
      </ul>
    </div>`,
    footnotes: FN1,
  },

  // 9. LL
  {
    folder: 'International Load Line Certificate',
    shortCode: 'LL',
    title: 'International Load Line Certificate',
    formCode: 'LL',
    convention: 'Issued under the provisions of the International Convention on Load Lines, 1966, as modified by the Protocol of 1988 relating thereto',
    vesselRows: vRows(
      ['Name of Ship', 'Distinctive No. / Letters', 'Port of Registry', 'Length (L) (m)'],
      ['{vessel_name}', '{call_sign}', '{port_of_registry}', '{ship_length}'],
      ['IMO Number <sup>1</sup>', 'Ship Type <sup>2</sup>', 'Freeboard Assigned As <sup>2</sup>', 'Gross Tonnage'],
      ['{imo_number}', '{ship_type}', '{freeboard_type}', '{gross_tonnage}']
    ),
    bodyContent: `
    <div class="sec-label">Freeboard from Deck Line <sup>3</sup></div>
    <table class="mtable">
      <tr><th>Load Line</th><th>Freeboard (mm)</th><th>Mark</th><th>Above/Below (S)</th></tr>
      <tr><td>Tropical</td><td><span class="m-val">{tropical_fb}</span></td><td>(T)</td><td>above (S)</td></tr>
      <tr><td>Summer</td><td><span class="m-val">{summer_fb}</span></td><td>(S)</td><td>Upper edge of line</td></tr>
      <tr><td>Winter</td><td><span class="m-val">{winter_fb}</span></td><td>(W)</td><td>below (S)</td></tr>
      <tr><td>Winter North Atlantic</td><td><span class="m-val">{wna_fb}</span></td><td>(WNA)</td><td>below (S)</td></tr>
      <tr><td>Timber Tropical</td><td><span class="m-val">{timber_tropical_fb}</span></td><td>(LT)</td><td>above (LS)</td></tr>
      <tr><td>Timber Summer</td><td><span class="m-val">{timber_summer_fb}</span></td><td>(LS)</td><td>above (S)</td></tr>
      <tr><td>Timber Winter</td><td><span class="m-val">{timber_winter_fb}</span></td><td>(LW)</td><td>below (LS)</td></tr>
      <tr><td>Timber Winter North Atlantic</td><td><span class="m-val">{timber_wna_fb}</span></td><td>(LWNA)</td><td>below (LS)</td></tr>
    </table>
    <p class="cert-desc">Allowance for fresh water for all freeboards other than timber: <strong>{freshwater_allowance}</strong> mm. For timber freeboards: <strong>{timber_freshwater_allowance}</strong> mm</p>
    <p class="cert-desc">The upper edge of the deck line from which these freeboards are measured is <strong>{deck_line_measurement}</strong> mm deck at side.</p>
    <div class="sec-label">Certification</div>
    <div class="certify">
      <div class="certify-title">This is to certify:</div>
      <ul>
        <li>That this ship has been surveyed in accordance with the requirements of Article 14 of the Convention.</li>
        <li>That the survey showed that the freeboards have been assigned and load lines shown above have been marked in accordance with the Convention.</li>
      </ul>
    </div>
    <p class="cert-desc">The provisions of the Convention from which the ship is exempted under Article 6(2) are: <strong>{exemption_provisions}</strong></p>`,
    footnotes: `${FN1}
      <p><sup>2</sup> Delete as appropriate.</p>
      <p><sup>3</sup> Freeboard lines which are not applicable need not be entered on the certificate.</p>
      <p><sup>4</sup> Subdivision Load line may be entered on the certificate on a voluntary basis.</p>
      <p><sup>5</sup> Insert the date of expiry as specified by the Administration in accordance with Article 19(10) of the Convention.</p>`,
  },

  // 10. MLC
  {
    folder: 'Maritime Labour Convention',
    shortCode: 'MLC',
    title: 'Maritime Labour Certificate',
    formCode: 'MLC',
    convention: 'Issued under provision of Article V and Title 5 of the Maritime Labour Convention, 2006. This Certificate shall have a Declaration of Maritime Labour Compliance attached',
    vesselRows: vRows(
      ['Name of Ship', 'Distinctive No. / Letters', 'Port of Registry', 'Gross Tonnage <sup>1</sup>'],
      ['{vessel_name}', '{call_sign}', '{port_of_registry}', '{gross_tonnage}'],
      ['IMO Number', 'Ship Type', 'Date of Registry', 'Ship Owner & Address <sup>2</sup>'],
      ['{imo_number}', '{ship_type}', '{registry_date}', '{ship_owner}']
    ),
    bodyContent: `
    <div class="sec-label">Company Information</div>
    <div class="vgrid-2">
      <div class="vcell"><span class="vc-label">IMO Company No.</span><div class="vc-val">{company_imo_no}</div></div>
      <div class="vcell"><span class="vc-label">Name & Address of Ship Owner</span><div class="vc-val">{ship_owner}</div></div>
    </div>
    <div class="sec-label">Certification</div>
    <div class="certify">
      <div class="certify-title">This is to certify:</div>
      <ul>
        <li>That this ship has been inspected, and verified to be in compliance with the requirements of the Convention, and provisions of the attached Declaration of Maritime Labour Compliance.</li>
        <li>That the seafarers' working and living conditions specified in Appendix A5-I of the Convention were found to correspond to the abovementioned country's national requirements implementing the Convention.</li>
      </ul>
    </div>
    <p class="cert-desc">This Certificate is valid only when the Declaration of Maritime Labour Compliance is attached.</p>`,
    footnotes: `${FN1}
      <p><sup>2</sup> Shipowner means the owner of the ship or another organization or person, such as the manager, agent or bareboat charterer, who has assumed the responsibility for the operation of the ship.</p>`,
  },

  // 11. IBWMC
  {
    folder: 'BALLAST WATER MANAGEMENT CERTIFICATE',
    shortCode: 'IBWMC',
    title: 'International Ballast Water Management Certificate',
    formCode: 'IBWMC',
    convention: 'Issued under the provisions of the International Convention for the Control and Management of Ships\' Ballast Water and Sediments, 2004',
    vesselRows: STD_VESSEL,
    bodyContent: `
    <div class="sec-label">Ballast Water Management Method</div>
    <div class="chk-list">
      <div class="chk-item {bwm_method_exchange_check}"><div class="checkbox"></div><div class="chk-text">Ballast Water Exchange (in accordance with regulation B-4)</div></div>
      <div class="chk-item {bwm_method_treatment_check}"><div class="checkbox"></div><div class="chk-text">Ballast Water Treatment using an approved Ballast Water Management System (in accordance with regulation D-3)</div></div>
    </div>
    <table class="mtable">
      <tr><th>BWM System Manufacturer</th><th>BWM System Type</th><th>Type Approval Certificate No.</th></tr>
      <tr><td><span class="m-val">{bwm_manufacturer}</span></td><td><span class="m-val">{bwm_system_type}</span></td><td><span class="m-val">{bwm_approval_no}</span></td></tr>
    </table>
    <div class="sec-label">Certification</div>
    <div class="certify">
      <div class="certify-title">This is to certify:</div>
      <ul>
        <li>That this ship has been surveyed in accordance with the regulations of the Annex to the Convention; and</li>
        <li>That the survey shows that the Ballast Water Management on the ship complies with the applicable requirements of the Convention.</li>
      </ul>
    </div>`,
    footnotes: FN1,
  },

  // 12. ITC
  {
    folder: 'International Tonnage Certificate',
    shortCode: 'ITC',
    title: 'International Tonnage Certificate (1969)',
    formCode: 'ITC',
    convention: 'Issued under the provisions of the International Convention on Tonnage Measurement of Ships, 1969',
    vesselRows: vRows(
      ['Name of Ship', 'Distinctive No. / Letters', 'Port of Registry', 'Date of Keel Laying'],
      ['{vessel_name}', '{call_sign}', '{port_of_registry}', '{keel_date}'],
      ['IMO Number', 'Gross Tonnage', 'Net Tonnage', 'Ship Type'],
      ['{imo_number}', '{gross_tonnage}', '{net_tonnage}', '{ship_type}']
    ),
    bodyContent: `
    <div class="sec-label">Tonnage Measurement Details</div>
    <table class="mtable">
      <tr><th>Main Particulars</th><th>Value</th></tr>
      <tr><td>Length Overall (m)</td><td><span class="m-val">{length_overall}</span></td></tr>
      <tr><td>Breadth (m)</td><td><span class="m-val">{breadth}</span></td></tr>
      <tr><td>Depth to Upper Deck (m)</td><td><span class="m-val">{depth}</span></td></tr>
      <tr><td>Gross Tonnage</td><td><span class="m-val">{gross_tonnage}</span></td></tr>
      <tr><td>Net Tonnage</td><td><span class="m-val">{net_tonnage}</span></td></tr>
    </table>
    <div class="sec-label">Certification</div>
    <div class="certify">
      <div class="certify-title">This is to certify:</div>
      <ul>
        <li>That the ship has been measured in accordance with the provisions of the International Convention on Tonnage Measurement of Ships, 1969.</li>
        <li>That the gross and net tonnages of the ship are as stated above.</li>
      </ul>
    </div>`,
    footnotes: FN1,
  },

  // 13. DOC
  {
    folder: 'Document of Compliance',
    shortCode: 'DOC',
    title: 'Document of Compliance',
    formCode: 'DOC',
    convention: 'Issued under the provisions of the International Convention for the Safety of Life at Sea (SOLAS), 1974, as amended — International Safety Management (ISM) Code',
    vesselRows: vRows(
      ['Company Name & Address (ISM Code 1.1.2)', 'Company Identification Number <sup>1</sup>', '', ''],
      ['{company_name}', '{company_id}', '', ''],
      ['DOC Number', 'Issued By', '', ''],
      ['{certificate_number}', 'GR CLASS', '', '']
    ),
    bodyContent: `
    <div class="sec-label">Type(s) of Ships Covered</div>
    <div class="chk-list">
      <div class="chk-item {doc_passenger_check}"><div class="checkbox"></div><div class="chk-text">Passenger Ship</div></div>
      <div class="chk-item {doc_passenger_hsc_check}"><div class="checkbox"></div><div class="chk-text">Passenger High-speed Craft</div></div>
      <div class="chk-item {doc_cargo_hsc_check}"><div class="checkbox"></div><div class="chk-text">Cargo High-speed Craft</div></div>
      <div class="chk-item {doc_bulk_check}"><div class="checkbox"></div><div class="chk-text">Bulk Carrier</div></div>
      <div class="chk-item {doc_oil_check}"><div class="checkbox"></div><div class="chk-text">Oil Tanker</div></div>
      <div class="chk-item {doc_chemical_check}"><div class="checkbox"></div><div class="chk-text">Chemical Tanker</div></div>
      <div class="chk-item {doc_gas_check}"><div class="checkbox"></div><div class="chk-text">Gas Carrier</div></div>
      <div class="chk-item {doc_modu_check}"><div class="checkbox"></div><div class="chk-text">Mobile Offshore Drilling Unit</div></div>
      <div class="chk-item {doc_other_check}"><div class="checkbox"></div><div class="chk-text">Other Cargo Ship</div></div>
    </div>
    <div class="sec-label">Certification</div>
    <div class="certify">
      <div class="certify-title">This is to certify that:</div>
      <ul>
        <li>The safety management system of the Company has been audited and that it complies with the requirements of the International Management Code for the Safe Operation of Ships and for Pollution Prevention (ISM Code) for the type(s) of ships listed above.</li>
      </ul>
    </div>
    <p class="cert-desc">This Document of Compliance is valid subject to periodical verification.</p>`,
    footnotes: `      <p><sup>1</sup> "Company Identification Number" item is added by Res. MSC.195(80) and entered into force on January 01st, 2009.</p>`,
  },

  // 14. ISM (Safety Management Certificate)
  {
    folder: 'Safety Management Certificate',
    shortCode: 'ISM',
    title: 'Safety Management Certificate',
    formCode: 'ISM',
    convention: 'Issued under the provisions of the International Convention for the Safety of Life at Sea (SOLAS), 1974, as amended — International Safety Management (ISM) Code',
    vesselRows: vRows(
      ['Name of Ship', 'Distinctive No. / Letters', 'Port of Registry', 'Gross Tonnage'],
      ['{vessel_name}', '{call_sign}', '{port_of_registry}', '{gross_tonnage}'],
      ['IMO Number', 'Ship Type <sup>1</sup>', 'Company Name & Address', 'Company ID Number'],
      ['{imo_number}', '{ship_type}', '{company_name}', '{company_id}']
    ),
    bodyContent: `
    <div class="sec-label">Certification</div>
    <div class="certify">
      <div class="certify-title">This is to certify that:</div>
      <ul>
        <li>The safety management system of the ship has been duly audited and that it complies with the requirements of the International Management Code for the Safe Operation of Ships and for Pollution Prevention (ISM Code), following verification that the Document of Compliance for the Company is applicable to this type of ship.</li>
      </ul>
    </div>`,
    footnotes: `${FN1}
      <p><sup>1</sup> Insert the type of ship from among the following: Passenger ship; Passenger high-speed craft; Cargo high-speed craft; Bulk carrier; Oil tanker; Chemical tanker; Gas carrier; Mobile offshore drilling unit; Other cargo ship.</p>`,
  },

  // 15. CEC (Class Entry Certificate)
  {
    folder: 'Certificate of Classification',
    shortCode: 'CEC',
    title: 'Class Entry Certificate',
    formCode: 'CEC',
    convention: 'Issued by GR CLASS — Recognized Organization (RO) certifying that the vessel meets the classification standards',
    vesselRows: STD_VESSEL,
    bodyContent: `
    <div class="sec-label">Classification Details</div>
    <table class="mtable">
      <tr><th>Class Notation</th><th>Class Number</th></tr>
      <tr><td><span class="m-val">{class_notation}</span></td><td><span class="m-val">{class_number}</span></td></tr>
    </table>
    <table class="mtable">
      <tr><th>Year of Build</th><th>Builder & Yard</th></tr>
      <tr><td><span class="m-val">{year_of_build}</span></td><td><span class="m-val">{builder_yard}</span></td></tr>
    </table>
    <div class="sec-label">Certification</div>
    <div class="certify">
      <div class="certify-title">This is to certify that:</div>
      <ul>
        <li>The above mentioned vessel has been classed with GR CLASS and entered into the Register Book of Ships.</li>
        <li>The vessel has been surveyed and found to comply with the Rules and Regulations of GR CLASS for the classification of ships.</li>
        <li>The class notation assigned is as stated above.</li>
      </ul>
    </div>`,
    footnotes: FN1,
  },

  // 16. BPTC
  {
    folder: 'BOLLARD PULL ASSESMENT',
    shortCode: 'BPTC',
    title: 'Certificate of Bollard Pull Test',
    formCode: 'BPTC',
    convention: 'By GR CLASS CLASSIFIED FOR STANDARD (GR CLASS)',
    vesselRows: vRows(
      ["Ship's Name", 'IMO Number', 'Length (m)', 'Breadth'],
      ['{vessel_name}', '{imo_number}', '{ship_length}', '{breadth}'],
      ['Port of Registry', 'Gross Tonnage', 'Call Sign', 'Date of Built'],
      ['{port_of_registry}', '{gross_tonnage}', '{call_sign}', '{date_of_built}']
    ) + `\n      <tr><th>Name of Owner</th><th>Propulsion Engine</th><th>Rated Power</th><th>Depth</th></tr>\n      <tr><td><span class="val">{owner_name}</span></td><td><span class="val">{propulsion_engine}</span></td><td><span class="val">{rated_power}</span></td><td><span class="val">{depth}</span></td></tr>`,
    bodyContent: `
    <div class="sec-label">Bollard Pull Results</div>
    <p class="cert-desc">During the Bollard Pull Test the necessary corrections were applied according to Document ITS 2002, No. 5 Figure 1</p>
    <table class="mtable">
      <tr><th>Steady Bollard Pull</th><th>Maximum Bollard Pull</th><th>Average Bollard Pull</th></tr>
      <tr><td><span class="m-val">{steady_pull}</span></td><td><span class="m-val">{max_pull}</span></td><td><span class="m-val">{average_pull}</span></td></tr>
    </table>
    <div class="sec-label">Equipment Calibration</div>
    <table class="mtable">
      <tr><th>Authorized Services Supplier</th><th>Equipment Reference</th><th>Last Calibration</th></tr>
      <tr><td><span class="m-val">{service_supplier}</span></td><td><span class="m-val">{equipment_reference}</span></td><td><span class="m-val">{last_calibration}</span></td></tr>
    </table>
    <div class="sec-label">Certification</div>
    <div class="certify">
      <div class="certify-title">This is to certify:</div>
      <ul>
        <li>That the above-mentioned vessel achieved the bollard pull results stated above.</li>
        <li>During bollard pull trial carried out at: <strong>{trial_location}</strong></li>
      </ul>
    </div>`,
    footnotes: '',
  },

  // 17. BS
  {
    folder: 'BOTTOM INSPECTION',
    shortCode: 'BS',
    title: "Statement for Outside Ship's Bottom Inspection",
    formCode: 'BS',
    convention: 'Issued under the provisions of the International Convention for the Safety of Life at Sea, 1974, as amended',
    vesselRows: vRows(
      ['Name of Ship', 'Distinctive No. / Letters', 'Port of Registry', 'Gross Tonnage'],
      ['{vessel_name}', '{call_sign}', '{port_of_registry}', '{gross_tonnage}'],
      ['IMO Number', 'Scope', '', ''],
      ['{imo_number}', '{scope_periodical_intermediate}', '', '']
    ),
    bodyContent: `
    <div class="sec-label">Inspection Details</div>
    <p class="cert-desc">We certify that above mentioned ship was inspected at: <strong>{inspection_location}</strong> and that the items below were found to be as indicated (must attach relevant supporting Records/Reports):</p>
    <table class="mtable">
      <tr><th>Hull</th><th>Machinery</th><th>Approved Antifouling System Applied</th></tr>
      <tr><td><span class="m-val">{hull_condition}</span></td><td><span class="m-val">{machinery_condition}</span></td><td><span class="m-val">{antifouling_applied}</span></td></tr>
      <tr><th>Rudder</th><th>Sea Chest</th><th>Anchors and Cables</th></tr>
      <tr><td><span class="m-val">{rudder_condition}</span></td><td><span class="m-val">{sea_chest_condition}</span></td><td><span class="m-val">{anchors_cables_condition}</span></td></tr>
      <tr><th>Shafts and Propellers</th><th colspan="2">Others</th></tr>
      <tr><td><span class="m-val">{shafts_propellers_condition}</span></td><td colspan="2"><span class="m-val">{others_condition}</span></td></tr>
    </table>
    <div class="sec-label">Schedules</div>
    <table class="mtable">
      <tr><th>The next dry dock survey is due (scope and date)</th></tr>
      <tr><td><span class="m-val">{next_dry_dock_survey}</span></td></tr>
      <tr><th>Confirm dates and scope of last two Outside Ship’s Bottom Inspections</th></tr>
      <tr><td>1. <span class="m-val">{last_inspection_1}</span><br>2. <span class="m-val">{last_inspection_2}</span></td></tr>
      <tr><th>Outstanding items (if applicable)</th></tr>
      <tr><td><span class="m-val">{outstanding_items}</span></td></tr>
    </table>`,
    footnotes: `      <p>NOTE: Dry Docking cycle is five (5) years; the intermediate shall be at mid validity and in no case more than 36 months from the periodical date.</p>`,
  },

  // 18. SAFCE
  {
    folder: 'CARGO SHIP SAFETY CERTIFICATE',
    shortCode: 'SAFCE',
    title: 'Cargo Ship Safety Certificate (Vessels Under 500 GRT)',
    formCode: 'SAFCE',
    convention: '',
    vesselRows: vRows(
      ['Name of Ship', 'Type', 'Distinctive No. / Letters', 'Port of Registry'],
      ['{vessel_name}', '{ship_type}', '{call_sign}', '{port_of_registry}'],
      ['Gross Tonnage', 'Keel Laid', 'IMO Number', 'Authorized Voyages (Miles)'],
      ['{gross_tonnage}', '{keel_date}', '{imo_number}', '{authorized_miles}']
    ),
    bodyContent: `
    <div class="sec-label">Life-Saving Appliances</div>
    <p class="cert-desc">The survey has shown that the life-saving appliances provided for a total number of <strong>{total_persons}</strong> persons and no more, viz:</p>
    <table class="mtable">
      <tr><th>Appliance Type</th><th>Accommodating Persons / Quantity</th></tr>
      <tr><td>Lifeboats or rescue boats<sup>1</sup></td><td><span class="m-val">{lifeboats_persons}</span></td></tr>
      <tr><td>Motor boats (included in the total shown above)</td><td><span class="m-val">{motorboats_count}</span></td></tr>
      <tr><td>Liferafts, for which approved launching devices are not required</td><td><span class="m-val">{liferafts_no_launch_persons}</span></td></tr>
      <tr><td>Liferafts, for which approved launching devices are required</td><td><span class="m-val">{liferafts_launch_persons}</span></td></tr>
      <tr><td>Lifebuoys</td><td><span class="m-val">{lifebuoys_count}</span></td></tr>
      <tr><td>Lifejackets</td><td><span class="m-val">{lifejackets_count}</span></td></tr>
    </table>
    <div class="sec-label">Certification</div>
    <div class="certify">
      <div class="certify-title">This is to certify:</div>
      <ul>
        <li>That the survey has shown the vessel complies with the safety requirements for its type and size.</li>
        <li>That a Full Term Certificate will be issued accordingly at a later stage.</li>
      </ul>
    </div>`,
    footnotes: `      <p><sup>1</sup> Delete as appropriate</p>`,
  },

  // 19. CCC
  {
    folder: 'CARGO SHIP SAFETY CONSTRUCTION CERTIFICATE',
    shortCode: 'CCC',
    title: 'Cargo Ship Safety Construction Certificate',
    formCode: 'CCC',
    convention: 'Issued under the provisions of the INTERNATIONAL CONVENTION FOR THE SAFETY OF LIFE AT SEA, 1974, as modified by the Protocol of 1988 relating thereto',
    vesselRows: vRows(
      ['Name of Ship', 'Distinctive No. / Letters', 'Port of Registry', 'Gross Tonnage'],
      ['{vessel_name}', '{call_sign}', '{port_of_registry}', '{gross_tonnage}'],
      ['Deadweight (metric tons) <sup>1</sup>', 'IMO Number <sup>2</sup>', 'Ship Type <sup>3</sup>', 'Date of Build *'],
      ['{deadweight}', '{imo_number}', '{ship_type}', '{date_of_build}']
    ),
    bodyContent: `
    <div class="sec-label">Date of Build Details</div>
    <table class="mtable">
      <tr><th>Date of building contract</th><th>Date on which keel was laid</th><th>Date of delivery</th><th>Date work for a conversion commenced</th></tr>
      <tr><td><span class="m-val">{contract_date}</span></td><td><span class="m-val">{keel_laid_date}</span></td><td><span class="m-val">{delivery_date}</span></td><td><span class="m-val">{conversion_date}</span></td></tr>
    </table>
    <div class="sec-label">Certification</div>
    <div class="certify">
      <div class="certify-title">This is to certify:</div>
      <ul>
        <li>That the ship has been surveyed in accordance with the requirements of regulation I/10 of the Convention.</li>
        <li>That the survey showed that the condition of the structure, machinery and equipment as defined in the above regulation was satisfactory and the ship complied with the relevant requirements of chapters II-1 and II-2 of the Convention (other than those relating to fire safety systems and appliances and fire control plans).</li>
        <li>The ship complied with part G of chapter II-1 of the Convention using as <strong>{part_g_options}</strong></li>
        <li>That the last two inspections of the outside of the ship’s bottom took place on <strong>{last_bottom_inspection_1}</strong> and <strong>{last_bottom_inspection_2}</strong></li>
        <li>That an Exemption Certificate <strong>{exemption_cert_status}</strong><sup>4</sup> been issued.</li>
        <li>The ship <strong>{alternative_design_status}</strong><sup>4</sup> subjected to an alternative design and arrangement in pursuance of Regulation(s) II-1/55 / II-2/17 of the Convention.</li>
        <li>That a Document of approval of alternative design and arrangements for <strong>{approval_alternative_design}</strong><sup>4</sup> is appended to this certificate.</li>
      </ul>
    </div>`,
    footnotes: `      <p><sup>1</sup> For oil tankers, chemical tankers and gas carriers only.</p>
      <p><sup>2</sup> In accordance with IMO Ship Identification Number Scheme adopted by the Organization by Resolution A. 600 (15).</p>
      <p><sup>3</sup> Select as appropriate (Bulk Carrier, Oil Tanker, Chemical Tanker, Gas Carrier, Cargo Ship other than any of the above)</p>
      <p><sup>4</sup> Delete as appropriate</p>
      <p><sup>5</sup> Insert the date of expiry as specified by the Administration in accordance with Regulation I/14 (a) of the Convention.</p>
      <p>* All applicable dates shall be completed.</p>`,
  },

  // 20. SARCE
  {
    folder: 'CARGO SHIP SAFETY RADIOTELEPHONY CERTIFICATE',
    shortCode: 'SARCE',
    title: 'Cargo Ship Safety Radiotelephony Certificate',
    formCode: 'SARCE',
    convention: 'VESSELS UNDER 300 GT',
    vesselRows: vRows(
      ['Name of Ship', 'Type', 'Distinctive No. / Letters', 'Port of Registry'],
      ['{vessel_name}', '{ship_type}', '{call_sign}', '{port_of_registry}'],
      ['Gross Tonnage', 'Keel Laid', 'IMO Number', ''],
      ['{gross_tonnage}', '{keel_date}', '{imo_number}', '']
    ),
    bodyContent: `
    <div class="sec-label">Radio Equipment Installation</div>
    <p class="cert-desc">This is to certify that the radio telephony equipment of the above mentioned ship has been surveyed in accordance with the Regulations in force of the said Government and has been found in accordance with the requirements of said Regulations.</p>
    <table class="mtable">
      <tr><th>Equipment</th><th>Required</th><th>Installed</th></tr>
      <tr><td>Radiotelephone Station</td><td><span class="m-val">{radio_station_req}</span></td><td><span class="m-val">{radio_station_inst}</span></td></tr>
      <tr><td>VHF Radiotelephone</td><td><span class="m-val">{vhf_req}</span></td><td><span class="m-val">{vhf_inst}</span></td></tr>
      <tr><td>Portable radio apparatus</td><td><span class="m-val">{portable_radio_req}</span></td><td><span class="m-val">{portable_radio_inst}</span></td></tr>
      <tr><td>E.P.I.R.B.</td><td><span class="m-val">{epirb_req}</span></td><td><span class="m-val">{epirb_inst}</span></td></tr>
    </table>
    <div class="sec-label">Monitoring Requirements</div>
    <div class="certify">
      <ul>
        <li>The radiotelephone distress frequency (2182 kHz) shall be monitored on a continuous basis or, if a radiotelephone station is not installed on board, the VHF channel 16.</li>
        <li>If radiotelephone station is installed on board, at least one member of the crew must be in possession of valid Radiotelephone Operator Certificate.</li>
      </ul>
    </div>
    <div class="sec-label">Remarks</div>
    <p class="cert-desc">{remarks}</p>`,
    footnotes: '',
  },
];

// ═══════════════════════════════════════════
// GENERATE
// ═══════════════════════════════════════════

let count = 0;

for (const cert of CERTS) {
  const htmlDir = path.join(BASE, cert.folder, 'html');
  if (!fs.existsSync(htmlDir)) fs.mkdirSync(htmlDir, { recursive: true });

  const stHtml = buildCert(cert);
  
  // FT file (template + endorsements)
  // We append the FT_ENDORSEMENTS before the </body> tag
  const ftHtml = stHtml.replace('</body>', FT_ENDORSEMENTS + '\n</body>');

  // ST file
  const stFile = `GRClass_${cert.shortCode}_ST_Certificate.html`;
  fs.writeFileSync(path.join(htmlDir, stFile), stHtml, 'utf8');
  console.log(`✅ ${cert.folder}/html/${stFile}`);
  count++;

  // FT file
  const ftFile = `GRClass_${cert.shortCode}_FT_Certificate.html`;
  fs.writeFileSync(path.join(htmlDir, ftFile), ftHtml, 'utf8');
  console.log(`✅ ${cert.folder}/html/${ftFile}`);
  count++;
}

console.log(`\n🎉 Done! Generated ${count} certificate HTML files (${CERTS.length} certs × 2 variants).`);
console.log('\nCorrect short forms used:');
CERTS.forEach((c, i) => console.log(`  ${i+1}. ${c.shortCode} → ${c.title}`));
