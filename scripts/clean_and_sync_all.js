import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import xpath from 'xpath';
import { execSync } from 'child_process';
import db from '../src/models/index.js';
import * as s3Service from '../src/services/s3.service.js';

const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const selectWithNs = xpath.useNamespaces({ w: WORD_NS });

const PROJECT_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ONLY_CERTS_DIR = path.join(PROJECT_ROOT, 'ONLY CERTIFICATES');
const CHECKLISTS_DIR = path.join(PROJECT_ROOT, 'CHECKLISTS');

const TABLES_TO_TRUNCATE = [
    'jobs', 'job_status_histories', 'job_reschedules', 'job_notes', 'job_documents', 'job_requests', 'job_certificates',
    'survey_status_histories', 'surveys',
    'certificate_history', 'certificates', 'certificate_templates', 'checklist_templates',
    'documents', 'certificate_required_documents', 'certificate_types',
    'payments', 'approvals', 'financial_ledgers',
    'activity_requests', 'activity_plannings', 'gps_tracking', 'non_conformities', 'incidents', 'change_requests',
    'messages', 'notifications'
];

const HEADER_TAG_RULES = [
    { keys: ['name of ship', 'name of vessel', 'nombredelanave', 'vesselname', 'nombre de la nave', 'name of ship / nombre de la nave'], tag: 'vessel_name' },
    { keys: ['distinctive number or letters', 'call sign', 'señal distintiva', 'distinctive number'], tag: 'call_sign' },
    { keys: ['port of registry', 'puertoderegistro', 'puerto de registro', 'port of registry / puerto de registro'], tag: 'port_of_registry' },
    { keys: ['gross tonnage', 'gross tonnage1', 'gross tonnage2', 'arqueo bruto'], tag: 'gross_tonnage' },
    { keys: ['imo number', 'imo number1', 'imo number1:', 'imo company', 'imo no.', 'imo no', 'imo number:', 'imo nº', 'imo no.'], tag: 'imo_number' },
    { keys: ['issued at', 'expedido en', 'lugar de emision', 'issued at / expedido en'], tag: 'place_of_survey' },
    { keys: ['date of issue', 'date of issue:', 'fecha de emision', 'fecha de emisión'], tag: 'issue_date' },
    { keys: ['date of construction', 'date of built', 'date of build', 'keel laid', 'keelwaslaid', 'construido por', 'año de construcción', 'fechadeconstruccion', 'date of buildaño de construcción', 'date of keel laid1', 'date on which keel was laid'], tag: 'year_built' },
    { keys: ['ballast water capacity', 'capacidad de agua de lastre'], tag: 'ballast_water_capacity' },
    { keys: ['deadweight', 'peso muerto', 'deadweight of ship', 'deadweight of ship (metric tons)1'], tag: 'deadweight' },
    { keys: ['net tonnage', 'arqueo neto'], tag: 'net_tonnage' },
    { keys: ['ship type', 'tipo de buque', 'type of ship'], tag: 'ship_type' },
    { keys: ['certificate number', 'no de certificado', 'certificate no', 'certificado no.', 'certificate no.'], tag: 'certificate_number' },
    { keys: ['surveyor name', 'nombre del inspector', 'auditor name'], tag: 'surveyor_name' },
    { keys: ['facility name', 'name of the facility', 'facility name / name of the facility', 'facility'], tag: 'facility_name' },
    { keys: ['facility date', 'date of facility', 'date of application', 'date of removal', 'date of sealer coat'], tag: 'facility_date' },
    { keys: ['compliance deadline', 'deadline of compliance', 'compliance deadline date'], tag: 'compliance_deadline' }
];

