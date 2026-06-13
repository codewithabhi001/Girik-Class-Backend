import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import db from '../src/models/index.js';
import * as s3Service from '../src/services/s3.service.js';

const PROJECT_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SOURCE_DIR = path.join(PROJECT_ROOT, 'ONLY CERTIFICATES');

const IGNORE_NAMES = new Set(['.DS_Store', 'Thumbs.db']);

const normalize = (value) =>
  String(value || '')
    .normalize('NFKD')
    .replace(/[-_]/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '') // Remove all spaces for strict comparison
    .trim()
    .toUpperCase();

const deriveShortCode = (folderName) => {
    const normalized = normalize(folderName);
    // Logic from sync_certificate_types_from_folders.js
    if (/^[A-Z0-9]{2,10}$/.test(normalized)) return normalized.slice(0, 10);
    const words = normalized.split(' ').filter(Boolean);
    const initials = words.map((w) => w[0]).join('');
    if (initials.length >= 2) return initials.slice(0, 10);
    return normalized.slice(0, 10) || 'CERT';
};

const main = async () => {
    if (!fs.existsSync(SOURCE_DIR)) {
        console.error(`Source directory not found: ${SOURCE_DIR}`);
        return;
    }

    const folders = fs.readdirSync(SOURCE_DIR, { withFileTypes: true })
        .filter(e => e.isDirectory() && !IGNORE_NAMES.has(e.name))
        .map(e => e.name);

    const dbTypes = await db.CertificateType.findAll();
    const normalizedDbTypes = dbTypes.map(t => ({
        id: t.id,
        name: t.name,
        normalizedName: normalize(t.name),
        short_code: t.short_code
    }));

    for (const folderName of folders) {
        console.log(`\nProcessing folder: ${folderName}`);
        const folderPath = path.join(SOURCE_DIR, folderName);
        const normalizedFolderName = normalize(folderName);
        const short_code = deriveShortCode(folderName);

        let certType = normalizedDbTypes.find(t => t.normalizedName === normalizedFolderName);
        if (!certType) {
            certType = normalizedDbTypes.find(t => t.short_code === short_code);
        }
        if (!certType) {
            // Try partial match
            certType = normalizedDbTypes.find(t => t.normalizedName.includes(normalizedFolderName) || normalizedFolderName.includes(t.normalizedName));
        }

        if (!certType) {
            console.warn(`  [SKIP] No CertificateType found for "${folderName}" (code: ${short_code})`);
            continue;
        }

        console.log(`  Matched to: ${certType.name} (${certType.id})`);

        const files = fs.readdirSync(folderPath)
            .filter(f => f.endsWith('.docx') && !f.startsWith('~$'));

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const isST = file.includes('-ST') || file.includes(' - ST') || file.includes('_ST') || file.includes('ST.docx') || file.includes('ST ');
            const term = isST ? 'SHORT_TERM' : 'FULL_TERM';
            
            console.log(`  Uploading ${file} (Term: ${term})...`);
            
            try {
                const buffer = fs.readFileSync(filePath);
                const s3Key = await s3Service.uploadFile(
                    buffer,
                    file,
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'templates/certificates'
                );

                // Upsert CertificateTemplate
                const template_name = `${certType.name} ${term === 'SHORT_TERM' ? 'ST' : 'FT'}`;
                
                await db.CertificateTemplate.upsert({
                    template_name,
                    certificate_type_id: certType.id,
                    certificate_term: term,
                    template_file_url: s3Key,
                    is_active: true
                });

                console.log(`  [OK] Template created/updated: ${template_name}`);
            } catch (err) {
                console.error(`  [ERROR] Failed to process ${file}:`, err.message);
            }
        }
    }
};

main()
    .catch(console.error)
    .finally(async () => {
        await db.sequelize.close().catch(() => {});
    });
