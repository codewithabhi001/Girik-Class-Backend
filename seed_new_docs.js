/**
 * seed_new_docs.js
 * 
 * Seeds ONLY the 11 new supplementary document templates into the database.
 * Does NOT touch any existing CertificateType or CertificateTemplate records.
 * 
 * For new cert types (SOPEP, Survey Statement) — creates the CertificateType only if it doesn't exist.
 * For existing cert types — finds them by name and adds the new template alongside existing ones.
 * 
 * All new templates are stored with certificate_term = null (supplementary documents).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './src/models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CERTIFICATES_DIR = path.join(__dirname, 'ONLY CERTIFICATES');

// Only the 11 new templates — mapped to their certificate type directory and HTML file
const NEW_TEMPLATES = [
    {
        certTypeDirName: 'ANTI FOULING SYSTEM CERTIFICATE',
        dbName: 'Anti-fouling System Certificate',
        htmlFile: 'GRClass_AFS_RA_SoC_Record.html',
        description: 'Record of Anti-Fouling Systems (SoC)',
    },
    {
        certTypeDirName: 'International Ship Security Certificate',
        htmlFile: 'GRClass_ISSC_APR_SSPA_Approval.html',
        description: 'Approved Ship Security Plan Approval Letter',
    },
    {
        certTypeDirName: 'CARGO SHIP SAFETY EQUIPMENT CERTIFICATE',
        htmlFile: 'GRClass_CSSE_Form_E.html',
        description: 'Cargo Ship Safety Equipment Certificate - Form E',
    },
    {
        certTypeDirName: 'CARGO SHIP SAFETY RADIO CERTIFICATE',
        htmlFile: 'GRClass_CSSR_Form_R.html',
        description: 'Cargo Ship Safety Radio Certificate - Form R',
    },
    {
        certTypeDirName: 'International Air Pollution Prevention Certificate',
        htmlFile: 'GRClass_IAPP_R_SoC_Supplement.html',
        description: 'IAPP Supplement Record of Construction and Equipment',
    },
    {
        certTypeDirName: 'International Energy Efficiency Certificate',
        dbName: 'International Energy Efficiency (iee) Certificate',
        htmlFile: 'GRClass_IEE_Supplement.html',
        description: 'International Energy Efficiency Certificate Supplement',
    },
    {
        certTypeDirName: 'Certificate of Compliance with the International Maritime Solid Bulk Cargoes (IMSBC) CODE',
        htmlFile: 'GRClass_IMSBC_IC_Approved_Cargoes.html',
        description: 'IMSBC Approved Cargoes List',
    },
    {
        certTypeDirName: 'INTERNATIONAL OIL POLLUTION PREVENTION CERTIFICATE',
        htmlFile: 'GRClass_IOPP_Form_A.html',
        description: 'IOPP Certificate - Form A',
    },
    {
        certTypeDirName: 'International Load Line Certificate',
        htmlFile: 'GRClass_LL_RA_Conditions_C11.html',
        description: 'Conditions of Assignment of Load Lines - C11',
    },
    {
        certTypeDirName: 'Ship Oil Pollution Emergency Plan',
        htmlFile: 'GRClass_SOPEP_R_Approved_Plan.html',
        description: 'SOPEP Approved Plan',
        isNewCertType: true, // This cert type may not exist yet
    },
    {
        certTypeDirName: 'Survey Statement',
        htmlFile: 'GRClass_Survey_Statement.html',
        description: 'Survey Statement Template',
        isNewCertType: true, // This cert type may not exist yet
    },
];

async function run() {
    try {
        console.log('=== Seed New Document Templates ONLY ===\n');
        console.log('Connecting to database...');
        await db.sequelize.authenticate();
        console.log('Connected to DB.\n');

        let created = 0;
        let skipped = 0;
        let failed = 0;

        for (const entry of NEW_TEMPLATES) {
            console.log(`Processing: ${entry.htmlFile}`);
            console.log(`  Certificate Type: ${entry.certTypeDirName}`);

            // 1. Find or create the CertificateType
            let certType = await db.CertificateType.findOne({
                where: { name: entry.dbName || entry.certTypeDirName }
            });

            if (!certType) {
                if (entry.isNewCertType) {
                    console.log(`  Creating NEW CertificateType: ${entry.dbName || entry.certTypeDirName}`);
                    certType = await db.CertificateType.create({
                        name: entry.dbName || entry.certTypeDirName,
                        issuing_authority: 'CLASS',
                        validity_years: 5,
                        status: 'ACTIVE',
                        description: entry.description,
                        requires_survey: true,
                        requires_survey_short_term: false,
                        requires_survey_full_term: true,
                    });
                } else {
                    console.log(`  ✗ CertificateType NOT FOUND: ${entry.dbName || entry.certTypeDirName}`);
                    console.log(`    Skipping — this cert type should already exist in DB.\n`);
                    failed++;
                    continue;
                }
            } else {
                console.log(`  ✓ CertificateType found (id: ${certType.id})`);
            }

            // 2. Check if this template already exists (by template_name)
            const existing = await db.CertificateTemplate.findOne({
                where: {
                    certificate_type_id: certType.id,
                    template_name: entry.htmlFile
                }
            });

            if (existing) {
                console.log(`  ⏭ Template already exists in DB — SKIPPING (not updating)\n`);
                skipped++;
                continue;
            }

            // 3. Read the HTML file
            const htmlPath = path.join(CERTIFICATES_DIR, entry.certTypeDirName, 'html', entry.htmlFile);
            if (!fs.existsSync(htmlPath)) {
                console.log(`  ✗ HTML file not found: ${htmlPath}\n`);
                failed++;
                continue;
            }

            const content = fs.readFileSync(htmlPath, 'utf-8');

            // 4. Create the template with null term (supplementary document)
            await db.CertificateTemplate.create({
                certificate_type_id: certType.id,
                template_name: entry.htmlFile,
                certificate_term: null, // supplementary — not tied to a specific term
                template_content: content,
                is_active: true
            });

            console.log(`  ✓ Template CREATED successfully\n`);
            created++;
        }

        console.log(`\n=== Seed Summary ===`);
        console.log(`Created: ${created}`);
        console.log(`Skipped (already exists): ${skipped}`);
        console.log(`Failed: ${failed}`);
        console.log(`Total: ${NEW_TEMPLATES.length}`);
        console.log(`\n✅ Existing templates were NOT touched.`);

        process.exit(0);
    } catch (err) {
        console.error('\n✗ Error seeding new templates:', err);
        process.exit(1);
    }
}

run();
