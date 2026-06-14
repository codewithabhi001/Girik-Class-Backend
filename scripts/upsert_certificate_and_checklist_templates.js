/**
 * upsert_certificate_and_checklist_templates.js
 *
 * NON-DESTRUCTIVE upsert of certificate templates and checklist templates.
 *
 * Certificate Templates  (ONLY CERTIFICATES/<TypeFolder>/*.docx)
 *   ─ Tags DOCX files in-place with content-control placeholders
 *   ─ Uploads to S3 under  templates/certificates/
 *   ─ Deactivates any existing CertificateTemplate rows for that
 *     (certificate_type_id + certificate_term) combination
 *   ─ Creates a new active CertificateTemplate row
 *
 * Checklist Templates  (CHECKLISTS/<TypeFolder>/**‌/*.docx)
 *   ─ Uploads to S3 under  checklist-templates/<typeId>/
 *   ─ Finds or creates a ChecklistTemplate row (keyed by auto-code)
 *   ─ Replaces ALL ChecklistTemplateFile rows for that template
 *     (deletes old ones, inserts fresh rows matching the files on disk)
 *
 * Usage:
 *   node scripts/upsert_certificate_and_checklist_templates.js
 *
 * Options (env vars):
 *   CERT_ONLY=true   → skip checklist upsert
 *   CHECK_ONLY=true  → skip certificate upsert
 *   DRY_RUN=true     → print what would happen without touching DB / S3
 */

import 'dotenv/config';
import './disable_replica.js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import JSZip from 'jszip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import xpath from 'xpath';
import db from '../src/models/index.js';
import * as s3Service from '../src/services/s3.service.js';

// ─── Config ──────────────────────────────────────────────────────────────────

const PROJECT_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ONLY_CERTS_DIR = path.join(PROJECT_ROOT, 'ONLY CERTIFICATES');
const CHECKLISTS_DIR = path.join(PROJECT_ROOT, 'CHECKLISTS');

const CERT_ONLY   = process.env.CERT_ONLY === 'true';
const CHECK_ONLY  = process.env.CHECK_ONLY === 'true';
const DRY_RUN     = process.env.DRY_RUN === 'true';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const WORD_NS   = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const selectWithNs = xpath.useNamespaces({ w: WORD_NS });

// ─── Alias map (folder name → short_code or canonical name in DB) ─────────────

