import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './src/models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CERTIFICATES_DIR = path.join(__dirname, 'ONLY CERTIFICATES');

async function run() {
    try {
        console.log('Connecting to database...');
        await db.sequelize.authenticate();
        console.log('Connected to DB.');

        const certDirs = fs.readdirSync(CERTIFICATES_DIR, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        for (const dirName of certDirs) {
            console.log(`\nProcessing: ${dirName}`);

            // Skip hidden directories or files if any
            if (dirName.startsWith('.')) continue;

            // Upsert CertificateType
            let certType = await db.CertificateType.findOne({
                where: { name: dirName }
            });

            if (!certType) {
                console.log(`  Creating CertificateType: ${dirName}`);
                certType = await db.CertificateType.create({
                    name: dirName,
                    issuing_authority: 'CLASS',
                    validity_years: 5, // Default 5
                    status: 'ACTIVE',
                    description: `Auto-imported from ONLY CERTIFICATES`,
                    requires_survey: true,
                    requires_survey_short_term: false,
                    requires_survey_full_term: true,
                });
            } else {
                console.log(`  CertificateType already exists: ${dirName}`);
            }

            // Check for HTML templates
            const htmlDir = path.join(CERTIFICATES_DIR, dirName, 'html');
            if (fs.existsSync(htmlDir)) {
                const htmlFiles = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html'));
                
                for (const htmlFile of htmlFiles) {
                    const filePath = path.join(htmlDir, htmlFile);
                    const content = fs.readFileSync(filePath, 'utf-8');

                    // Determine term from filename
                    let term = null; // null = supplementary document (no specific term)
                    const upperFile = htmlFile.toUpperCase();
                    if (upperFile.includes('_FT_')) term = 'FULL_TERM';
                    else if (upperFile.includes('_ST_')) term = 'SHORT_TERM';
                    else if (upperFile.includes('_INT_') || upperFile.includes('_IN_') || upperFile.includes('INTERIM')) term = 'INTERIM';
                    else if (upperFile.includes('_COND_') || upperFile.includes('_CD_') || upperFile.includes('CONDITIONAL')) term = 'CONDITIONAL';
                    else if (upperFile.includes('_PROV_') || upperFile.includes('_PR_') || upperFile.includes('PROVISIONAL')) term = 'PROVISIONAL';

                    // Check if template exists
                    // For term-based templates: match by (certificate_type_id, certificate_term)
                    // For supplementary docs (null term): match by (certificate_type_id, template_name)
                    let template;
                    if (term) {
                        template = await db.CertificateTemplate.findOne({
                            where: {
                                certificate_type_id: certType.id,
                                certificate_term: term
                            }
                        });
                    } else {
                        template = await db.CertificateTemplate.findOne({
                            where: {
                                certificate_type_id: certType.id,
                                template_name: htmlFile
                            }
                        });
                    }

                    if (!template) {
                        console.log(`    Creating template: ${term || 'SUPPLEMENT'} (${htmlFile})`);
                        await db.CertificateTemplate.create({
                            certificate_type_id: certType.id,
                            template_name: htmlFile,
                            certificate_term: term,
                            template_content: content,
                            is_active: true
                        });
                    } else {
                        console.log(`    Template already exists: ${term || 'SUPPLEMENT'} (updating content)`);
                        template.template_content = content;
                        await template.save();
                    }
                }
            } else {
                console.log(`  No html directory found for ${dirName}`);
            }
        }

        console.log('\nSeed completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding certificates:', err);
        process.exit(1);
    }
}

run();
