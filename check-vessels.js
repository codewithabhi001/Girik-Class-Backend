import { config } from 'dotenv';
config();
import { db } from './src/config/db.js';

async function run() {
    try {
        const vessels = await db('vessels').select('vessel_name', 'imo_number', 'created_at').orderBy('created_at', 'desc').limit(5);
        console.log(vessels);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
