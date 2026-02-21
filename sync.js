import 'dotenv/config';
import db from './src/models/index.js';

async function run() {
    try {
        console.log('Authenticating db...');
        await db.sequelize.authenticate();
        console.log('Syncing VesselDocument...');
        // Only run alter for VesselDocument (if not exists)
        await db.VesselDocument.sync({ alter: true });
        console.log('Done!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
