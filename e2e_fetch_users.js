import db from './src/models/index.js';

async function run() {
    await db.sequelize.authenticate();
    const roles = ['CLIENT', 'TO', 'TM', 'GM', 'ADMIN', 'SURVEYOR'];
    for (const role of roles) {
        const user = await db.User.findOne({ where: { role, status: 'ACTIVE' } });
        if (user) {
            console.log(`${role}: ${user.email} (ID: ${user.id})`);
        } else {
            console.log(`${role}: Not found`);
        }
    }
    process.exit(0);
}
run();
