import db from './src/models/index.js';
import fs from 'fs';
import path from 'path';

async function seedSurveyStatusReportTemplate() {
    try {
        console.log('Connecting to database...');
        await db.sequelize.authenticate();
        console.log('Database connected.');

        const reportTypeName = 'Class & Statutory Survey Status Report';

        // 1. Find or create CertificateType for Survey Status Report
        let certType = await db.CertificateType.findOne({
            where: { name: reportTypeName }
        });

        if (!certType) {
            console.log(`Creating CertificateType: ${reportTypeName}...`);
            certType = await db.CertificateType.create({
                name: reportTypeName,
                issuing_authority: 'GR CLASS',
                validity_years: 1,
                status: 'ACTIVE',
                description: 'Class & Statutory Survey Status Report template for vessels and jobs',
                requires_survey: false,
            });
        } else {
            console.log(`CertificateType already exists: ${reportTypeName}`);
        }

        // 2. Read HTML template content from ONLY CERTIFICATES folder
        const htmlPath = path.resolve('ONLY CERTIFICATES/Class and Statutory Survey Status Report/html/Survey_Status_Report.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

        // 3. Upsert into CertificateTemplate
        const existingTemplate = await db.CertificateTemplate.findOne({
            where: { certificate_type_id: certType.id }
        });

        if (existingTemplate) {
            console.log('Updating existing CertificateTemplate in DB...');
            await existingTemplate.update({
                template_name: 'Class & Statutory Survey Status Report',
                template_content: htmlContent,
                is_active: true
            });
        } else {
            console.log('Creating new CertificateTemplate in DB...');
            await db.CertificateTemplate.create({
                certificate_type_id: certType.id,
                template_name: 'Class & Statutory Survey Status Report',
                template_content: htmlContent,
                variables: [
                    'vessel_name', 'imo_number', 'class_number', 'call_sign', 'flag_state',
                    'port_of_registry', 'vessel_type', 'keel_date', 'build_date', 'entry_date',
                    'gross_tonnage', 'net_tonnage', 'deadweight', 'length_overall', 'breadth', 'depth',
                    'radio_area', 'registered_owner', 'owner_address', 'management_company', 'management_address',
                    'class_status', 'class_notation', 'class_certificates_rows', 'statutory_certificates_rows',
                    'plan_approval_rows', 'classification_surveys_rows', 'statutory_surveys_rows',
                    'conditions_of_class_rows', 'non_conformities_rows', 'psc_performance_rows',
                    'information_rows', 'survey_history_rows', 'manual_notes'
                ],
                is_active: true
            });
        }

        console.log('✅ Class & Statutory Survey Status Report template successfully seeded into database!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding survey status report template:', error);
        process.exit(1);
    }
}

seedSurveyStatusReportTemplate();

