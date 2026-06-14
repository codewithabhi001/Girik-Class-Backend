import 'dotenv/config';
import './disable_replica.js';
import db from '../src/models/index.js';

async function test() {
    const list = await db.ChecklistTemplate.findAll();
    console.log('ALL CHECKLIST TEMPLATES IN DB:');
    list.forEach(t => console.log(` - ID: ${t.id}, Code: ${t.code}, Name: ${t.name}, CreatedAt: ${t.created_at}`));

    const countChecklist = await db.ChecklistTemplate.count();
    console.log('Total checklist templates:', countChecklist);

    const countTypes = await db.CertificateType.count();
    console.log('Total certificate types:', countTypes);

    const countTemplates = await db.CertificateTemplate.count();
    console.log('Total certificate templates:', countTemplates);
}

test().catch(console.error).finally(() => db.sequelize.close());
