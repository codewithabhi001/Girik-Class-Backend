import db from '../src/models/index.js';

async function main() {
    try {
        console.log('--- Verifying Database Seed ---');
        
        // 1. Get all users
        const users = await db.User.findAll({
            include: [{ model: db.SurveyorProfile }],
            raw: false
        });

        console.log(`Found ${users.length} users in the database:`);
        for (const u of users) {
            console.log(`- ID: ${u.id}`);
            console.log(`  Email: ${u.email}`);
            console.log(`  Role: ${u.role}`);
            console.log(`  Status: ${u.status}`);
            console.log(`  Has Profile: ${u.SurveyorProfile ? 'YES' : 'NO'}`);
            if (u.SurveyorProfile) {
                console.log(`    └─ Profile Status: ${u.SurveyorProfile.status}`);
                console.log(`    └─ License: ${u.SurveyorProfile.license_number}`);
            }
        }

        // 2. Count other tables
        const counts = {};
        const models = ['JobRequest', 'Survey', 'Certificate', 'Client', 'Vessel', 'SiteStaticContent'];
        for (const model of models) {
            if (db[model]) {
                counts[model] = await db[model].count();
            }
        }
        console.log('\nOther Table Counts:');
        console.log(JSON.stringify(counts, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('❌ Verification failed:', err);
        process.exit(1);
    }
}

main();
