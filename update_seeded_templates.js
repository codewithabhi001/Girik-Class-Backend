import fs from 'fs';
import path from 'path';
import db from './src/models/index.js';

const CERTIFICATES_DIR = path.join(process.cwd(), 'ONLY CERTIFICATES');

const NEW_TEMPLATES = [
    {
        certTypeDirName: 'ANTI FOULING SYSTEM CERTIFICATE',
        htmlFile: 'GRClass_AFS_RA_SoC_Record.html',
    },
    {
        certTypeDirName: 'International Ship Security Certificate',
        htmlFile: 'GRClass_ISSC_APR_SSPA_Approval.html',
    },
    {
        certTypeDirName: 'CARGO SHIP SAFETY EQUIPMENT CERTIFICATE',
        htmlFile: 'GRClass_CSSE_Form_E.html',
    },
    {
        certTypeDirName: 'CARGO SHIP SAFETY RADIO CERTIFICATE',
        htmlFile: 'GRClass_CSSR_Form_R.html',
    },
    {
        certTypeDirName: 'International Air Pollution Prevention Certificate',
        htmlFile: 'GRClass_IAPP_R_SoC_Supplement.html',
    },
    {
        certTypeDirName: 'International Energy Efficiency Certificate',
        htmlFile: 'GRClass_IEE_Supplement.html',
    },
    {
        certTypeDirName: 'Certificate of Compliance with the International Maritime Solid Bulk Cargoes (IMSBC) CODE',
        htmlFile: 'GRClass_IMSBC_IC_Approved_Cargoes.html',
    },
    {
        certTypeDirName: 'INTERNATIONAL OIL POLLUTION PREVENTION CERTIFICATE',
        htmlFile: 'GRClass_IOPP_Form_A.html',
    },
    {
        certTypeDirName: 'International Load Line Certificate',
        htmlFile: 'GRClass_LL_RA_Conditions_C11.html',
    },
    {
        certTypeDirName: 'Ship Oil Pollution Emergency Plan',
        htmlFile: 'GRClass_SOPEP_R_Approved_Plan.html',
    },
    {
        certTypeDirName: 'Survey Statement',
        htmlFile: 'GRClass_Survey_Statement.html',
    },
];

async function updateDB() {
    try {
        console.log('Connecting to database...');
        await db.sequelize.authenticate();
        console.log('Connected.');

        let updated = 0;
        let failed = 0;

        for (const entry of NEW_TEMPLATES) {
            const htmlPath = path.join(CERTIFICATES_DIR, entry.certTypeDirName, 'html', entry.htmlFile);
            if (!fs.existsSync(htmlPath)) {
                console.log(`[FAIL] File not found: ${htmlPath}`);
                failed++;
                continue;
            }

            const content = fs.readFileSync(htmlPath, 'utf8');

            const template = await db.CertificateTemplate.findOne({
                where: { template_name: entry.htmlFile }
            });

            if (template) {
                await template.update({ template_content: content });
                console.log(`[SUCCESS] Updated DB for: ${entry.htmlFile}`);
                updated++;
            } else {
                console.log(`[FAIL] Template not found in DB: ${entry.htmlFile}`);
                failed++;
            }
        }

        console.log(`\nFinished updating templates: ${updated} updated, ${failed} failed.`);
    } catch (error) {
        console.error('Error updating DB:', error);
    } finally {
        process.exit();
    }
}

updateDB();
