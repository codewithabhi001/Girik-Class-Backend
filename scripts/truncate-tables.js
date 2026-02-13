/**
 * Truncates all tables. Uses MySQL: disables foreign key checks, truncates, then re-enables.
 * Run from project root: node scripts/truncate-tables.js
 */
import db from '../src/models/index.js';

const truncate = async () => {
    try {
        const sequelize = db.sequelize;
        const dialect = sequelize.getDialect();

        const toTruncate = Object.keys(db)
            .filter((k) => k !== 'sequelize' && k !== 'Sequelize')
            .map((k) => db[k].tableName || db[k].options?.tableName)
            .filter(Boolean);

        if (toTruncate.length === 0) {
            console.log('No tables to truncate.');
            process.exit(0);
            return;
        }

        console.log('Truncating', toTruncate.length, 'tables:', toTruncate.join(', '));

        if (dialect === 'mysql') {
            await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        }

        for (const table of toTruncate) {
            const quoted = dialect === 'mysql' ? `\`${table}\`` : `"${table}"`;
            await sequelize.query(`TRUNCATE TABLE ${quoted}`);
            console.log('  truncated:', table);
        }

        if (dialect === 'mysql') {
            await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        }

        console.log('Done.');
        process.exit(0);
    } catch (err) {
        console.error('Truncate failed:', err);
        process.exit(1);
    }
};

truncate();
