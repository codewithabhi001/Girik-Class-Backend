
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import ExcelJS from 'exceljs';
import db from '../src/models/index.js';
import * as s3Service from '../src/services/s3.service.js';

const PROJECT_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

// Specific paths requested by user
const ONLY_CERTIFICATES_ROOT = path.join(PROJECT_ROOT, 'ONLY CERTIFICATES');
const CHECKLIST_ROOT = path.join(PROJECT_ROOT, 'CHECKLISTS');
const DOCS_REQUIRED_XLSX = path.join(PROJECT_ROOT, 'DOCUMENTS REQUIRED.xlsx');

const ADMIN_EMAIL = process.env.IMPORT_ADMIN_EMAIL || 'admin@grclass.com';
const ADMIN_PASSWORD = process.env.IMPORT_ADMIN_PASSWORD || 'Password@123';
const ADMIN_NAME = process.env.IMPORT_ADMIN_NAME || 'System Admin';

const CERTIFICATE_DOC_TYPE = 'CERTIFICATE_TYPE_TEMPLATE';
const CHECKLIST_TEMPLATE_PREFIX = 'AUTO-FILES';
const IGNORE_NAMES = new Set(['.DS_Store', 'Thumbs.db', 'LIST.xlsx', '~$CHECK LIST.xlsx']);

const CERTIFICATE_TYPE_ALIASES = {
    AFS: 'AFS',
    'ANTI FOULING SYSTEM CERTIFICATE': 'AFS',
    'ANTI-FOULING SYSTEM CERTIFICATE': 'AFS',
    'BALLAST WATER MANAGEMENT CERTIFICATE': 'BWM',
    'BOTTOM INSPECTION': 'BOTTOM INSPECTION',
    'CARGO SHIP SAFETY CERTIFICATE': 'CSSC',
    'CARGO SHIP SAFETY CONSTRUCTION CERTIFICATE': 'CSSCC',
    'CARGO SHIP SAFETY EQUIPMENT CERTIFICATE': 'CSSEC',
    'CARGO SHIP SAFETY RADIO CERTIFICATE': 'CSSRC',
    'CARGO SHIP SAFETY RADIOTELEPHONY CERTIFICATE': 'CSSRTC',
    'CARIBBEAN CARGO SHIP SAFETY CERTIFICATE': 'CCSSC',
    CICA: 'CICA',
    DOC: 'DOC',
    'DOCKING SURVEY': 'DOCKING SURVEY',
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
};

const TABLES_TO_TRUNCATE = [
  'job_status_histories', 'job_reschedules', 'job_notes', 'job_documents', 'job_requests', 'jobs',
  'survey_status_histories', 'surveys',
  'certificate_history', 'certificates', 'certificate_templates',
  'payments', 'approvals', 'financial_ledgers',
  'activity_requests', 'activity_plannings', 'gps_tracking', 'non_conformities', 'incidents', 'change_requests',
  'messages', 'notifications',
  'checklist_templates', 'documents', 'certificate_required_documents', 'certificate_types'
];

const normalize = (value) =>
    String(value || '')
        .normalize('NFKD')
        .replace(/[^\w\s]/g, '')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();

const getMimeType = (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (ext === '.doc') return 'application/msword';
    if (ext === '.pdf') return 'application/pdf';
    if (ext === '.xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    return 'application/octet-stream';
};

const listFolders = (rootDir) => {
    if (!fs.existsSync(rootDir)) return [];
    return fs.readdirSync(rootDir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .filter((name) => !IGNORE_NAMES.has(name));
};

async function truncateTables() {
    console.log('🗑️  Truncating tables...');
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of TABLES_TO_TRUNCATE) {
        try {
            await db.sequelize.query(`TRUNCATE TABLE \`${table}\``);
            console.log(`   truncated: ${table}`);
        } catch (err) {
            console.warn(`   skipped ${table}: ${err.message}`);
        }
    }
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
}

async function ensureAdminUser() {
    let admin = await db.User.findOne({ where: { email: ADMIN_EMAIL } });
    if (admin) return admin;

    const password_hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    admin = await db.User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password_hash,
        role: 'ADMIN',
        status: 'ACTIVE',
    });
    return admin;
}

const deriveShortCode = (name) => {
    const raw = String(name).trim();
    if (CERTIFICATE_TYPE_ALIASES[raw]) return CERTIFICATE_TYPE_ALIASES[raw];
    
    const normalized = normalize(raw);
    if (CERTIFICATE_TYPE_ALIASES[normalized]) return CERTIFICATE_TYPE_ALIASES[normalized];

    const words = normalized.split(' ').filter(Boolean);
    return words.length >= 2 ? words.map(w => w[0]).join('').slice(0, 10) : normalized.slice(0, 10);
};

async function syncCertificateTypes() {
    console.log(`📄 Syncing Certificate Types from: ${ONLY_CERTIFICATES_ROOT}`);
    const folders = listFolders(ONLY_CERTIFICATES_ROOT);
    let created = 0;

    for (const folderName of folders) {
        const name = folderName.trim();
        const short_code = deriveShortCode(name);

        await db.CertificateType.create({
            name,
            short_code,
            issuing_authority: 'CLASS',
            status: 'ACTIVE',
            description: `Auto-created from folder: ${name}`,
            requires_survey: true,
        });
        created++;
    }
    console.log(`   Created ${created} Certificate Types.`);
}

