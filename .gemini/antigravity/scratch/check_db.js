import db from '../../../src/models/index.js';
import env from '../../../src/config/env.js';

async function checkDb() {
    console.log('Environment DB Config:', JSON.stringify(env.database, null, 2));
    console.log('Sequelize Options DB:', db.sequelize.config.database);
    
    try {
        // Fetch total number of tables
        const tables = await db.sequelize.getQueryInterface().showAllTables();
        console.log('Total number of tables:', tables.length);
        console.log('Tables list:', tables);

        // Fetch row count for CustomerFeedback
        const count = await db.CustomerFeedback.count();
        console.log('Current Feedback Count:', count);
        
        process.exit(0);
    } catch (err) {
        console.error('Database check failed:', err);
        process.exit(1);
    }
}

checkDb();