const CERTIFICATE_TYPE_ALIASES = {
    'AFS': 'AFS',
    'ANTI FOULING SYSTEM CERTIFICATE': 'AFS',
    'ANTI-FOULING SYSTEM CERTIFICATE': 'AFS',
    'ANTIFOULINGSYSTEMCERTIFICATE': 'AFS',
    'BALLAST WATER MANAGEMENT CERTIFICATE': 'BWM',
    'BALLASTWATERMANAGEMENTCERTIFICATE': 'BWM',
    'IBWMC': 'BWM',
    'BOTTOM INSPECTION': 'BOTTOM INSPECTION',
    'BOTTOMINSPECTION': 'BOTTOM INSPECTION',
    'CARGO SHIP SAFETY CERTIFICATE': 'CSSC',
    'CARGO SHIP SAFETY CONSTRUCTION CERTIFICATE': 'CSSCC',
    'CARGO SHIP SAFETY EQUIPMENT CERTIFICATE': 'CSSEC',
    'CARGO SHIP SAFETY RADIO CERTIFICATE': 'CSSRC',
    'CARGO SHIP SAFETY RADIOTELEPHONY CERTIFICATE': 'CSSRTC',
    'CARIBBEAN CARGO SHIP SAFETY CERTIFICATE': 'CCSSC',
    'CICA': 'CICA',
    'DOC': 'DOC',
    'DOCKING SURVEY': 'DOCKING SURVEY',
    'Docking Survey': 'DOCKING SURVEY',
    'DOCKINGSURVEY': 'DOCKING SURVEY',
    'EIAPP': 'EIAPP',
    'FISHING VESSEL SAFETY CERTIFICATE': 'FVSC',
    'FISHINGVESSELSAFETYCERTIFICATE': 'FVSC',
    'HM': 'HM',
    'HIGH SPEED CRAFT SAFETY CERTIFICATE': 'HSC',
    'HIGHSPEEDCRAFTSAFETYCERTIFICATE': 'HSC',
    'IAPP': 'IAPP',
    'INTERNATIONAL OIL POLLUTION PREVENTION CERTIFICATE': 'IOPPC',
    'INTERNATIONALOILPOLLUTIONPREVENTIONCERTIFICATE': 'IOPPC',
    'INTERNATIONAL SEWAGE POLLUTION PREVENTION CERTIFICATE': 'ISPP',
    'INTERNATIONALSEWAGEPOLLUTIONPREVENTIONCERTIFICATE': 'ISPP',
    'ISSC': 'ISSC',
    'ITC': 'ITC',
    'LL': 'LL',
    'MLC': 'MLC',
    'MODU': 'MODU',
    'SMC': 'SMC',
    'SPS': 'SPS',
    'CG': 'CG',
    'IGPP': 'IGPP',
    'Garbage Management Certificate': 'GMC',
    'GARBAGEMANAGEMENTCERTIFICATE': 'GMC',
    'SEA WORTHINESS CERTIFICATE': 'SEA WORTHINESS CERTIFICATE',
    'Sea Worthiness Certificate': 'SEA WORTHINESS CERTIFICATE',
    'SEAWORTHINESSCERTIFICATE': 'SEA WORTHINESS CERTIFICATE',
    'National Tonnage Certificate (vessel under 24 m in length )': 'TON',
    'NATIONALTONNAGECERTIFICATE': 'TON',
    'Certificate of Fitness for Carriage of Liquefied Gases in Bulk': 'IGC',
    'Certificate of Fitness for Carriage of Dangerous Chemicals in Bulk': 'IBC',
    'Certificate of Compliance with the International Maritime Solid Bulk Cargoes (IMSBC) CODE': 'IMBSC',
    'Document of Compliance with the Special Requirements for Ships Carrying Dangerous Goods': 'CDG',
    'Document of Authorization for the Carriage of Grain': 'GRALO',
    'Statement of Compliance of the International Certificate on Inventory of Hazardous Materials': 'IHMFT',
    'International Certificate of Fitness for Carriage of Dangerous Chemicals in Bulk': 'BCH',
    'International Pollution Prevention Certificate for the Carriage of Noxious Liquid Substances in Bulk': 'NLS',
    'Pleasure Craft Safety Certificate': 'PLE',
    'PLEASURECRAFTSAFETYCERTIFICATE': 'PLE',
};

