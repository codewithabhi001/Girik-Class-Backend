/**
 * Drops provider tables (service_providers, provider_evaluations).
 * Run after removing provider models: node scripts/drop-provider-tables.js
 */
import db from '../src/models/index.js';

const TABLES = ['provider_evaluations', 'service_providers'];

const run = async () => {
    try {
        const sequelize = db.sequelize;
        const dialect = sequelize.getDialect();
        if (dialect === 'mysql') await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        for (const table of TABLES) {
            await sequelize.query(`DROP TABLE IF EXISTS \`${table}\``);
            console.log('Dropped:', table);
        }
        if (dialect === 'mysql') await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Done.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
