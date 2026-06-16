import 'dotenv/config';
import './disable_replica.js';
process.env.DB_LOGGING = 'false';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import xpath from 'xpath';
import { execSync } from 'child_process';
import ExcelJS from 'exceljs';
import bcrypt from 'bcrypt';
import db from '../src/models/index.js';
import * as s3Service from '../src/services/s3.service.js';

const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const selectWithNs = xpath.useNamespaces({ w: WORD_NS });

const PROJECT_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ONLY_CERTS_DIR = path.join(PROJECT_ROOT, 'ONLY CERTIFICATES');
const CHECKLISTS_DIR = path.join(PROJECT_ROOT, 'CHECKLISTS');

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
    'International Pollution Prevention Certificate for the Carriage of Noxious Liquid Substances in Bulk': 'NLS',
    'National Tonnage Certificate (vessel under 24 m in length )': 'TON',
    'Certificate of Fitness for Carriage of Liquefied Gases in Bulk': 'IGC',
    'Certificate of Fitness for Carriage of Dangerous Chemicals in Bulk': 'IBC',
    'Certificate of Compliance with the International Maritime Solid Bulk Cargoes (IMSBC) CODE': 'IMBSC',
    'Document of Compliance with the Special Requirements for Ships Carrying Dangerous Goods': 'CDG',
    'Document of Authorization for the Carriage of Grain': 'GRALO',
    'Statement of Compliance of the International Certificate on Inventory of Hazardous Materials': 'IHMFT',
    'International Certificate of Fitness for Carriage of Dangerous Chemicals in Bulk': 'BCH',
    'Pleasure Craft Safety Certificate': 'PLE'
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

    const words = raw.split(/\s+/).filter(Boolean);
    const initials = words.map((w) => w[0]).join('').replace(/[^A-Za-z0-9]/g, '');
    if (initials.length >= 2) return initials.slice(0, 10).toUpperCase();

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

