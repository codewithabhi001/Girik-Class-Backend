import 'dotenv/config';
import db from '../src/models/index.js';

const main = async () => {
    const types = await db.CertificateType.findAll();
    console.log(`Total Certificate Types in DB: ${types.length}`);

    const templates = await db.CertificateTemplate.findAll();
    console.log(`Total Certificate Templates in DB: ${templates.length}`);

    const checklists = await db.ChecklistTemplate.findAll();
    console.log(`Total Checklist Templates in DB: ${checklists.length}`);

    // Print out the Certificate Types and their templates & checklists count
    console.log('\n--- Certificate Types details ---');
    for (const t of types) {
        const certTemplates = templates.filter(ct => ct.certificate_type_id === t.id);
        const certChecklists = checklists.filter(cc => cc.certificate_type_id === t.id);
        console.log(`Type: "${t.name}" (${t.short_code}) | Templates: ${certTemplates.length} | Checklists: ${certChecklists.length}`);
    }

    // Check if there are templates or checklists referencing non-existent types
    const typeIds = new Set(types.map(t => t.id));
    const orphanedTemplates = templates.filter(ct => !typeIds.has(ct.certificate_type_id));
    const orphanedChecklists = checklists.filter(cc => !typeIds.has(cc.certificate_type_id));

    console.log(`\nOrphaned Certificate Templates count: ${orphanedTemplates.length}`);
    console.log(`Orphaned Checklist Templates count: ${orphanedChecklists.length}`);
};

main()
    .catch(console.error)
    .finally(async () => {
        await db.sequelize.close().catch(() => {});
    });
