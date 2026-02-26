import db from './src/models/index.js';

const run = async () => {
    try {
        await db.sequelize.authenticate();
        console.log('Connection has been established successfully.');
        await db.Message.sync({ alter: true });
        console.log('Messages table synchronized.');
        process.exit(0);
    } catch (error) {
        console.error('Unable to sync table:', error);
        process.exit(1);
    }
};

run();