function createInlineSdtNode(doc, tagName, placeholderText) {
    const sdt = doc.createElementNS(WORD_NS, 'w:sdt');
    const sdtPr = doc.createElementNS(WORD_NS, 'w:sdtPr');
    const tag = doc.createElementNS(WORD_NS, 'w:tag');
    tag.setAttributeNS(WORD_NS, 'w:val', tagName);
    sdtPr.appendChild(tag);
    sdt.appendChild(sdtPr);

    const sdtContent = doc.createElementNS(WORD_NS, 'w:sdtContent');
    const r = doc.createElementNS(WORD_NS, 'w:r');
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
    paragraphs.forEach((p, idx) => {
        const text = selectWithNs('.//w:t', p).map(n => n.textContent).join('');
        const normalized = normalizeText(text);

        let dateTag = null;
        if (normalized.includes('valid until') || normalized.includes('valido hasta') || normalized.includes('válido hasta')) {
            dateTag = 'expiry_date';
        } else if (normalized.includes('completion date of the survey') || normalized.includes('fecha de terminación de la inspección') || normalized.includes('fecha de terminacion')) {
            dateTag = 'survey_completion_date';
        }

        if (dateTag) {
            for (let offset = 1; offset <= 2; offset++) {
                const nextP = paragraphs[idx + offset];
                if (nextP) {
                    const nextText = selectWithNs('.//w:t', nextP).map(n => n.textContent).join('').trim();
                    if (nextText.includes('DD-MM-YYYY') || nextText === '' || nextText.includes('{expiry_date}') || nextText.includes('{survey_completion_date}')) {
                        const existingSdt = selectWithNs(`.//w:sdt[w:sdtPr/w:tag[@w:val="${dateTag}"]]`, p, true);
                        if (!existingSdt) {
                            const sdtNode = createInlineSdtNode(doc, dateTag, `{${dateTag}}`);
                            const runs = selectWithNs('w:r', p);
                            if (runs.length > 0) {
                                const lastRun = runs[runs.length - 1];
                                const lastT = selectWithNs('w:t', lastRun, true);
                                if (lastT && !lastT.textContent.endsWith(' ')) {
                                    lastT.setAttribute('xml:space', 'preserve');
                                    lastT.textContent += ' ';
                                }
                            }
                            p.appendChild(sdtNode);
                            pTaggedCount++;
                        }
                        if (nextP.parentNode) {
                            nextP.parentNode.removeChild(nextP);
                        }
                        break;
                    }
                }
            }
        }
    });

    // 3. Process paragraph for signature block (surveyor_name)
    const paragraphs2 = selectWithNs('//w:p', doc);
    paragraphs2.forEach((p) => {
        const text = selectWithNs('.//w:t', p).map(n => n.textContent).join('');
        if (text.includes('GR CLASS REPRESENTATIVE') || text.includes('GR Class Representative')) {
            const existingSdt = selectWithNs('.//w:sdt[w:sdtPr/w:tag[@w:val="surveyor_name"]]', p, true);
            if (!existingSdt) {
                while (p.firstChild) {
                    p.removeChild(p.firstChild);
                }
                const pPr = doc.createElementNS(WORD_NS, 'w:pPr');
                const jc = doc.createElementNS(WORD_NS, 'w:jc');
                jc.setAttributeNS(WORD_NS, 'w:val', 'right');
                pPr.appendChild(jc);
                const spacing = doc.createElementNS(WORD_NS, 'w:spacing');
                spacing.setAttributeNS(WORD_NS, 'w:after', '200');
                pPr.appendChild(spacing);
                p.appendChild(pPr);

                const sdtNode = createInlineSdtNode(doc, 'surveyor_name', '{surveyor_name}');
                p.appendChild(sdtNode);

                const r = doc.createElementNS(WORD_NS, 'w:r');
                const rPr = doc.createElementNS(WORD_NS, 'w:rPr');
                const rFonts = doc.createElementNS(WORD_NS, 'w:rFonts');
                rFonts.setAttributeNS(WORD_NS, 'w:ascii', 'Arial');
                rFonts.setAttributeNS(WORD_NS, 'w:hAnsi', 'Arial');
                rPr.appendChild(rFonts);
                const bold = doc.createElementNS(WORD_NS, 'w:bold');
                rPr.appendChild(bold);
                const sz = doc.createElementNS(WORD_NS, 'w:sz');
                sz.setAttributeNS(WORD_NS, 'w:val', '18');
                rPr.appendChild(sz);
                r.appendChild(rPr);

                const br = doc.createElementNS(WORD_NS, 'w:br');
                r.appendChild(br);

                const t = doc.createElementNS(WORD_NS, 'w:t');
                t.appendChild(doc.createTextNode('GR CLASS REPRESENTATIVE'));
                r.appendChild(t);
                p.appendChild(r);
                pTaggedCount++;
            }
        }
    });

    if (tableTaggedCount > 0 || pTaggedCount > 0) {
        const newXml = new XMLSerializer().serializeToString(doc);
        zip.file('word/document.xml', newXml);
        const newBuffer = await zip.generateAsync({ type: 'nodebuffer' });
        fs.writeFileSync(filePath, newBuffer);
        return true;
    }

    return false;
}

function getFolders(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true })
        .filter(e => e.isDirectory() && e.name !== '.DS_Store' && e.name !== 'Thumbs.db')
        .map(e => e.name);
}

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
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}

async function parallelLimit(items, fn, limit = 5) {
    const results = [];
    const executing = new Set();
    for (const item of items) {
        const p = Promise.resolve().then(() => fn(item));
        results.push(p);
        executing.add(p);
        const clean = () => executing.delete(p);
        p.then(clean, clean);
        if (executing.size >= limit) {
            await Promise.race(executing);
        }
    }
    return Promise.all(results);
}

