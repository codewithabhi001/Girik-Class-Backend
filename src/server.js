import http from 'http';
import app from './app.js';
import env from './config/env.js';
import logger from './utils/logger.js';
import db from './models/index.js';
import chalk from 'chalk';

import { startMonitoring } from './services/cron.service.js';
import * as websocketService from './services/websocket.service.js';


const PORT = env.port; // Trigger watch reload

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
        const host = env.serverHost || (isProduction || process.env.USE_SERVER_IP === 'true' ? '[IP_ADDRESS]' : 'localhost');
        const baseUrl = `http://${host}:${PORT}`;

        const server = http.createServer(app);
        await websocketService.init(server);

        server.listen(PORT, () => {
            console.log('\n' + chalk.bgBlue.white.bold(' SYSTEM ') + chalk.dim(' ='.repeat(25)));
            logger.info(`Server is running on port ${PORT}`);
            console.log(`${chalk.green('🚀')} ${chalk.bold('Environment:')} ${chalk.cyan(env.nodeEnv)}`);
            console.log(`${chalk.green('🌐')} ${chalk.bold('Base URL:')}    ${chalk.underline.blue(baseUrl)}`);
            console.log('');
            console.log(chalk.bgMagenta.white.bold(' DOCUMENTATION ') + chalk.dim(' -'.repeat(20)));
            console.log(`  ${chalk.dim('•')} ${chalk.bold('Full API:')}    ${chalk.blue(`${baseUrl}/api-docs`)}`);
            console.log(`  ${chalk.dim('•')} ${chalk.bold('Roles:')}       ${chalk.gray('Admin, GM, TM, TO, Surveyor, Client')}`);
            console.log(chalk.dim('='.repeat(58)) + '\n');
        });
    } catch (error) {
        logger.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

startServer();
// Triggered nodemon reload