const CERTIFICATE_TYPE_ALIASES = {
    AFS: 'AFS',
    'ANTI-FOULING SYSTEM CERTIFICATE': 'AFS',
    ANTIFOULINGSYSTEMCERTIFICATE: 'AFS',
    'BALLAST WATER MANAGEMENT CERTIFICATE': 'BWM',
    BALLASTWATERMANAGEMENTCERTIFICATE: 'BWM',
    'BOTTOM INSPECTION': 'BOTTOM INSPECTION',
    BOTTOMINSPECTION: 'BOTTOM INSPECTION',
    'CARGO SHIP SAFETY CERTIFICATE': 'CSSC',
    'CARGO SHIP SAFETY CONSTRUCTION CERTIFICATE': 'CSSCC',
    'CARGO SHIP SAFETY EQUIPMENT CERTIFICATE': 'CSSEC',
    'CARGO SHIP SAFETY RADIO CERTIFICATE': 'CSSRC',
    'CARGO SHIP SAFETY RADIOTELEPHONY CERTIFICATE': 'CSSRTC',
    'CARIBBEAN CARGO SHIP SAFETY CERTIFICATE': 'CCSSC',
    CICA: 'CICA',
    DOC: 'DOC',
    'DOCKING SURVEY': 'DOCKING SURVEY',
    DOCKINGSURVEY: 'DOCKING SURVEY',
    EIAPP: 'EIAPP',
    'FISHING VESSEL SAFETY CERTIFICATE': 'FVSC',
    HSC: 'HSC',
    'HIGH SPEED CRAFT SAFETY CERTIFICATE': 'HSC',
    IAPP: 'IAPP',
    'INTERNATIONAL OIL POLLUTION PREVENTION CERTIFICATE': 'IOPPC',
    'INTERNATIONAL SEWAGE POLLUTION PREVENTION CERTIFICATE': 'ISPP',
    ISSC: 'ISSC',
    ITC: 'ITC',
    LL: 'LL',
    MLC: 'MLC',
    MODU: 'MODU',
    SMC: 'SMC',
    SPS: 'SPS',
    'SEA WORTHINESS CERTIFICATE': 'SEA WORTHINESS CERTIFICATE',
    SEAWORTHINESSCERTIFICATE: 'SEA WORTHINESS CERTIFICATE',
};

function normalize(value) {
    return String(value || '')
        .normalize('NFKD')
        .replace(/[^\w\s]/g, '')
        .replace(/_/g, ' ')
        .replace(/\s+/g, '')
        .toUpperCase();
}

function deriveShortCode(folderName) {
    const raw = String(folderName || '').trim();
    const normalized = normalize(raw);

    if (CERTIFICATE_TYPE_ALIASES[raw]) return CERTIFICATE_TYPE_ALIASES[raw];
    if (CERTIFICATE_TYPE_ALIASES[normalized]) return CERTIFICATE_TYPE_ALIASES[normalized];
    if (/^[A-Z0-9]{2,10}$/.test(normalized)) return normalized.slice(0, 10);

    const words = normalized.split(' ').filter(Boolean);
    const initials = words.map((w) => w[0]).join('');
    if (initials.length >= 2) return initials.slice(0, 10);

    return normalized.slice(0, 10) || 'CERT';
}

function findTagForHeader(headerText) {
    const norm = headerText.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const rule of HEADER_TAG_RULES) {
        for (const key of rule.keys) {
            const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (norm.includes(normKey)) {
                return rule.tag;
            }
        }
    }
    return null;
}