async function syncRequiredDocuments(typeMap) {
    const filePath = path.join(PROJECT_ROOT, 'DOCUMENTS REQUIRED.xlsx');
    console.log(`📄 Loading required documents from: ${filePath}`);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);
    
    const rows = [];
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // skip header
        const values = row.values;
        const certName = String(values[2] || '').trim();
        const shortCode = String(values[3] || '').trim();
        const docName = String(values[4] || '').trim();
        
        if (docName && certName) {
            rows.push({ certName, shortCode, docName });
        }
    });

    console.log(`✅ Found ${rows.length} valid required document rows in Excel.`);

    const dbCodeMap = new Map();
    for (const [key, type] of typeMap.entries()) {
        if (type.short_code) {
            dbCodeMap.set(normalize(type.short_code), type);
        }
    }

    let docCreated = 0;
    const bulkDocs = [];
    const seenKeys = new Set();

    for (const row of rows) {
        const normalizedCert = normalize(row.certName);
        const normalizedCode = normalize(row.shortCode);
        
        let certType = dbCodeMap.get(normalizedCode) || typeMap.get(normalizedCert);
        if (!certType) continue;

        const dedupeKey = `${certType.id}::${row.docName}`;
        if (seenKeys.has(dedupeKey)) continue;
        seenKeys.add(dedupeKey);

        const isOtherDoc = row.docName.toUpperCase().includes('OTHER DOCUMENT');
        bulkDocs.push({
            certificate_type_id: certType.id,
            document_name: row.docName,
            is_mandatory: !isOtherDoc
        });
    }

    if (bulkDocs.length > 0) {
        await db.CertificateRequiredDocument.bulkCreate(bulkDocs, { ignoreDuplicates: true });
        docCreated = bulkDocs.length;
    }

    console.log(`📊 Required Documents Created: ${docCreated}`);
}