const HEADER_TAG_RULES = [
    { keys: ['name of ship', 'name of vessel', 'vesselname', 'nombre de la nave', 'name of ship / nombre de la nave'], tag: 'vessel_name' },
    { keys: ['distinctive number or letters', 'call sign', 'señal distintiva', 'distinctive number'], tag: 'call_sign' },
    { keys: ['port of registry', 'puerto de registro', 'port of registry / puerto de registro'], tag: 'port_of_registry' },
    { keys: ['gross tonnage', 'arqueo bruto'], tag: 'gross_tonnage' },
    { keys: ['imo number', 'imo no.', 'imo no', 'imo nº'], tag: 'imo_number' },
    { keys: ['issued at', 'expedido en', 'issued at / expedido en'], tag: 'place_of_survey' },
    { keys: ['date of issue', 'fecha de emision', 'fecha de emisión'], tag: 'issue_date' },
    { keys: ['date of construction', 'date of built', 'date of build', 'keel laid', 'date on which keel was laid'], tag: 'year_built' },
    { keys: ['ballast water capacity', 'capacidad de agua de lastre'], tag: 'ballast_water_capacity' },
    { keys: ['deadweight', 'peso muerto', 'deadweight of ship (metric tons)1'], tag: 'deadweight' },
    { keys: ['net tonnage', 'arqueo neto'], tag: 'net_tonnage' },
    { keys: ['ship type', 'tipo de buque', 'type of ship'], tag: 'ship_type' },
    { keys: ['certificate number', 'no de certificado', 'certificate no.'], tag: 'certificate_number' },
    { keys: ['surveyor name', 'nombre del inspector', 'auditor name'], tag: 'surveyor_name' },
    { keys: ['facility name', 'name of the facility', 'facility'], tag: 'facility_name' },
    { keys: ['facility date', 'date of facility', 'date of application', 'date of removal'], tag: 'facility_date' },
    { keys: ['compliance deadline', 'deadline of compliance'], tag: 'compliance_deadline' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalize(value) {
    return String(value || '')
        .normalize('NFKD')
        .replace(/[^\w\s]/g, '')
        .replace(/_/g, ' ')
        .replace(/\s+/g, '')
        .toUpperCase();
}

function findTagForHeader(headerText) {
    const norm = headerText.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const rule of HEADER_TAG_RULES) {
        for (const key of rule.keys) {
            const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (norm.includes(normKey)) return rule.tag;
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

async function tagDocxInPlace(filePath) {
    const buffer = fs.readFileSync(filePath);
    let zip;
    try {
        zip = await JSZip.loadAsync(buffer);
    } catch {
        console.warn(`  [SKIP] Corrupt zip: ${path.basename(filePath)}`);
        return false;
    }
    const entry = zip.file('word/document.xml');
    if (!entry) return false;

    const xml = await entry.async('text');
    const doc = new DOMParser().parseFromString(xml, 'text/xml');

    let modified = 0;

    // 1. Tables
    const tables = selectWithNs('//w:tbl', doc);
    tables.forEach((tbl) => {
        const rows = selectWithNs('w:tr', tbl);
        rows.forEach((row, rowIdx) => {
            const cells = selectWithNs('w:tc', row);
            cells.forEach((cell, colIdx) => {
                const text = selectWithNs('.//w:t', cell).map(n => n.textContent).join('');
                if (!text.trim() || text.includes('{') || text.includes('}')) return;
                const tag = findTagForHeader(text);
                if (tag) {
                    const nextRow = rows[rowIdx + 1];
                    if (nextRow) {
                        const nextCells = selectWithNs('w:tc', nextRow);
                        const target = nextCells[colIdx];
                        if (target) {
                            const targetText = selectWithNs('.//w:t', target).map(n => n.textContent).join('').trim();
                            if (targetText === '' || targetText === '-' || targetText.includes('DD-MM-YYYY') || /place of (issue|survey)/i.test(targetText)) {
                                while (target.firstChild) target.removeChild(target.firstChild);
                                target.appendChild(createSdtNode(doc, tag, `{${tag}}`));
                                modified++;
                            }
                        }
                    }
                }
            });
        });
    });

    // 2. Paragraphs — date fields
    const paragraphs = selectWithNs('//w:p', doc);
    paragraphs.forEach((p, idx) => {
        const text = selectWithNs('.//w:t', p).map(n => n.textContent).join('');
        const norm = normalizeText(text);
        let dateTag = null;
        if (norm.includes('valid until') || norm.includes('valido hasta') || norm.includes('válido hasta')) dateTag = 'expiry_date';
        else if (norm.includes('completion date of the survey') || norm.includes('fecha de terminación')) dateTag = 'survey_completion_date';

        if (dateTag) {
            for (let offset = 1; offset <= 2; offset++) {
                const next = paragraphs[idx + offset];
                if (next) {
                    const nextText = selectWithNs('.//w:t', next).map(n => n.textContent).join('').trim();
                    if (nextText.includes('DD-MM-YYYY') || nextText === '' || nextText.includes(`{${dateTag}}`)) {
                        const existing = selectWithNs(`.//w:sdt[w:sdtPr/w:tag[@w:val="${dateTag}"]]`, p, true);
                        if (!existing) {
                            p.appendChild(createInlineSdtNode(doc, dateTag, `{${dateTag}}`));
                            modified++;
                        }
                        if (next.parentNode) next.parentNode.removeChild(next);
                        break;
                    }
                }
            }
        }
    });

    // 3. Surveyor name block
    const paragraphs2 = selectWithNs('//w:p', doc);
    paragraphs2.forEach((p) => {
        const text = selectWithNs('.//w:t', p).map(n => n.textContent).join('');
        if ((text.includes('GR CLASS REPRESENTATIVE') || text.includes('GR Class Representative')) &&
            !selectWithNs('.//w:sdt[w:sdtPr/w:tag[@w:val="surveyor_name"]]', p, true)) {
            while (p.firstChild) p.removeChild(p.firstChild);
            const pPr = doc.createElementNS(WORD_NS, 'w:pPr');
            const jc = doc.createElementNS(WORD_NS, 'w:jc');
            jc.setAttributeNS(WORD_NS, 'w:val', 'right');
            pPr.appendChild(jc);
            p.appendChild(pPr);
            p.appendChild(createInlineSdtNode(doc, 'surveyor_name', '{surveyor_name}'));
            const r = doc.createElementNS(WORD_NS, 'w:r');
            const t = doc.createElementNS(WORD_NS, 'w:t');
            t.appendChild(doc.createTextNode('GR CLASS REPRESENTATIVE'));
            r.appendChild(t);
            p.appendChild(r);
            modified++;
        }
    });

    if (modified > 0) {
        const newXml = new XMLSerializer().serializeToString(doc);
        zip.file('word/document.xml', newXml);
        const newBuffer = await zip.generateAsync({ type: 'nodebuffer' });
        fs.writeFileSync(filePath, newBuffer);
    }

    return modified > 0;
}

async function scanDocxTags(buffer) {
    try {
        const zip = await JSZip.loadAsync(buffer);
        const entry = zip.file('word/document.xml');
        if (!entry) return [];
        const xml = await entry.async('text');
        const doc = new DOMParser().parseFromString(xml, 'text/xml');
        const tagNodes = selectWithNs('//w:sdt/w:sdtPr/w:tag', doc);
        const tags = new Set();
        tagNodes.forEach(n => { const v = n.getAttribute('w:val'); if (v) tags.add(v); });
        return Array.from(tags);
    } catch {
        return [];
    }
}

function getFolders(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true })
        .filter(e => e.isDirectory() && !e.name.startsWith('.'))
        .map(e => e.name);
}

function findDocxRecursively(dir) {
    const results = [];
    function walk(current) {
        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
            const full = path.join(current, entry.name);
            if (entry.isDirectory()) { walk(full); continue; }
            if (entry.name.endsWith('.docx') && !entry.name.startsWith('~$')) results.push(full);
        }
    }
    walk(dir);
    return results;
}

async function uploadWithRetry(buffer, fileName, mimeType, folder, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await s3Service.uploadFile(buffer, fileName, mimeType, folder);
        } catch (err) {
            if (i === retries - 1) throw err;
            console.warn(`      ⚠️ Retry ${i + 1}/${retries}: ${err.message}`);
            await new Promise(r => setTimeout(r, 2000));
        }
    }
}