function normalizeText(text) {
    return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function createSdtNode(doc, tagName, placeholderText) {
    const sdt = doc.createElementNS(WORD_NS, 'w:sdt');
    const sdtPr = doc.createElementNS(WORD_NS, 'w:sdtPr');
    const tag = doc.createElementNS(WORD_NS, 'w:tag');
    tag.setAttributeNS(WORD_NS, 'w:val', tagName);
    sdtPr.appendChild(tag);
    sdt.appendChild(sdtPr);

    const sdtContent = doc.createElementNS(WORD_NS, 'w:sdtContent');
    const p = doc.createElementNS(WORD_NS, 'w:p');
    
    // Add center alignment
    const pPr = doc.createElementNS(WORD_NS, 'w:pPr');
    const jc = doc.createElementNS(WORD_NS, 'w:jc');
    jc.setAttributeNS(WORD_NS, 'w:val', 'center');
    pPr.appendChild(jc);
    p.appendChild(pPr);

    const r = doc.createElementNS(WORD_NS, 'w:r');
    const t = doc.createElementNS(WORD_NS, 'w:t');
    t.appendChild(doc.createTextNode(placeholderText));
    r.appendChild(t);
    p.appendChild(r);
    sdtContent.appendChild(p);
    sdt.appendChild(sdtContent);

    return sdt;
}

function createInlineSdtNode(doc, tagName, placeholderText, formatPrNode) {
    const sdt = doc.createElementNS(WORD_NS, 'w:sdt');
    const sdtPr = doc.createElementNS(WORD_NS, 'w:sdtPr');
    
    const tag = doc.createElementNS(WORD_NS, 'w:tag');
    tag.setAttributeNS(WORD_NS, 'w:val', tagName);
    sdtPr.appendChild(tag);
    
    if (formatPrNode) {
        sdtPr.appendChild(formatPrNode.cloneNode(true));
    }
    sdt.appendChild(sdtPr);

    const sdtContent = doc.createElementNS(WORD_NS, 'w:sdtContent');
    const r = doc.createElementNS(WORD_NS, 'w:r');
    if (formatPrNode) {
        r.appendChild(formatPrNode.cloneNode(true));
    }
    const t = doc.createElementNS(WORD_NS, 'w:t');
    t.appendChild(doc.createTextNode(placeholderText));
    r.appendChild(t);
    sdtContent.appendChild(r);
    sdt.appendChild(sdtContent);

    return sdt;
}

async function tagSingleDocx(filePath) {
    const buffer = fs.readFileSync(filePath);
    let zip;
    try {
        zip = await JSZip.loadAsync(buffer);
    } catch {
        console.warn(`  [SKIP] Corrupt zip archive: ${path.basename(filePath)}`);
        return false;
    }
    const entry = zip.file('word/document.xml');
    if (!entry) {
        return false;
    }

    const xml = await entry.async('text');
    const doc = new DOMParser().parseFromString(xml, 'text/xml');

    let tableTaggedCount = 0;

    // 1. Process Tables
    const tables = selectWithNs('//w:tbl', doc);
    tables.forEach((tbl) => {
        const rows = selectWithNs('w:tr', tbl);
        rows.forEach((row, rowIdx) => {
            const cells = selectWithNs('w:tc', row);
            cells.forEach((cell, colIdx) => {
                const text = selectWithNs('.//w:t', cell).map(n => n.textContent).join('');
                if (!text.trim()) return;

                if (text.includes('{') || text.includes('}')) return;

                const matchedTag = findTagForHeader(text);
                if (matchedTag) {
                    const nextRow = rows[rowIdx + 1];
                    if (nextRow) {
                        const nextCells = selectWithNs('w:tc', nextRow);
                        const targetCell = nextCells[colIdx];
                        if (targetCell) {
                            const targetText = selectWithNs('.//w:t', targetCell).map(n => n.textContent).join('').trim();
                            const isPlaceholder = targetText === '' || targetText === '-' || targetText.includes('DD-MM-YYYY') || targetText.includes('Place of issue') || targetText.includes('Place of Issue');
                            if (isPlaceholder) {
                                while (targetCell.firstChild) {
                                    targetCell.removeChild(targetCell.firstChild);
                                }
                                const sdtNode = createSdtNode(doc, matchedTag, `{${matchedTag}}`);
                                targetCell.appendChild(sdtNode);
                                tableTaggedCount++;
                            }
                        }
                    }
                }
            });
        });
    });

    // 2. Process paragraphs for inline/block dates
    let pTaggedCount = 0;
    const paragraphs = selectWithNs('//w:p', doc);
    const paragraphsToRemove = new Set();

    paragraphs.forEach((p, idx) => {
        const text = selectWithNs('.//w:t', p).map(n => n.textContent).join('');
        const normalized = normalizeText(text);

        let dateTag = null;
        if (normalized.includes('valid until') || normalized.includes('valido hasta') || normalized.includes('válido hasta')) {
            if (!text.includes('{expiry_date}')) {
                dateTag = 'expiry_date';
            }
        } else if (normalized.includes('completion date of the survey') || normalized.includes('fecha de terminación de la inspección') || normalized.includes('fecha de terminacion') || normalized.includes('completion date of this survey') || normalized.includes('completion date of survey')) {
            if (!text.includes('{survey_completion_date}')) {
                dateTag = 'survey_completion_date';
            }
        }

        if (dateTag) {
            // Get format from the last run in the paragraph
            const runs = selectWithNs('w:r', p);
            let formatPr = null;
            if (runs.length > 0) {
                const lastRun = runs[runs.length - 1];
                formatPr = selectWithNs('w:rPr', lastRun)[0] || null;
            }
            
            // Append inline tag to the paragraph
            const inlineSdt = createInlineSdtNode(doc, dateTag, `{${dateTag}}`, formatPr);
            p.appendChild(inlineSdt);
            pTaggedCount++;

            // Scan next 3 paragraphs and mark them for deletion if they are empty, placeholder, or contain the tag
            for (let offset = 1; offset <= 3; offset++) {
                const nextP = paragraphs[idx + offset];
                if (nextP) {
                    const nextText = selectWithNs('.//w:t', nextP).map(n => n.textContent).join('').trim();
                    const hasSdtTag = selectWithNs('.//w:sdt/w:sdtPr/w:tag', nextP).some(node => {
                        const val = node.getAttribute('w:val');
                        return val === 'expiry_date' || val === 'survey_completion_date';
                    });

                    const isPlaceholder = nextText === '' || 
                                          nextText === '-' || 
                                          nextText.includes('DD-MM-YYYY') || 
                                          nextText.includes('{expiry_date}') || 
                                          nextText.includes('{survey_completion_date}') ||
                                          hasSdtTag;

                    if (isPlaceholder) {
                        paragraphsToRemove.add(nextP);
                    } else {
                        break;
                    }
                }
            }
        }
    });

    // Remove marked paragraphs
    paragraphsToRemove.forEach((p) => {
        if (p.parentNode) {
            p.parentNode.removeChild(p);
        }
    });

    if (tableTaggedCount > 0 || pTaggedCount > 0 || paragraphsToRemove.size > 0) {
        const newXml = new XMLSerializer().serializeToString(doc);
        zip.file('word/document.xml', newXml);
        const newBuffer = await zip.generateAsync({ type: 'nodebuffer' });
        fs.writeFileSync(filePath, newBuffer);
        return true;
    }

    return false;
}

// Helper to list folders in a directory
function getFolders(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true })
        .filter(e => e.isDirectory() && e.name !== '.DS_Store' && e.name !== 'Thumbs.db')
        .map(e => e.name);
}

