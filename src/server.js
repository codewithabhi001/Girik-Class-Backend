import app from './app.js';
import env from './config/env.js';
import logger from './utils/logger.js';
import db from './models/index.js';

import { startMonitoring } from './services/cron.service.js';


const PORT = env.port;

const startServer = async () => {
    try {
        await db.sequelize.authenticate();
        logger.info('Database connected successfully.');

        // Sync models is usually not recommended in production, use migrations instead.
        // However, for development speed in this context, we might sync if needed.
        // await db.sequelize.sync({ alter: true }); 


        startMonitoring();


        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        logger.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

startServer();
