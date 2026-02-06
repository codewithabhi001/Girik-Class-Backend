import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Sequelize from 'sequelize';
import env from '../config/env.js';

import { v7 as uuidv7 } from 'uuid';

// Polyfill UUIDV7 for Sequelize
Sequelize.DataTypes.UUIDV7 = uuidv7;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbConfig = env.database;

const sequelize = new Sequelize(dbConfig.name, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: console.log, // set to console.log to see SQL queries
});

const db = {};

const loadModels = async () => {
    const files = fs.readdirSync(__dirname)
        .filter(file => {
            return (file.indexOf('.') !== 0) && (file !== 'index.js') && (file.slice(-3) === '.js');
        });

    for (const file of files) {
        const modelModule = await import(path.join(__dirname, file));
        const model = modelModule.default(sequelize, Sequelize.DataTypes);
        db[model.name] = model;
    }

    Object.keys(db).forEach(modelName => {
        if (db[modelName].associate) {
            db[modelName].associate(db);
        }
    });

    db.sequelize = sequelize;
    db.Sequelize = Sequelize;
};

// We need to export a promise or await this initialization in app.js
// But usually models are synch loaded in CJS. In ESM, top-level await is available in Node 14.8+
await loadModels();

export default db;
