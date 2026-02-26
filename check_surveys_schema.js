import 'dotenv/config';
import db from './src/models/index.js';

async function checkColumns() {
    try {
        const [results] = await db.sequelize.query('DESCRIBE surveys');
        console.log('Columns in surveys table:');
        results.forEach(col => console.log(`- ${col.Field}: ${col.Type}`));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkColumns();
