import db from '../src/models/index.js';

const run = async () => {
    try {
        const sequelize = db.sequelize;
        const [results] = await sequelize.query('SHOW TABLES');
        const dbName = sequelize.getDatabaseName();
        const tables = results.map(row => row[`Tables_in_${dbName}`]);

        if (tables.length === 0) {
            console.log('No tables found in database.');
            process.exit(0);
        }

        console.log(`Found ${tables.length} tables. Dropping...`);
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        for (const table of tables) {
            await sequelize.query(`DROP TABLE IF EXISTS \`${table}\``);
            console.log(`  Dropped: ${table}`);
        }
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('All tables dropped successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Failed to drop tables:', err);
        process.exit(1);
    }
};

run();