// ─── Build cert-type lookup maps ─────────────────────────────────────────────

async function buildTypeMaps() {
    const all = await db.CertificateType.findAll({ attributes: ['id', 'name', 'short_code'] });
    const byNorm = new Map();
    const byCode = new Map();
    for (const t of all) {
        const p = t.get({ plain: true });
        byNorm.set(normalize(p.name), p);
        if (p.short_code) byCode.set(normalize(p.short_code), p);
    }
    return { byNorm, byCode };
}

function resolveType(folderName, maps) {
    const norm = normalize(folderName);
    // Direct alias by raw folder name
    const alias = CERTIFICATE_TYPE_ALIASES[folderName] || CERTIFICATE_TYPE_ALIASES[norm];
    if (alias) {
        const normAlias = normalize(alias);
        return maps.byCode.get(normAlias) || maps.byNorm.get(normAlias) || null;
    }
    return maps.byNorm.get(norm) || maps.byCode.get(norm) || null;
}

// ─── Certificate template upsert ─────────────────────────────────────────────

async function upsertCertificateTemplates(maps) {
    const folders = getFolders(ONLY_CERTS_DIR);
    console.log(`\n📄 Certificate Templates — found ${folders.length} folders in ONLY CERTIFICATES/`);

    const stats = { matched: 0, skipped: 0, created: 0, deactivated: 0 };

    for (const folder of folders) {
        const certType = resolveType(folder, maps);
        if (!certType) {
            console.log(`   [SKIP] No DB match for folder: "${folder}"`);
            stats.skipped++;
            continue;
        }

        const folderPath = path.join(ONLY_CERTS_DIR, folder);
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.docx') && !f.startsWith('~$'));

        if (files.length === 0) {
            console.log(`   [SKIP] No .docx files in: "${folder}"`);
            stats.skipped++;
            continue;
        }

        console.log(`\n   📁 ${folder} → ${certType.name} (${certType.short_code})`);
        stats.matched++;

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const isST = /[-_ ](ST)[. _]|_ST\.|ST\.docx$/i.test(file) || file.toUpperCase().endsWith('-ST.DOCX') || file.includes(' - ST');
            const term = isST ? 'SHORT_TERM' : 'FULL_TERM';
            const templateName = `${certType.name} ${isST ? 'ST' : 'FT'}`;

            console.log(`      → ${file}  [${term}]`);

            if (DRY_RUN) {
                console.log(`         [DRY_RUN] Would deactivate old + create new CertificateTemplate`);
                continue;
            }

            // Tag docx in-place
            await tagDocxInPlace(filePath);

            const buffer = fs.readFileSync(filePath);
            const key = await uploadWithRetry(buffer, file, DOCX_MIME, 'templates/certificates');
            const variables = await scanDocxTags(buffer);

            // Deactivate existing active templates for this type + term
            const deactivated = await db.CertificateTemplate.update(
                { is_active: false },
                { where: { certificate_type_id: certType.id, certificate_term: term, is_active: true } }
            );
            stats.deactivated += deactivated[0];

            await db.CertificateTemplate.create({
                template_name: templateName,
                certificate_type_id: certType.id,
                certificate_term: term,
                template_content: `<!-- Legacy DOCX Template Fallback -->\n<p>Legacy template S3 Key: ${key}</p>`,
                variables,
                is_active: true,
            });
            stats.created++;
            console.log(`         ✅ Created template (S3 key: ${key})`);
        }
    }

    console.log(`\n📊 Certificate Templates Summary:`);
    console.log(`   Folders matched: ${stats.matched}`);
    console.log(`   Folders skipped: ${stats.skipped}`);
    console.log(`   Old templates deactivated: ${stats.deactivated}`);
    console.log(`   New templates created: ${stats.created}`);
    return stats;
}

