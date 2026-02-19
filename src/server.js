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
        // if (env.nodeEnv === 'development') {
        //     logger.info('Syncing database models...');
        //     await db.sequelize.sync({});
        // }
        logger.info('Database models ready.');

        startMonitoring();



        const isProduction = env.nodeEnv === 'production';
        const host = env.serverHost || (isProduction || process.env.USE_SERVER_IP === 'true' ? '13.239.63.143' : 'localhost');
        const baseUrl = `http://${host}:${PORT}`;

        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
            console.log('\n' + '='.repeat(60));
            console.log(`🚀 Server running at ${baseUrl}`);
            console.log('');
            console.log('📚 API Documentation (Swagger):');
            console.log(`   Full:    ${baseUrl}/api-docs`);
            console.log(`   Admin:   ${baseUrl}/api-docs/admin`);
            console.log(`   GM:      ${baseUrl}/api-docs/gm`);
            console.log(`   TM:      ${baseUrl}/api-docs/tm`);
            console.log(`   TO:      ${baseUrl}/api-docs/to`);
            console.log(`   Surveyor:${baseUrl}/api-docs/surveyor`);
            console.log(`   Client:  ${baseUrl}/api-docs/client`);
            console.log('='.repeat(60) + '\n');
        });
    } catch (error) {
        logger.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

startServer();
