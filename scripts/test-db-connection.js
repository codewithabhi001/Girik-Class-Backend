import dotenv from 'dotenv';
import Sequelize from 'sequelize';
import fs from 'fs';
import path from 'path';

dotenv.config();

const config = {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    port: process.env.DB_PORT,
    dialectOptions: process.env.DB_SSL_CA ? {
        ssl: {
            ca: fs.readFileSync(process.env.DB_SSL_CA)
        }
    } : {}
};

console.log('Testing DB connection with config:', { ...config, password: '****' });

const sequelize = new Sequelize(config.database, config.username, config.password, config);

async function test() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database:', error);

        if (error.original && error.original.code === 'ER_BAD_DB_ERROR') {
            console.log('Database does not exist. Attempting to create it...');
            try {
                // Connect without database to create it
                const rootSequelize = new Sequelize('', config.username, config.password, {
                    ...config,
                    database: undefined
                });
                await rootSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\`;`);
                console.log(`Database ${config.database} created successfully.`);
                process.exit(0);
            } catch (createError) {
                console.error('Failed to create database:', createError);
                process.exit(1);
            }
        }

        process.exit(1);
    }
}

test();
