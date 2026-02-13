/**
 * Drops all tables in the database.
 * Run from project root: node scripts/drop-all-tables.js
 */
import db from '../src/models/index.js';

const run = async () => {
    try {
        const sequelize = db.sequelize;
        const dialect = sequelize.getDialect();

        const tables = Object.keys(db)
            .filter((k) => k !== 'sequelize' && k !== 'Sequelize')
            .map((k) => db[k].tableName || db[k].options?.tableName)
            .filter(Boolean);

        if (tables.length === 0) {
            console.log('No tables to drop.');
            process.exit(0);
            return;
        }

        console.log('Dropping', tables.length, 'tables...');
        if (dialect === 'mysql') await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

        for (const table of tables) {
            const quoted = dialect === 'mysql' ? `\`${table}\`` : `"${table}"`;
            await sequelize.query(`DROP TABLE IF EXISTS ${quoted}`);
            console.log('  dropped:', table);
        }

        if (dialect === 'mysql') await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Done.');
        process.exit(0);
    } catch (err) {
        console.error('Drop failed:', err);
        process.exit(1);
    }
};

run();