// ─── Checklist template upsert ────────────────────────────────────────────────

async function upsertChecklistTemplates(maps) {
    const folders = getFolders(CHECKLISTS_DIR);
    console.log(`\n🗒️  Checklist Templates — found ${folders.length} folders in CHECKLISTS/`);

    const stats = { matched: 0, skipped: 0, created: 0, updated: 0 };

    // Check if LibreOffice is available for .doc → .docx conversion
    let hasSoffice = false;
    try {
        execSync('/opt/homebrew/bin/soffice --version', { stdio: 'ignore' });
        hasSoffice = true;
    } catch {
        try {
            execSync('soffice --version', { stdio: 'ignore' });
            hasSoffice = true;
        } catch {
            console.warn('   ⚠️ LibreOffice (soffice) not found — skipping .doc → .docx conversion');
        }
    }

    for (const folder of folders) {
        const certType = resolveType(folder, maps);
        if (!certType) {
            console.log(`   [SKIP] No DB match for folder: "${folder}"`);
            stats.skipped++;
            continue;
        }

        const folderPath = path.join(CHECKLISTS_DIR, folder);

        // Convert .doc → .docx if LibreOffice is available
        if (hasSoffice) {
            const docFiles = findDocxRecursively(folderPath)
                .filter(f => f.endsWith('.doc') && !f.endsWith('.docx'));
            for (const docFile of docFiles) {
                try {
                    execSync(`/opt/homebrew/bin/soffice --headless --convert-to docx --outdir "${path.dirname(docFile)}" "${docFile}"`, { stdio: 'ignore' });
                    fs.unlinkSync(docFile);
                    console.log(`   - Converted: ${path.basename(docFile)}`);
                } catch (err) {
                    console.error(`   - Conversion failed: ${docFile}: ${err.message}`);
                }
            }
        }

        const docxFiles = findDocxRecursively(folderPath);
        if (docxFiles.length === 0) {
            console.log(`   [SKIP] No .docx files in: "${folder}"`);
            stats.skipped++;
            continue;
        }

        console.log(`\n   📁 ${folder} → ${certType.name} (${certType.short_code})`);
        stats.matched++;

        if (DRY_RUN) {
            console.log(`      [DRY_RUN] Would upsert ChecklistTemplate with ${docxFiles.length} file(s)`);
            continue;
        }

        // Upload all files
        const s3Keys = [];
        for (const docxFile of docxFiles) {
            await tagDocxInPlace(docxFile);
            const buffer = fs.readFileSync(docxFile);
            const fileName = path.basename(docxFile);
            const key = await uploadWithRetry(buffer, fileName, DOCX_MIME, `checklist-templates/${certType.id}`);
            s3Keys.push({ key, fileName });
            console.log(`      ↑ Uploaded: ${fileName}`);
        }

        const code = `AUTO-${certType.short_code || certType.id}`;

        // Find or create the ChecklistTemplate
        let template = await db.ChecklistTemplate.findOne({ where: { code } });

        if (!template) {
            template = await db.ChecklistTemplate.create({
                name: `${certType.name} Checklist`,
                code,
                description: `Imported checklist template for ${certType.name}`,
                certificate_type_id: certType.id,
                sections: [
                    {
                        title: 'General Verification Items',
                        items: [{ code: 'GEN_01', text: 'Are all required parameters verified?', type: 'yes_no_na' }],
                    },
                ],
                status: 'ACTIVE',
                template_files: s3Keys.map(f => f.key),
                metadata: { version: '1.0', source: 'upsert-script' },
            });
            console.log(`      ✅ Created ChecklistTemplate (code: ${code})`);
            stats.created++;
        } else {
            // Replace template_files
            await template.update({
                template_files: s3Keys.map(f => f.key),
                certificate_type_id: certType.id, // ensure linked
                status: template.status === 'INACTIVE' ? 'ACTIVE' : template.status,
                metadata: { ...(template.metadata || {}), source: 'upsert-script', last_updated: new Date().toISOString() },
            });
            console.log(`      ♻️  Updated ChecklistTemplate (code: ${code})`);
            stats.updated++;
        }

        // Replace ChecklistTemplateFile rows
        await db.ChecklistTemplateFile.destroy({ where: { checklist_template_id: template.id } });
        for (let i = 0; i < s3Keys.length; i++) {
            const { key, fileName } = s3Keys[i];
            const cleanName = fileName.replace(/^\d+_/, '');
            await db.ChecklistTemplateFile.create({
                checklist_template_id: template.id,
                name: cleanName,
                file_key: key,
                display_order: i,
                is_mandatory: true,
            });
        }
        console.log(`      📎 ${s3Keys.length} ChecklistTemplateFile row(s) replaced`);
    }

    console.log(`\n📊 Checklist Templates Summary:`);
    console.log(`   Folders matched: ${stats.matched}`);
    console.log(`   Folders skipped: ${stats.skipped}`);
    console.log(`   New templates created: ${stats.created}`);
    console.log(`   Existing templates updated: ${stats.updated}`);
    return stats;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const main = async () => {
    if (DRY_RUN) console.log('\n🔍 DRY RUN mode — no DB or S3 changes will be made\n');
    else console.log('\n🚀 Starting upsert of certificate & checklist templates…\n');

    const maps = await buildTypeMaps();
    console.log(`   DB has ${maps.byNorm.size} certificate types loaded`);

    if (!CHECK_ONLY) await upsertCertificateTemplates(maps);
    if (!CERT_ONLY)  await upsertChecklistTemplates(maps);

    console.log('\n✅ Done!\n');
};

main()
    .catch(console.error)
    .finally(async () => { await db.sequelize.close().catch(() => {}); });
