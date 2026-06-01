import db from './src/models/index.js';

async function flushDB() {
    try {
        console.log('Disabling foreign key checks...');
        await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

        const allModels = Object.keys(db).filter(key => key !== 'sequelize' && key !== 'Sequelize');

        for (const modelName of allModels) {
            if (modelName === 'User') {
                console.log(`Deleting all from ${modelName} except info@grclass.com...`);
                await db.User.destroy({
                    where: {
                        email: {
                            [db.Sequelize.Op.ne]: 'info@grclass.com'
                        }
                    }
                });
            } else if (modelName === 'SiteStaticContent') {
                console.log(`Skipping ${modelName}...`);
            } else {
                console.log(`Truncating/Deleting ${modelName}...`);
                try {
                    await db[modelName].destroy({ where: {}, truncate: true, cascade: true });
                } catch (e) {
                    console.log(`Truncate failed for ${modelName}, falling back to destroy...`);
                    try {
                        await db[modelName].destroy({ where: {} });
                    } catch (innerErr) {
                        console.log(`Failed to destroy ${modelName} (maybe table doesn't exist): ${innerErr.message}`);
                    }
                }
            }
        }

        console.log('Re-enabling foreign key checks...');
        await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('Database flushed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error flushing database:', error);
        await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => { });
        process.exit(1);
    }
}

flushDB();