// Recursive file collector
function findFilesRecursively(dir, filterFn) {
    const results = [];
    function walk(current) {
        const entries = fs.readdirSync(current, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (filterFn(entry.name)) {
                results.push(fullPath);
            }
        }
    }
    walk(dir);
    return results;
}

async function uploadWithRetry(fileBuffer, fileName, mimeType, folder = '', retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await s3Service.uploadFile(fileBuffer, fileName, mimeType, folder);
        } catch (err) {
            console.warn(`      ⚠️ S3 upload failed (attempt ${i + 1}/${retries}): ${err.message}. Retrying...`);
            if (i === retries - 1) throw err;
            await new Promise(r => setTimeout(r, 2000));
        }
    }
}

const main = async () => {
    console.log('🧹 1. Cleaning Database (Truncating tables)...');
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of TABLES_TO_TRUNCATE) {
        try {
            await db.sequelize.query(`TRUNCATE TABLE \`${table}\``);
            console.log(`   - Truncated table: ${table}`);
        } catch (err) {
            console.warn(`   - Skipped table: ${table} (${err.message})`);
        }
    }
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n📂 2. Collecting Certificate Folders...');
    const certFolders = getFolders(ONLY_CERTS_DIR);
    const checklistFolders = getFolders(CHECKLISTS_DIR);

    const folderUnion = new Set([...certFolders, ...checklistFolders]);
    console.log(`   - Found ${folderUnion.size} unique Certificate Types folders.`);

    const typeMap = new Map(); // normalizedName -> CertificateType database row

    console.log('\n🏗️ 3. Seeding Certificate Types...');
    const usedShortCodes = new Set();
    for (const folder of [...folderUnion].sort()) {
        let short_code = deriveShortCode(folder);
        let counter = 1;
        const base_short_code = short_code;
        while (usedShortCodes.has(short_code)) {
            short_code = `${base_short_code.slice(0, 10 - String(counter).length)}${counter}`;
            counter++;
        }
        usedShortCodes.add(short_code);

        const typeRow = await db.CertificateType.create({
            name: folder,
            short_code,
            issuing_authority: 'CLASS',
            validity_years: null,
            status: 'ACTIVE',
            description: `Auto-created from folder: ${folder}`,
            requires_survey: true
        });
        typeMap.set(normalize(folder), typeRow);
        console.log(`   - Created CertificateType: "${folder}" (Code: ${short_code})`);
    }

    console.log('\n📄 4. Tagging, Uploading and Syncing Certificates...');
    let certCount = 0;
    for (const certFolder of certFolders) {
        const matchedType = typeMap.get(normalize(certFolder));
        if (!matchedType) continue;

        const folderPath = path.join(ONLY_CERTS_DIR, certFolder);
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.docx') && !f.startsWith('~$'));

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            await tagSingleDocx(filePath); // tag in-place

            console.log(`   - Uploading certificate ${file}...`);
            const buffer = fs.readFileSync(filePath);
            const key = await uploadWithRetry(
                buffer,
                file,
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'templates/certificates'
            );

            const isST = file.includes('-ST') || file.includes(' - ST') || file.includes('_ST') || file.includes('ST.docx') || file.includes('ST ');
            const term = isST ? 'SHORT_TERM' : 'FULL_TERM';
            const template_name = `${matchedType.name} ${term === 'SHORT_TERM' ? 'ST' : 'FT'}`;

            // Extract tags from the docx file for database seeding
            const zip = await JSZip.loadAsync(buffer);
            const docEntry = zip.file('word/document.xml');
            const scannedTags = new Set();
            if (docEntry) {
                const xml = await docEntry.async('text');
                const doc = new DOMParser().parseFromString(xml, 'text/xml');
                const tagNodes = selectWithNs('//w:sdt/w:sdtPr/w:tag', doc);
                tagNodes.forEach(node => {
                    const val = node.getAttribute('w:val');
                    if (val) scannedTags.add(val);
                });
            }

            await db.CertificateTemplate.create({
                template_name,
                certificate_type_id: matchedType.id,
                certificate_term: term,
                template_file_url: key,
                variables: Array.from(scannedTags),
                is_active: true
            });
            certCount++;
        }
    }
    console.log(`   - Successfully synchronized ${certCount} Certificate templates.`);

    console.log('\n🗒️ 5. Converting, Tagging, Uploading and Syncing Checklists...');
    let checklistCount = 0;
    
    // Check if soffice is available
    let hasSoffice = false;
    try {
        execSync('/opt/homebrew/bin/soffice --version');
        hasSoffice = true;
    } catch {
        console.warn('⚠️ soffice not found in path, skipping .doc to .docx conversion. Script will only process existing .docx files.');
    }

    for (const checklistFolder of checklistFolders) {
        const matchedType = typeMap.get(normalize(checklistFolder));
        if (!matchedType) continue;

        const folderPath = path.join(CHECKLISTS_DIR, checklistFolder);

        // A. Convert .doc to .docx
        if (hasSoffice) {
            const docFiles = findFilesRecursively(folderPath, f => f.endsWith('.doc') && !f.startsWith('~$'));
            for (const docFile of docFiles) {
                console.log(`   - Converting checklist: ${path.basename(docFile)} -> docx`);
                const outDir = path.dirname(docFile);
                try {
                    execSync(`/opt/homebrew/bin/soffice --headless --convert-to docx --outdir "${outDir}" "${docFile}"`);
                    fs.unlinkSync(docFile); // Delete old .doc file
                } catch (err) {
                    console.error(`   - Failed to convert ${docFile}:`, err.message);
                }
            }
        }

        // B. Find all .docx files
        const docxFiles = findFilesRecursively(folderPath, f => f.endsWith('.docx') && !f.startsWith('~$'));
        const s3Keys = [];

        for (const docxFile of docxFiles) {
            await tagSingleDocx(docxFile); // tag in-place

            console.log(`   - Uploading checklist document: ${path.basename(docxFile)}...`);
            const buffer = fs.readFileSync(docxFile);
            const key = await uploadWithRetry(
                buffer,
                path.basename(docxFile),
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                `checklist-templates/${matchedType.id}`
            );
            s3Keys.push(key);
        }

        if (s3Keys.length > 0) {
            const code = `AUTO-${matchedType.short_code || matchedType.id}`;
            await db.ChecklistTemplate.create({
                name: `${matchedType.name} Checklist`,
                code,
                description: `Imported checklist template for ${matchedType.name}`,
                certificate_type_id: matchedType.id,
                sections: [
                    {
                        title: "General Verification Items",
                        items: [
                            { code: "GEN_01", text: "Are all required parameters verified?", type: "yes_no_na" }
                        ]
                    }
                ],
                status: 'ACTIVE',
                template_files: s3Keys,
                metadata: { version: "1.0", source: "filesystem-import" }
            });
            checklistCount++;
        }
    }
    console.log(`   - Successfully synchronized ${checklistCount} Checklist templates.`);
    console.log('\n🚀 ALL MIGRATIONS COMPLETED SUCCESSFULLY!');
};

main()
    .catch(console.error)
    .finally(async () => {
        await db.sequelize.close().catch(() => {});
    });
