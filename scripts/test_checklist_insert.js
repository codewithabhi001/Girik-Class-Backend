import 'dotenv/config';
import './disable_replica.js';
// Enable logging
process.env.DB_LOGGING = 'true';
import db from '../src/models/index.js';

async function test() {
    console.log('Starting checklist insert test...');
    
    // Find an existing certificate type
    const certType = await db.CertificateType.findOne();
    if (!certType) {
        console.error('No certificate type found! Run seeding of certificate types first.');
        return;
    }
    
    console.log(`Using CertificateType: ${certType.name} (${certType.id})`);
    
    try {
        const template = await db.ChecklistTemplate.create({
            name: 'Test Checklist Template',
            code: 'TEST-CHECKLIST-CODE',
            description: 'Test template description',
            certificate_type_id: certType.id,
            sections: [
                {
                    title: "General Verification Items",
                    items: [
                        { code: "GEN_01", text: "Are all required parameters verified?", type: "yes_no_na" }
                    ]
                }
            ],
            status: 'ACTIVE',
            template_files: ['test-file.docx'],
            metadata: { version: "1.0", source: "test" }
        });
        
        console.log(`Successfully created ChecklistTemplate: ${template.id}`);
        
        const file = await db.ChecklistTemplateFile.create({
            checklist_template_id: template.id,
            name: 'test-file.docx',
            file_key: 'test-file-key',
            display_order: 0,
            is_mandatory: true
        });
        
        console.log(`Successfully created ChecklistTemplateFile: ${file.id}`);
    } catch (err) {
        console.error('Test failed with error:', err);
    }
}

test().catch(console.error).finally(() => db.sequelize.close());
