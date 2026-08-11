import db from './src/models/index.js';

async function run() {
    try {
        console.log('Connecting to DB...');
        await db.sequelize.authenticate();
        console.log('Connected to DB');
        await db.SystemSetting.upsert({
            key: 'maintenance_mode',
            value: JSON.stringify({ isMaintenance: false, message: 'System is back online.' })
        });
        console.log('Maintenance mode disabled in DB');
        process.exit(0);
    } catch (err) {
        console.error('DB Error:', err);
        process.exit(1);
    }
}
run();
