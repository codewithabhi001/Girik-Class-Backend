import env from './env.js';

export default {
    development: {
        username: env.database.username,
        password: env.database.password,
        database: env.database.name,
        host: env.database.host,
        dialect: env.database.dialect,
        define: {
            underscored: true,  // Use snake_case for all auto-generated fields
            freezeTableName: true,  // Prevent table name pluralization
            timestamps: true
        },
        logging: false  // Disable SQL logging in development
    },
    test: {
        username: env.database.username,
        password: env.database.password,
        database: env.database.name + '_test',
        host: env.database.host,
        dialect: env.database.dialect,
        define: {
            underscored: true,
            freezeTableName: true,
            timestamps: true
        },
        logging: false
    },
    production: {
        username: env.database.username,
        password: env.database.password,
        database: env.database.name,
        host: env.database.host,
        dialect: env.database.dialect,
        define: {
            underscored: true,
            freezeTableName: true,
            timestamps: true
        },
        logging: false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
};