// Predefined realistic questions for key certificate types
const PREDEFINED_CHECKLISTS = {
    AFS: {
        title: "Anti-Fouling System (AFS) Verification",
        items: [
            { code: "AFS-01", text: "Verify the anti-fouling system applied does not contain organotin compounds acting as biocides.", type: "YES_NO_NA" },
            { code: "AFS-02", text: "Confirm the product name, manufacturer, and color match the manufacturer's technical data sheets.", type: "YES_NO_NA" },
            { code: "AFS-03", text: "Verify sealer coat details (if applicable) are correctly recorded in the record of anti-fouling systems.", type: "YES_NO_NA" }
        ]
    },
    BWM: {
        title: "Ballast Water Management System (BWMS) Compliance",
        items: [
            { code: "BWM-01", text: "Verify the Ballast Water Management Plan is approved and available on board.", type: "YES_NO" },
            { code: "BWM-02", text: "Check if the Ballast Water Record Book is up-to-date and entries are signed.", type: "YES_NO" },
            { code: "BWM-03", text: "Verify BWMS operational status, check alarms, and verify self-monitoring equipment is functional.", type: "YES_NO_NA" },
            { code: "BWM-04", text: "Ensure sampling facilities and bilge pumping arrangements are in clean working condition.", type: "YES_NO_NA" }
        ]
    },
    LL: {
        title: "International Load Line Convention Verification",
        items: [
            { code: "LL-01", text: "Verify freeboard marks are permanently marked and clearly painted on both sides of the hull.", type: "YES_NO" },
            { code: "LL-02", text: "Examine weathertight doors, hatch covers, ventilators, and air pipes.", type: "YES_NO" },
            { code: "LL-03", text: "Verify side scuttles, deadlights, scuppers, and discharges are in good condition.", type: "YES_NO" }
        ]
    },
    'BOTTOM INSPECTION': {
        title: "Bottom and Under Water Inspection Items",
        items: [
            { code: "BI-01", text: "Inspect external hull bottom plating for signs of deformation, cracking, and severe corrosion.", type: "YES_NO" },
            { code: "BI-02", text: "Check condition of keel, bilge keels, rudder, propeller, and sea chest grids.", type: "YES_NO" },
            { code: "BI-03", text: "Verify sacrificial anodes are checked for wastage and replaced as necessary.", type: "YES_NO_NA" },
            { code: "BI-04", text: "Verify sea valves and chest valves are examined and overhauled as required.", type: "YES_NO_NA" }
        ]
    },
    SMC: {
        title: "Safety Management System Verification",
        items: [
            { code: "SMC-01", text: "Verify the Document of Compliance (DOC) copy is available on board and valid.", type: "YES_NO" },
            { code: "SMC-02", text: "Are emergency drills (fire, abandon ship, spill) conducted regularly and logged?", type: "YES_NO" },
            { code: "SMC-03", text: "Are crew members familiar with their duties in emergency situations?", type: "YES_NO" }
        ]
    },
    IAPP: {
        title: "Ozone Depleting Substances and NOx Emissions",
        items: [
            { code: "IAPP-01", text: "Verify the Ozone Depleting Substances (ODS) record book is updated.", type: "YES_NO_NA" },
            { code: "IAPP-02", text: "Are marine diesel engines compliant with MARPOL Annex VI NOx limits?", type: "YES_NO" },
            { code: "IAPP-03", text: "Is the sulfur content of fuel oil verified to be within regulatory limits (e.g. 0.50% / 0.10%)?", type: "YES_NO" }
        ]
    },
    ISSC: {
        title: "ISPS Code Security Verification",
        items: [
            { code: "ISSC-01", text: "Verify the approved Ship Security Plan (SSP) is on board and kept confidential.", type: "YES_NO" },
            { code: "ISSC-02", text: "Ensure ship security officer (SSO) and crew are familiar with security levels and duties.", type: "YES_NO" },
            { code: "ISSC-03", text: "Test Ship Security Alert System (SSAS) and verify security logbook entries.", type: "YES_NO" }
        ]
    },
    MLC: {
        title: "MLC 2006 Seafarer Welfare Audits",
        items: [
            { code: "MLC-01", text: "Verify seafarer employment agreements (SEAs) are valid, signed, and present.", type: "YES_NO" },
            { code: "MLC-02", text: "Verify seafarers' hours of work and rest records are properly signed and compliant.", type: "YES_NO" },
            { code: "MLC-03", text: "Inspect crew accommodation, galley, mess room, food storage, and medical facilities.", type: "YES_NO" }
        ]
    }
};

