import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import xpath from 'xpath';

const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const selectWithNs = xpath.useNamespaces({ w: WORD_NS });

const HEADER_TAG_RULES = [
    { keys: ['name of ship', 'name of vessel', 'nombredelanave', 'vesselname', 'nombre de la nave', 'name of ship / nombre de la nave', 'name of ship / nombre de la nave'], tag: 'vessel_name' },
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
    const zip = await JSZip.loadAsync(buffer);
    const entry = zip.file('word/document.xml');
    if (!entry) {
        console.warn(`  [SKIP] Not a valid DOCX file: ${path.basename(filePath)}`);
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

                // Skip cells that already contain a tag to prevent cascading tags down columns
                if (text.includes('{') || text.includes('}')) return;

                const matchedTag = findTagForHeader(text);
                if (matchedTag) {
                    // Check row below
                    const nextRow = rows[rowIdx + 1];
                    if (nextRow) {
                        const nextCells = selectWithNs('w:tc', nextRow);
                        const targetCell = nextCells[colIdx];
                        if (targetCell) {
                            const targetText = selectWithNs('.//w:t', targetCell).map(n => n.textContent).join('').trim();
                            // Check if empty or standard placeholder
                            const isPlaceholder = targetText === '' || targetText === '-' || targetText.includes('DD-MM-YYYY') || targetText.includes('Place of issue') || targetText.includes('Place of Issue');
                            if (isPlaceholder) {
                                // Clear cell children
                                while (targetCell.firstChild) {
                                    targetCell.removeChild(targetCell.firstChild);
                                }
                                // Add Content Control
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
        console.log(`  [OK] Tagged ${tableTaggedCount} cells and ${pTaggedCount} elements in ${path.basename(filePath)}`);
        const newXml = new XMLSerializer().serializeToString(doc);
        zip.file('word/document.xml', newXml);
        const newBuffer = await zip.generateAsync({ type: 'nodebuffer' });
        fs.writeFileSync(filePath, newBuffer);
        return true;
    }

    return false;
}

async function main() {
    const PROJECT_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
    const SOURCE_DIR = path.join(PROJECT_ROOT, 'ONLY CERTIFICATES');

    if (!fs.existsSync(SOURCE_DIR)) {
        console.error(`Source directory not found: ${SOURCE_DIR}`);
        return;
    }

    const folders = fs.readdirSync(SOURCE_DIR, { withFileTypes: true })
        .filter(e => e.isDirectory() && e.name !== '.DS_Store')
        .map(e => e.name);

    let totalTaggedFiles = 0;

    for (const folder of folders) {
        const folderPath = path.join(SOURCE_DIR, folder);
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.docx') && !f.startsWith('~$'));
        
        for (const file of files) {
            const filePath = path.join(folderPath, file);
            try {
                const wasTagged = await tagSingleDocx(filePath);
                if (wasTagged) totalTaggedFiles++;
            } catch (err) {
                console.error(`  [ERROR] Failed to tag ${folder}/${file}:`, err.message);
            }
        }
    }

    console.log(`\nAuto-tagging completed. Successfully updated ${totalTaggedFiles} template files.`);
}

main().catch(console.error);
