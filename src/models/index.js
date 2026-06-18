import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Sequelize from 'sequelize';
import env from '../config/env.js';
import { getContext } from '../utils/context.util.js';

import { v7 as uuidv7 } from 'uuid';

// Polyfill UUIDV7 for Sequelize
Sequelize.DataTypes.UUIDV7 = uuidv7;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbConfig = env.database;

const sslOptions = dbConfig.sslCa ? {
    ssl: {
        ca: fs.readFileSync(path.resolve(dbConfig.sslCa))
    }
} : {};

const commonConfig = {
    dialect: dbConfig.dialect,
    dialectOptions: sslOptions,
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
};

let sequelize;

if (dbConfig.replicaHost && dbConfig.replicaHost !== dbConfig.host) {
    sequelize = new Sequelize(dbConfig.name, null, null, {
        ...commonConfig,
        replication: {
            write: {
                host: dbConfig.host,
                port: dbConfig.port,
                username: dbConfig.username,
                password: dbConfig.password,
            },
            read: [
                {
                    host: dbConfig.replicaHost,
                    port: dbConfig.port,
                    username: dbConfig.replicaUsername,
                    password: dbConfig.replicaPassword,
                }
            ]
        },
        pool: {
            max: dbConfig.poolMax,
            min: dbConfig.poolMin,
            idle: dbConfig.poolIdle,
            acquire: 60000,
        },
    });
} else {
    sequelize = new Sequelize(dbConfig.name, dbConfig.username, dbConfig.password, {
        ...commonConfig,
        host: dbConfig.host,
        port: dbConfig.port,
        pool: {
            max: dbConfig.poolMax,
            min: dbConfig.poolMin,
            idle: dbConfig.poolIdle,
            acquire: 60000,
        },
    });
}

// Patch connectionManager to use Master database by default for all SELECT queries,
// unless useReplica: true or useSlave: true is explicitly specified.
if (sequelize.connectionManager && typeof sequelize.connectionManager.getConnection === 'function') {
    const originalGetConnection = sequelize.connectionManager.getConnection;
    sequelize.connectionManager.getConnection = function (options) {
        options = options || {};
        if (options.type === 'SELECT') {
            const useReplica = options.useReplica === true || options.useSlave === true || options.useReplica === 'true' || options.useSlave === 'true';
            if (useReplica) {
                options.useMaster = false;
                console.log('🚀 [DB ROUTING] SELECT query routed to READ REPLICA');
            } else {
                options.useMaster = true;
                console.log('🗄️ [DB ROUTING] SELECT query routed to PRIMARY DB');
            }
        }
        return originalGetConnection.call(this, options);
    };
}

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

    // Attach Immutable Audit Trail hooks to ALL models (except AuditLog to avoid recursion)
    Object.keys(db).forEach(modelName => {
        if (modelName === 'AuditLog') return;
        const Model = db[modelName];
        if (!Model || typeof Model.addHook !== 'function') return;

        const auditAction = async (instance, options, action) => {
            if (!db.AuditLog) return;
            
            // Only log write operations for the audit trail
            const ctx = getContext();
            
            const auditData = {
                action,
                entity_name: modelName,
                entity_id: instance.id,
                old_values: action === 'CREATE' ? null : (instance._previousDataValues || null),
                new_values: action === 'DELETE' ? null : (instance.dataValues || null),
                user_id: options?.user_id || ctx.userId || null,
                ip_address: options?.ip_address || ctx.ip || null,
                user_agent: options?.user_agent || ctx.userAgent || null
            };

            // Don't log if no changes (for UPDATE)
            if (action === 'UPDATE' && JSON.stringify(auditData.old_values) === JSON.stringify(auditData.new_values)) {
                return;
            }

            try {
                // Use a separate transaction or no transaction to ensure the log is kept even if main txn fails?
                // Actually, usually audit logs should be part of the txn to ensure consistency.
                await db.AuditLog.create(auditData, { transaction: options?.transaction });
            } catch (err) {
                console.error(`Failed to create audit log for ${modelName}:`, err.message);
            }
        };

        Model.addHook('afterCreate', async (instance, options) => auditAction(instance, options, 'CREATE'));
        Model.addHook('afterUpdate', async (instance, options) => auditAction(instance, options, 'UPDATE'));
        Model.addHook('afterDestroy', async (instance, options) => auditAction(instance, options, 'DELETE'));
    });

    db.sequelize = sequelize;
    db.Sequelize = Sequelize;
};

// We need to export a promise or await this initialization in app.js
// But usually models are synch loaded in CJS. In ESM, top-level await is available in Node 14.8+
await loadModels();

export default db;