const main = async () => {
    try {
        console.log('--- Starting Realistic Database Reseeding & specified Cleanup ---');

        const dialect = db.sequelize.getDialect();
        if (dialect === 'mysql') {
            console.log('🧹 Dropping all existing tables in database...');
            await db.sequelize.transaction(async (t) => {
                await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction: t });
                const [tables] = await db.sequelize.query('SHOW TABLES', { transaction: t });
                const tableNames = tables.map(r => Object.values(r)[0]);
                for (const tableName of tableNames) {
                    await db.sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\``, { transaction: t });
                    console.log(`   - Dropped table: ${tableName}`);
                }
                await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction: t });
            });
        }

        console.log('🔄 Recreating all database tables from models...');
        await db.sequelize.sync({ force: false });
        console.log('✅ Database tables successfully recreated.');

        // 1. Seed Default System Users
        console.log('👤 Seeding default users (Admin, Manager, Surveyor)...');
        const hashedPw = await bcrypt.hash("Password@123", 10);
        
        const defaultUsers = [
            { name: "System Admin", email: "info@grclass.com", role: "ADMIN", status: "ACTIVE", password_hash: hashedPw },
            { name: "Technical Manager", email: "tm@grclass.com", role: "TM", status: "ACTIVE", password_hash: hashedPw },
            { name: "General Manager", email: "gm@grclass.com", role: "GM", status: "ACTIVE", password_hash: hashedPw },
            { name: "Technical Officer", email: "to@grclass.com", role: "TO", status: "ACTIVE", password_hash: hashedPw },
            { name: "Abhinav Surveyor", email: "abhivishwkarmaa52@gmail.com", role: "SURVEYOR", status: "ACTIVE", password_hash: hashedPw },
            { name: "Abhishek Surveyor", email: "abhisheksingh9709844475@gmail.com", role: "SURVEYOR", status: "ACTIVE", password_hash: hashedPw }
        ];

        const users = await db.User.bulkCreate(defaultUsers, { returning: true });
        const adminUser = users.find(u => u.role === 'ADMIN');
        const creatorId = adminUser ? adminUser.id : null;
        console.log(`   Created ${users.length} system users.`);

        // Seed Surveyor Profiles
        const surveyorUsers = users.filter(u => u.role === 'SURVEYOR');
        const surveyorProfilesData = surveyorUsers.map((su, index) => ({
            user_id: su.id,
            license_number: `GR-SURV-00${index + 1}`,
            authorized_ship_types: ["Bulk Carrier", "Oil Tanker", "Container Ship", "General Cargo"],
            authorized_certificates: ["AFS", "BWM", "LL", "BOTTOM INSPECTION", "SMC", "IAPP", "ISSC", "MLC"],
            status: 'ACTIVE',
            is_available: true,
            nationality: 'Indian',
            qualification: 'Marine Engineer / Master Mariner',
            years_of_experience: 10 + index
        }));

        await db.SurveyorProfile.bulkCreate(surveyorProfilesData);
        console.log(`   Created ${surveyorProfilesData.length} surveyor profiles.`);

        // 3. Seed Flag Administrations
        console.log('\n🚢 Seeding realistic flag administrations...');
        const flagsData = [
            { flag_state_name: 'Singapore Shipping Registry', country: 'Singapore', authority_name: 'Maritime and Port Authority of Singapore', contact_email: 'registry@mpa.gov.sg', status: 'ACTIVE' },
            { flag_state_name: 'Panama Shipping Authority', country: 'Panama', authority_name: 'Panama Maritime Authority', contact_email: 'flag@panamashippingauthority.com', status: 'ACTIVE' },
            { flag_state_name: 'Liberian Shipping Registry', country: 'Liberia', authority_name: 'Liberia Maritime Authority', contact_email: 'flag@liberianshippingauthority.com', status: 'ACTIVE' },
            { flag_state_name: 'Marshall Islands Registry', country: 'Marshall Islands', authority_name: 'Marshall Islands Shipping Registry', contact_email: 'flag@marshallislandsregistry.com', status: 'ACTIVE' }
        ];
        const flags = await db.FlagAdministration.bulkCreate(flagsData, { returning: true });
        console.log(`   Created ${flags.length} flag administrations.`);

        // 4. Seed Client & associated Client User
        console.log('\n👤 Seeding client shipping company and user...');
        const client = await db.Client.create({
            company_name: "Blue Star Shipping Lines Ltd.",
            company_code: "BSSL",
            address: "Marina Bay Financial Centre, Singapore",
            email: "operations@bluestarshipping.com",
            contact_person_name: "Capt. Henry Morgan",
            contact_person_email: "henry.morgan@bluestarshipping.com",
            phone: "+65 6789 0123",
            status: "ACTIVE"
        });
        console.log(`   Created Client: ${client.company_name}`);

        const clientUser = await db.User.create({
            name: "Henry Morgan",
            email: "operations@bluestarshipping.com",
            role: "CLIENT",
            password_hash: hashedPw,
            client_id: client.id,
            status: "ACTIVE"
        });
        console.log(`   Created Client User: ${clientUser.email}`);

        // 5. Seed Vessels mapped to the client & flags
        console.log('\n🚢 Seeding realistic vessels...');
        const vesselsData = [
            {
                client_id: client.id,
                flag_administration_id: flags[0].id, // Singapore
                vessel_name: "Blue Star Orion",
                imo_number: "9812345",
                call_sign: "9V8765",
                mmsi_number: "563123456",
                port_of_registry: "Singapore",
                year_built: 2019,
                ship_type: "Bulk Carrier",
                gross_tonnage: 43500,
                net_tonnage: 24200,
                deadweight: 82000,
                class_status: "ACTIVE",
                current_class_society: "GR-Class",
                engine_type: "MAN B&W 6S60ME-C8",
                builder_name: "Imabari Shipbuilding"
            },
            {
                client_id: client.id,
                flag_administration_id: flags[1].id, // Panama
                vessel_name: "Blue Star Polaris",
                imo_number: "9745678",
                call_sign: "HP4321",
                mmsi_number: "354123456",
                port_of_registry: "Panama City",
                year_built: 2021,
                ship_type: "Oil Tanker",
                gross_tonnage: 61200,
                net_tonnage: 34100,
                deadweight: 115000,
                class_status: "ACTIVE",
                current_class_society: "GR-Class",
                engine_type: "Wartsila 6RT-flex58T-D",
                builder_name: "Hyundai Samho Heavy Industries"
            },
            {
                client_id: client.id,
                flag_administration_id: flags[2].id, // Liberia
                vessel_name: "Blue Star Sirius",
                imo_number: "9698765",
                call_sign: "D5XY8",
                mmsi_number: "636123456",
                port_of_registry: "Monrovia",
                year_built: 2016,
                ship_type: "Container Ship",
                gross_tonnage: 94500,
                net_tonnage: 48900,
                deadweight: 104000,
                class_status: "ACTIVE",
                current_class_society: "GR-Class",
                engine_type: "MAN B&W 10S90ME-C9",
                builder_name: "Mitsubishi Heavy Industries"
            }
        ];
        const vessels = await db.Vessel.bulkCreate(vesselsData);
        console.log(`   Created ${vessels.length} vessels.`);

        // 6. Collect Certificate Folders
        console.log('\n📂 Collecting Certificate Folders...');
        const certFolders = getFolders(ONLY_CERTS_DIR);
        const checklistFolders = getFolders(CHECKLISTS_DIR);

        const uniqueNormalizedFolders = new Map();
        for (const folder of certFolders) {
            const norm = normalize(folder);
            if (!uniqueNormalizedFolders.has(norm)) {
                uniqueNormalizedFolders.set(norm, folder);
            }
        }
        console.log(`   - Found ${uniqueNormalizedFolders.size} unique normalized Certificate Types from ONLY CERTIFICATES.`);

        const checklistFolderMap = new Map();
        for (const folder of checklistFolders) {
            checklistFolderMap.set(normalize(folder), folder);
        }

        const typeMap = new Map();

        // 7. Seed Certificate Types
        console.log('\n🏗️ Seeding Certificate Types...');
        const usedShortCodes = new Set();
        const sortedFolders = Array.from(uniqueNormalizedFolders.values()).sort();
        const certTypesToCreate = [];
        for (const folder of sortedFolders) {
            let short_code = deriveShortCode(folder);
            let counter = 1;
            const base_short_code = short_code;
            while (usedShortCodes.has(short_code)) {
                short_code = `${base_short_code.slice(0, 10 - String(counter).length)}${counter}`;
                counter++;
            }
            usedShortCodes.add(short_code);

            certTypesToCreate.push({
                name: folder,
                short_code,
                issuing_authority: 'CLASS',
                validity_years: 5,
                status: 'ACTIVE',
                description: `Auto-created from folder: ${folder}`,
                requires_survey: true
            });
        }
        const createdCertTypes = await db.CertificateType.bulkCreate(certTypesToCreate, { returning: true });
        for (const type of createdCertTypes) {
            typeMap.set(normalize(type.name), type);
        }
        console.log(`   - Created ${createdCertTypes.length} CertificateTypes.`);

        // 8. Seeding HTML Certificate Templates (batched)
        console.log('\n📄 Reading and Syncing HTML Certificate Templates...');
        const templatesToCreate = [];
        for (const certFolder of certFolders) {
            const matchedType = typeMap.get(normalize(certFolder));
            if (!matchedType) continue;

            const folderPath = path.join(ONLY_CERTS_DIR, certFolder);
            const htmlFolder = path.join(folderPath, 'html');
            if (!fs.existsSync(htmlFolder)) continue;

            const files = fs.readdirSync(htmlFolder).filter(f => f.endsWith('.html') && !f.startsWith('~$'));

            for (const file of files) {
                const filePath = path.join(htmlFolder, file);
                const htmlContent = fs.readFileSync(filePath, 'utf8');

                const isST = file.includes('_ST_') || file.includes('-ST') || file.includes('ST.html') || file.includes('ST ') || file.includes('_ST.');
                const term = isST ? 'SHORT_TERM' : 'FULL_TERM';
                const template_name = `${matchedType.name} ${term === 'SHORT_TERM' ? 'ST' : 'FT'}`;

                // Scan tags from HTML content
                const scannedTags = new Set();
                const tagRegex = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}|\{\s*([a-zA-Z0-9_.-]+)\s*\}/g;
                let match;
                while ((match = tagRegex.exec(htmlContent)) !== null) {
                    const val = match[1] || match[2];
                    if (val) scannedTags.add(val);
                }

                templatesToCreate.push({
                    template_name,
                    certificate_type_id: matchedType.id,
                    certificate_term: term,
                    template_content: htmlContent,
                    variables: Array.from(scannedTags),
                    is_active: true
                });
            }
        }
        if (templatesToCreate.length > 0) {
            await db.CertificateTemplate.bulkCreate(templatesToCreate);
        }
        console.log(`   - Successfully synchronized ${templatesToCreate.length} Certificate templates.`);

        // 9. Sync Checklist Templates & Questions
        console.log('\n🗒️ Seeding Checklists...');
        let checklistCount = 0;

        let hasSoffice = false;
        try {
            execSync('/opt/homebrew/bin/soffice --version');
            hasSoffice = true;
        } catch {
            console.warn('⚠️ soffice not found in path, skipping .doc to .docx conversion. Only processing existing .docx files.');
        }

        const checklistsToProcess = [];
        for (const certFolder of sortedFolders) {
            const matchedType = typeMap.get(normalize(certFolder));
            if (!matchedType) continue;

            const normKey = normalize(certFolder);
            const checklistFolder = checklistFolderMap.get(normKey);
            const folderPath = checklistFolder ? path.join(CHECKLISTS_DIR, checklistFolder) : null;
            checklistsToProcess.push({ matchedType, folderPath, normKey });
        }

        const allDocFiles = [];
        for (const item of checklistsToProcess) {
            const { folderPath } = item;
            if (folderPath && fs.existsSync(folderPath)) {
                if (hasSoffice) {
                    const docFiles = findFilesRecursively(folderPath, f => f.endsWith('.doc') && !f.startsWith('~$'));
                    allDocFiles.push(...docFiles);
                }
            }
        }

        if (allDocFiles.length > 0) {
            console.log(`Converting ${allDocFiles.length} doc files to docx...`);
            await parallelLimit(allDocFiles, async (docFile) => {
                const outDir = path.dirname(docFile);
                try {
                    execSync(`/opt/homebrew/bin/soffice --headless --convert-to docx --outdir "${outDir}" "${docFile}"`);
                    fs.unlinkSync(docFile);
                } catch (err) {
                    console.error(`   - Failed to convert ${docFile}:`, err.message);
                }
            }, 5);
        }

        const docxTasks = [];
        for (const item of checklistsToProcess) {
            const { matchedType, folderPath } = item;
            const s3Keys = [];
            if (folderPath && fs.existsSync(folderPath)) {
                const docxFiles = findFilesRecursively(folderPath, f => f.endsWith('.docx') && !f.startsWith('~$'));
                docxTasks.push({ matchedType, docxFiles, s3Keys });
            } else {
                docxTasks.push({ matchedType, docxFiles: [], s3Keys });
            }
        }

        const allDocxUploadTasks = [];
        for (const task of docxTasks) {
            for (const docxFile of task.docxFiles) {
                allDocxUploadTasks.push({ task, docxFile });
            }
        }

        console.log(`Tagging and uploading ${allDocxUploadTasks.length} checklist files in parallel...`);
        await Promise.all(allDocxUploadTasks.map(async (uTask) => {
            await tagSingleDocx(uTask.docxFile);
        }));

        await parallelLimit(allDocxUploadTasks, async (uTask) => {
            const buffer = fs.readFileSync(uTask.docxFile);
            try {
                const key = await uploadWithRetry(
                    buffer,
                    path.basename(uTask.docxFile),
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    `checklist-templates/${uTask.task.matchedType.id}`
                );
                uTask.task.s3Keys.push(key);
            } catch (uploadErr) {
                console.error(`   - Failed to upload checklist ${path.basename(uTask.docxFile)}: ${uploadErr.message}`);
            }
        }, 10);

        console.log('Seeding ChecklistTemplates in DB...');
        for (const task of docxTasks) {
            const { matchedType, s3Keys } = task;
            const shortCodeKey = matchedType.short_code || '';
            let checklistData = PREDEFINED_CHECKLISTS[shortCodeKey] || PREDEFINED_CHECKLISTS[matchedType.name];
            if (!checklistData) {
                checklistData = {
                    title: `${matchedType.name} General Inspection`,
                    items: [
                        { code: `${shortCodeKey}-01`, text: "Verify statutory logs and survey records are updated.", type: "YES_NO" },
                        { code: `${shortCodeKey}-02`, text: "Examine key structural and machinery equipment associated with this certificate type.", type: "YES_NO" },
                        { code: `${shortCodeKey}-03`, text: "Confirm crew members are fully trained in the relevant operational guidelines.", type: "YES_NO" }
                    ]
                };
            }

            const code = `AUTO-${matchedType.short_code || matchedType.id}`;
            const template = await db.ChecklistTemplate.create({
                name: `${matchedType.name} Checklist`,
                code,
                description: `Imported checklist template for ${matchedType.name}`,
                certificate_type_id: matchedType.id,
                sections: [
                    {
                        title: checklistData.title,
                        items: checklistData.items
                    }
                ],
                status: 'ACTIVE',
                template_files: s3Keys,
                metadata: { version: "1.0", source: "filesystem-import" },
                created_by: creatorId,
                updated_by: creatorId
            });

            const templateFilesData = [];
            for (let i = 0; i < s3Keys.length; i++) {
                const key = s3Keys[i];
                const keyParts = key.split('/');
                const rawName = keyParts[keyParts.length - 1] || 'Document';
                const cleanName = rawName.replace(/^\d+_/ || /^[a-f0-9-]+_/, '');
                templateFilesData.push({
                    checklist_template_id: template.id,
                    name: cleanName,
                    file_key: key,
                    display_order: i,
                    is_mandatory: true,
                    created_by: creatorId
                });
            }
            if (templateFilesData.length > 0) {
                await db.ChecklistTemplateFile.bulkCreate(templateFilesData);
            }
            checklistCount++;
        }
        console.log(`   - Successfully seeded ${checklistCount} Checklist templates.`);

        // 10. Sync Required Documents from Excel
        console.log('\n🗒️ Syncing Required Documents from Excel...');
        await syncRequiredDocuments(typeMap);

        console.log('\n✨ Database Sync & Seed completed successfully! ✨');
        process.exit(0);
    } catch (err) {
        console.error('❌ Database Sync & Seed failed:', err);
        process.exit(1);
    }
};

main();
