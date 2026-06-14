import 'dotenv/config';
import './disable_replica.js';
import db from '../src/models/index.js';

async function test() {
    const [templatesSchema] = await db.sequelize.query('SHOW CREATE TABLE checklist_templates');
    console.log('checklist_templates SCHEMA:\n', templatesSchema[0]['Create Table']);
    
    const [filesSchema] = await db.sequelize.query('SHOW CREATE TABLE checklist_template_files');
    console.log('checklist_template_files SCHEMA:\n', filesSchema[0]['Create Table']);
}

test().catch(console.error).finally(() => db.sequelize.close());
