const fs = require('fs');
const path = require('path');
require('dotenv').config();

const sslOptions = process.env.DB_SSL_CA ? {
    ssl: {
        ca: fs.readFileSync(path.resolve(process.env.DB_SSL_CA))
    }
} : {};

module.exports = {
    development: {
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'girik_db',
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        dialect: process.env.DB_DIALECT || 'mysql',
        dialectOptions: sslOptions,
        logging: console.log
    },
    test: {
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'girik_db_test',
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        dialect: process.env.DB_DIALECT || 'mysql',
        dialectOptions: sslOptions,
        logging: false
    },
    production: {
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: process.env.DB_DIALECT || 'mysql',
        dialectOptions: sslOptions,
        logging: false
    }
};
