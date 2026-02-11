/**
 * Check table structure
 */

import db from './src/models/index.js';

async function checkStructure() {
    try {
        await db.sequelize.authenticate();

        // Check certificate_types structure
        const [certTypes] = await db.sequelize.query(`
            SHOW CREATE TABLE certificate_types
        `);

        console.log('Certificate Types Table:');
        console.log(certTypes[0]['Create Table']);
        console.log('\n---\n');

        // Check checklist_templates structure
        const [checklistTemplates] = await db.sequelize.query(`
            SHOW CREATE TABLE checklist_templates
        `);

        console.log('Checklist Templates Table:');
        console.log(checklistTemplates[0]['Create Table']);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkStructure();
