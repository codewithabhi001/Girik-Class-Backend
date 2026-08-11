import db from './src/models/index.js';
import { generateSampleReport } from './src/modules/reports/templates/survey-status-report.template.js';

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

        // 2. Generate HTML content
        const htmlContent = generateSampleReport();

        // 3. Upsert into CertificateTemplate
        const existingTemplate = await db.CertificateTemplate.findOne({
            where: { certificate_type_id: certType.id }
        });

        if (existingTemplate) {
            console.log('Updating existing CertificateTemplate in DB...');
            await existingTemplate.update({
                template_name: 'Survey Status Report Template',
                template_content: htmlContent,
                is_active: true
            });
        } else {
            console.log('Creating new CertificateTemplate in DB...');
            await db.CertificateTemplate.create({
                certificate_type_id: certType.id,
                template_name: 'Survey Status Report Template',
                template_content: htmlContent,
                variables: [
                    'vessel_name', 'imo_number', 'class_number', 'call_sign', 'flag',
                    'port_of_registry', 'ship_type', 'keel_laying_date', 'date_of_build',
                    'gross_tonnage', 'net_tonnage', 'deadweight', 'length', 'breadth', 'depth'
                ],
                is_active: true
            });
        }

        console.log('✅ Survey Status Report template successfully seeded into database!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding survey status report template:', error);
        process.exit(1);
    }
}

seedSurveyStatusReportTemplate();
