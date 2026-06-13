import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import db from '../src/models/index.js';

const main = async () => {
    const PROJECT_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
    const ONLY_CERTS_DIR = path.join(PROJECT_ROOT, 'ONLY CERTIFICATES');

    const folders = fs.readdirSync(ONLY_CERTS_DIR, { withFileTypes: true })
        .filter(e => e.isDirectory() && e.name !== '.DS_Store' && e.name !== 'Thumbs.db')
        .map(e => e.name);

    const types = await db.CertificateType.findAll();
    const dbNames = types.map(t => t.name);

    console.log(`Folders on disk count: ${folders.length}`);
    console.log(`Certificate types in DB count: ${dbNames.length}`);

    const foldersSet = new Set(folders);
    const dbSet = new Set(dbNames);

    const missingInDb = folders.filter(f => !dbSet.has(f));
    const extraInDb = dbNames.filter(n => !foldersSet.has(n));

    console.log('\n--- Match Check ---');
    console.log(`Missing in DB: ${JSON.stringify(missingInDb)}`);
    console.log(`Extra in DB: ${JSON.stringify(extraInDb)}`);

    if (missingInDb.length === 0 && extraInDb.length === 0) {
        console.log('✅ Success! Folder names and DB certificate names match exactly 1:1.');
    } else {
        console.log('❌ Error! Mismatches found.');
    }
};

main()
    .catch(console.error)
    .finally(async () => {
        await db.sequelize.close().catch(() => {});
    });