async function syncRequiredDocumentsFixed() {
    console.log(`📄 Syncing Required Documents from: ${DOCS_REQUIRED_XLSX}`);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(DOCS_REQUIRED_XLSX);
    const worksheet = workbook.getWorksheet(1);
    
    const certificateTypes = await db.CertificateType.findAll();
    const typeMap = new Map();
    const codeMap = new Map();
    certificateTypes.forEach(t => {
        if (t.name) typeMap.set(normalize(t.name), t);
        if (t.short_code) codeMap.set(t.short_code.toUpperCase(), t);
    });

    let created = 0;
    const rows = [];
    worksheet.eachRow((row, rowNumber) => { if(rowNumber > 1) rows.push(row.values); });

    for (const v of rows) {
        const certName = String(v[2] || '').trim();
        const shortCode = String(v[3] || '').trim();
        const docName = String(v[4] || '').trim();
        if (!docName) continue;

        let certType = codeMap.get(shortCode.toUpperCase()) || typeMap.get(normalize(certName));
        if (!certType) {
            certType = await db.CertificateType.create({
                name: certName, short_code: shortCode, issuing_authority: 'CLASS', status: 'ACTIVE', requires_survey: true
            });
            typeMap.set(normalize(certName), certType);
            codeMap.set(shortCode.toUpperCase(), certType);
        }
        
        // Use findOrCreate for req docs to avoid duplicates if same type+doc appears
        await db.CertificateRequiredDocument.findOrCreate({
            where: {
                certificate_type_id: certType.id,
                document_name: docName
            },
            defaults: { is_mandatory: true }
        });
        created++;
    }
    console.log(`   Synced ${created} Required Documents entries.`);
}

async function importAssets(adminId) {
    console.log('📦 Importing Assets (Checklists & Templates)...');
    const certificateTypes = await db.CertificateType.findAll();
    const typeMap = new Map();
    certificateTypes.forEach(t => typeMap.set(normalize(t.name), t));

    const walk = (dir) => {
        let results = [];
        if (!fs.existsSync(dir)) return results;
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            file = path.join(dir, file);
            const stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                results = results.concat(walk(file));
            } else {
                if (!IGNORE_NAMES.has(path.basename(file))) results.push(file);
            }
        });
        return results;
    };

    // 1. Process Checklists
    const checklistFolders = listFolders(CHECKLIST_ROOT);
    let checklistsImported = 0;
    const usedCodes = new Set();

    for (const folder of checklistFolders) {
        const type = typeMap.get(normalize(folder));
        if (!type) continue;

        const files = walk(path.join(CHECKLIST_ROOT, folder));
        if (files.length === 0) continue;

        const s3Keys = [];
        const metadataFiles = [];

        for (const f of files) {
            const buffer = fs.readFileSync(f);
            const fileName = path.basename(f);
            try {
                const key = await s3Service.uploadFile(buffer, fileName, getMimeType(f), `checklist-templates/${type.short_code || type.id}`);
                s3Keys.push(key);
                metadataFiles.push({ fileName, relativePath: path.relative(path.join(CHECKLIST_ROOT, folder), f), key });
            } catch (err) {
                console.error(`      Failed to upload checklist file ${fileName}: ${err.message}`);
            }
        }

        let baseCode = `${CHECKLIST_TEMPLATE_PREFIX}-${type.short_code || type.id}`;
        let code = baseCode;
        let counter = 1;
        while(usedCodes.has(code)) {
            code = `${baseCode}-${counter++}`;
        }
        usedCodes.add(code);

        await db.ChecklistTemplate.create({
            name: `${type.name} Checklist`,
            code: code,
            certificate_type_id: type.id,
            status: 'ACTIVE',
            template_files: s3Keys,
            metadata: { imported_checklist_files: metadataFiles },
            created_by: adminId,
            updated_by: adminId
        });
        checklistsImported++;
    }
    console.log(`   Imported ${checklistsImported} Checklist Templates.`);

    // 2. Process Certificate Templates (Documents)
    const certFolders = listFolders(ONLY_CERTIFICATES_ROOT);
    let templatesImported = 0;
    for (const folder of certFolders) {
        const type = typeMap.get(normalize(folder));
        if (!type) continue;

        const files = walk(path.join(ONLY_CERTIFICATES_ROOT, folder));
        for (const f of files) {
            const buffer = fs.readFileSync(f);
            const fileName = path.basename(f);
            try {
                const key = await s3Service.uploadFile(buffer, fileName, getMimeType(f), `documents/certificate-types/${type.short_code || type.id}/templates`);
                
                await db.Document.create({
                    entity_type: 'CERTIFICATE_TYPE',
                    entity_id: type.id,
                    file_url: key,
                    file_type: getMimeType(f),
                    document_type: CERTIFICATE_DOC_TYPE,
                    description: path.relative(path.join(ONLY_CERTIFICATES_ROOT, folder), f),
                    uploaded_by: adminId,
                });
                templatesImported++;
            } catch (err) {
                console.error(`      Failed to upload template file ${fileName}: ${err.message}`);
            }
        }
    }
    console.log(`   Imported ${templatesImported} Certificate Template Documents.`);
}

async function main() {
    try {
        await truncateTables();
        const admin = await ensureAdminUser();
        await syncCertificateTypes();
        await syncRequiredDocumentsFixed();
        await importAssets(admin.id);
        console.log('\n✨ COMPLETE RE-INITIALIZATION SUCCESSFUL.');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ FAILED:', err);
        process.exit(1);
    }
}

main();
