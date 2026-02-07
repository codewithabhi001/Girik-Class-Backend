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

        // Auto-sync models: Updates tables to match models
        // For production, use migrations instead
        logger.info('Syncing database models (alter mode)...');
        await db.sequelize.sync({ alter: true });
        logger.info('Database models synced successfully.');

        startMonitoring();


        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
            logger.info(`Swagger API Docs: http://localhost:${PORT}/api-docs`);
        });
    } catch (error) {
        logger.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

startServer();
