/**
 * Convert .doc/.docx files from "new doc" folder to HTML
 * and place them in the correct ONLY CERTIFICATES subdirectories.
 * 
 * Uses:
 * - mammoth for .docx → HTML conversion
 * - word-extractor for .doc (old Word format) → text extraction → HTML
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';
import WordExtractor from 'word-extractor';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NEW_DOC_DIR = path.resolve(__dirname, '..', 'new doc');
const CERTIFICATES_DIR = path.join(__dirname, 'ONLY CERTIFICATES');

const extractor = new WordExtractor();

// Mapping of new doc files to their target certificate type directories
const FILE_MAPPING = {
    'AFS-RA-SoCRecord of Anti-Fouling Systems.doc': {
        targetDir: 'ANTI FOULING SYSTEM CERTIFICATE',
        htmlName: 'GRClass_AFS_RA_SoC_Record.html',
        term: null,
        description: 'Record of Anti-Fouling Systems (SoC)'
    },
    'APR-SSPA Approved Ship Security Planapproval letter.doc': {
        targetDir: 'International Ship Security Certificate',
        htmlName: 'GRClass_ISSC_APR_SSPA_Approval.html',
        term: null,
        description: 'Approved Ship Security Plan Approval Letter'
    },
    'CSSE E -forn E.docx': {
        targetDir: 'CARGO SHIP SAFETY EQUIPMENT CERTIFICATE',
        htmlName: 'GRClass_CSSE_Form_E.html',
        term: null,
        description: 'Cargo Ship Safety Equipment Certificate - Form E'
    },
    'CSSR- R -form R.doc': {
        targetDir: 'CARGO SHIP SAFETY RADIO CERTIFICATE',
        htmlName: 'GRClass_CSSR_Form_R.html',
        term: null,
        description: 'Cargo Ship Safety Radio Certificate - Form R'
    },
    'IAPP-R-SoC 12-22 Supplement Record of Construction and Equipment.doc': {
        targetDir: 'International Air Pollution Prevention Certificate',
        htmlName: 'GRClass_IAPP_R_SoC_Supplement.html',
        term: null,
        description: 'IAPP Supplement Record of Construction and Equipment'
    },
    'IEE 11-22 REV.00.doc': {
        targetDir: 'International Energy Efficiency Certificate',
        htmlName: 'GRClass_IEE_Supplement.html',
        term: null,
        description: 'International Energy Efficiency Certificate Supplement'
    },
    'IMSBC-IC -approved cargoes list.doc': {
        targetDir: 'Certificate of Compliance with the International Maritime Solid Bulk Cargoes (IMSBC) CODE',
        htmlName: 'GRClass_IMSBC_IC_Approved_Cargoes.html',
        term: null,
        description: 'IMSBC Approved Cargoes List'
    },
    'IOPP-FORM A.doc': {
        targetDir: 'INTERNATIONAL OIL POLLUTION PREVENTION CERTIFICATE',
        htmlName: 'GRClass_IOPP_Form_A.html',
        term: null,
        description: 'IOPP Certificate - Form A'
    },
    'LL-RA  -Conditions of Assignment of Load Lines – C11.doc': {
        targetDir: 'International Load Line Certificate',
        htmlName: 'GRClass_LL_RA_Conditions_C11.html',
        term: null,
        description: 'Conditions of Assignment of Load Lines - C11'
    },
    'SOPEP-R-approved plan.doc': {
        targetDir: 'Ship Oil Pollution Emergency Plan',
        htmlName: 'GRClass_SOPEP_R_Approved_Plan.html',
        term: null,
        description: 'SOPEP Approved Plan',
        createDir: true
    },
    'Survey Statement.docx': {
        targetDir: 'Survey Statement',
        htmlName: 'GRClass_Survey_Statement.html',
        term: null,
        description: 'Survey Statement Template',
        createDir: true
    }
};

async function convertDocxToHtml(filePath) {
    try {
        const result = await mammoth.convertToHtml({ path: filePath });
        if (result.messages.length > 0) {
            console.log(`    mammoth warnings: ${result.messages.map(m => m.message).join('; ')}`);
        }
        return result.value;
    } catch (err) {
        console.error(`    mammoth error: ${err.message}`);
        return null;
    }
}

async function extractDocToHtml(filePath) {
    try {
        const extracted = await extractor.extract(filePath);
        const body = extracted.getBody();
        
        if (!body || body.trim().length === 0) {
            console.log(`    word-extractor: empty body`);
            return null;
        }

        // Get headers/footers if available
        const headers = extracted.getHeaders({ includeFooters: false });
        const footers = extracted.getFooters({ includeHeaders: false });

        // Convert extracted text to structured HTML
        // Split into paragraphs and detect structure
        const lines = body.split('\n');
        let html = '';
        let inTable = false;
        let tableRows = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (!line) {
                if (inTable && tableRows.length > 0) {
                    html += buildTableHtml(tableRows);
                    tableRows = [];
                    inTable = false;
                }
                continue;
            }

            // Detect table-like content (tab-separated or pipe-separated)
            const tabCount = (line.match(/\t/g) || []).length;
            if (tabCount >= 1) {
                inTable = true;
                tableRows.push(line.split('\t').map(c => c.trim()));
                continue;
            }

            if (inTable && tableRows.length > 0) {
                html += buildTableHtml(tableRows);
                tableRows = [];
                inTable = false;
            }

            // Detect headings (all caps lines, short lines)
            if (line === line.toUpperCase() && line.length < 100 && line.length > 2 && !line.match(/^\d+[\.\)]/)) {
                html += `<h2>${escapeHtml(line)}</h2>\n`;
            }
            // Detect numbered items
            else if (line.match(/^\d+[\.\)]\s/)) {
                html += `<p style="margin-left: 10px;">${escapeHtml(line)}</p>\n`;
            }
            // Detect lettered sub-items
            else if (line.match(/^[a-z][\.\)]\s/i)) {
                html += `<p style="margin-left: 20px;">${escapeHtml(line)}</p>\n`;
            }
            // Regular paragraph
            else {
                html += `<p>${escapeHtml(line)}</p>\n`;
            }
        }

        // Flush remaining table
        if (inTable && tableRows.length > 0) {
            html += buildTableHtml(tableRows);
        }

        return html;
    } catch (err) {
        console.error(`    word-extractor error: ${err.message}`);
        return null;
    }
}

function buildTableHtml(rows) {
    if (rows.length === 0) return '';
    
    let html = '<table>\n';
    
    // First row as header
    html += '<thead><tr>';
    for (const cell of rows[0]) {
        html += `<th>${escapeHtml(cell)}</th>`;
    }
    html += '</tr></thead>\n<tbody>\n';
    
    // Remaining rows as data
    for (let i = 1; i < rows.length; i++) {
        html += '<tr>';
        for (const cell of rows[i]) {
            html += `<td>${escapeHtml(cell)}</td>`;
        }
        html += '</tr>\n';
    }
    
    html += '</tbody></table>\n';
    return html;
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function wrapInGRClassTemplate(rawHtml, title, description) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>GR Class – ${title}</title>
    
    <style>
        /* ── OPTIMIZED CSS (SYSTEM FONTS FOR INSTANT LOAD) ── */
        :root {
            --navy-blue: #0b2545;
            --navy-light: #133c6d;
            --gold-primary: #b08d57;
            --text-dark: #1a1a1a;
            --text-muted: #444444;
            --paper: #ffffff;
            --stamp-color: #E65100;
            --bg-light: #f4f6f8;
            --primary: #0b2545;
            --border: #ccc;
            --light: #f4f6f8;
        }

        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Arial', sans-serif;
            font-size: 7.8pt;
            background: #222;
            padding: 20px 0 40px;
            color: var(--text-dark);
            line-height: 1.3;
        }

        .no-print {
            width: 210mm;
            margin: 0 auto 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #fff;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }

        .btn-print {
            background: var(--gold-primary);
            color: #fff;
            border: none;
            padding: 8px 18px;
            font-size: 8.5pt;
            font-weight: bold;
            cursor: pointer;
            border-radius: 3px;
            text-transform: uppercase;
        }

        .page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 10mm 12mm 15mm;
            background: var(--paper);
            position: relative;
            box-shadow: 0 6px 30px rgba(0,0,0,0.5);
        }

        .header-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid var(--navy-blue);
            padding-bottom: 6px;
            margin-bottom: 10px;
        }

        .logo-area {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .logo-area img {
            height: 50px;
            width: auto;
        }

        .org-name {
            font-size: 14pt;
            font-weight: bold;
            color: var(--navy-blue);
            letter-spacing: 1px;
        }

        .cert-title {
            text-align: center;
            font-size: 11pt;
            font-weight: bold;
            color: var(--navy-blue);
            text-transform: uppercase;
            margin: 10px 0;
            letter-spacing: 0.5px;
        }

        .doc-content {
            margin-top: 10px;
        }

        .doc-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 6px 0;
        }

        .doc-content table th,
        .doc-content table td {
            border: 1px solid var(--border);
            padding: 4px 6px;
            font-size: 7.8pt;
            text-align: left;
            vertical-align: top;
        }

        .doc-content table th {
            background: var(--bg-light);
            font-weight: bold;
            color: var(--navy-blue);
        }

        .doc-content p {
            margin: 4px 0;
            font-size: 7.8pt;
            line-height: 1.4;
        }

        .doc-content h1, .doc-content h2, .doc-content h3 {
            color: var(--navy-blue);
            margin: 8px 0 4px;
        }

        .doc-content h1 { font-size: 11pt; }
        .doc-content h2 { font-size: 9.5pt; }
        .doc-content h3 { font-size: 8.5pt; }

        .doc-content ul, .doc-content ol {
            margin: 4px 0 4px 16px;
            font-size: 7.8pt;
        }

        .doc-content img {
            max-width: 100%;
            height: auto;
        }

        .signature-block {
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }

        .signature-box {
            text-align: center;
            width: 40%;
        }

        .signature-box img {
            height: 50px;
            width: auto;
        }

        .signature-line {
            border-top: 1px solid #333;
            margin-top: 4px;
            padding-top: 2px;
            font-size: 7pt;
        }

        @media print {
            body { background: #fff; padding: 0; }
            .no-print { display: none !important; }
            .page {
                box-shadow: none;
                margin: 0;
                padding: 10mm;
                min-height: auto;
                page-break-after: always;
            }
        }
    </style>
</head>
<body>
    <!-- Print Controls -->
    <div class="no-print">
        <span style="font-size:9pt; font-weight:bold; color:#333;">${description}</span>
        <button class="btn-print" onclick="window.print()">🖨 Print</button>
    </div>

    <!-- Certificate Page -->
    <div class="page">
        <!-- Header -->
        <div class="header-bar">
            <div class="logo-area">
                <img src="{flag_logo}" alt="Flag Logo" onerror="this.style.display='none'">
                <div class="org-name">GR CLASS</div>
            </div>
            <img src="https://grclass.com/grclass-logo.webp" alt="GR Class Logo" style="height:45px;">
        </div>

        <!-- Title -->
        <div class="cert-title">${title}</div>

        <!-- Document Content -->
        <div class="doc-content">
${rawHtml}
        </div>

        <!-- Signature Block -->
        <div class="signature-block">
            <div class="signature-box">
                <img src="{signature}" alt="signature" onerror="this.style.display='none'">
                <div class="signature-line">Authorized Signature</div>
            </div>
            <div class="signature-box">
                <img src="{stamp}" alt="stamp" onerror="this.style.display='none'">
                <div class="signature-line">Official Stamp</div>
            </div>
        </div>
    </div>
</body>
</html>`;
}

async function run() {
    console.log('=== New Document Template Converter ===\n');
    
    if (!fs.existsSync(NEW_DOC_DIR)) {
        console.error(`ERROR: "new doc" directory not found at: ${NEW_DOC_DIR}`);
        process.exit(1);
    }

    const files = fs.readdirSync(NEW_DOC_DIR);
    console.log(`Found ${files.length} files in "new doc" directory.\n`);

    let successCount = 0;
    let failCount = 0;

    for (const fileName of files) {
        const mapping = FILE_MAPPING[fileName];
        if (!mapping) {
            console.log(`⚠ Skipping unmapped file: ${fileName}`);
            continue;
        }

        console.log(`Processing: ${fileName}`);
        console.log(`  → Target: ${mapping.targetDir}`);

        const sourcePath = path.join(NEW_DOC_DIR, fileName);
        const targetDirPath = path.join(CERTIFICATES_DIR, mapping.targetDir);
        const htmlDirPath = path.join(targetDirPath, 'html');

        // Create target directory if needed
        if (mapping.createDir && !fs.existsSync(targetDirPath)) {
            console.log(`  Creating directory: ${mapping.targetDir}`);
            fs.mkdirSync(targetDirPath, { recursive: true });
        }

        if (!fs.existsSync(targetDirPath)) {
            console.error(`  ✗ Target directory not found: ${mapping.targetDir}`);
            failCount++;
            continue;
        }

        // Create html subdirectory if it doesn't exist
        if (!fs.existsSync(htmlDirPath)) {
            fs.mkdirSync(htmlDirPath, { recursive: true });
        }

        // Copy original .doc/.docx file to the certificate type directory
        const targetDocPath = path.join(targetDirPath, fileName);
        if (!fs.existsSync(targetDocPath)) {
            fs.copyFileSync(sourcePath, targetDocPath);
            console.log(`  ✓ Copied ${fileName} to ${mapping.targetDir}/`);
        } else {
            console.log(`  ⏭ ${fileName} already exists in target directory`);
        }

        // Convert to HTML
        let rawHtml = null;
        if (fileName.endsWith('.docx')) {
            console.log(`  Converting .docx with mammoth...`);
            rawHtml = await convertDocxToHtml(sourcePath);
        } else if (fileName.endsWith('.doc')) {
            console.log(`  Extracting .doc with word-extractor...`);
            rawHtml = await extractDocToHtml(sourcePath);
        }

        if (rawHtml) {
            const title = mapping.description;
            const wrappedHtml = wrapInGRClassTemplate(rawHtml, title, mapping.description);
            const htmlPath = path.join(htmlDirPath, mapping.htmlName);
            fs.writeFileSync(htmlPath, wrappedHtml, 'utf-8');
            console.log(`  ✓ HTML template created: html/${mapping.htmlName} (${Math.round(wrappedHtml.length / 1024)} KB)`);
            successCount++;
        } else {
            console.log(`  ✗ Could not convert to HTML`);
            failCount++;
        }

        console.log('');
    }

    console.log(`\n=== Conversion Summary ===`);
    console.log(`Total files: ${files.length}`);
    console.log(`Successfully converted: ${successCount}`);
    console.log(`Failed/skipped: ${failCount}`);
    console.log(`\nOriginal .doc/.docx files have been copied to their target directories.`);
    console.log(`HTML templates have been created in the html/ subdirectories.`);
    console.log(`\nNext step: Run seed_certificates.js to add the new HTML templates to the database.`);
}

run();
