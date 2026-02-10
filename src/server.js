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

        // Production-ready: Don't alter tables, just validate connection
        // Use migrations for schema changes in production
        if (env.nodeEnv === 'development') {
            logger.info('Skipping auto-sync in favor of manual migrations...');
            // await db.sequelize.sync({ force: false }); // Only creates missing tables, doesn't alter
        }
        logger.info('Database models ready.');

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
