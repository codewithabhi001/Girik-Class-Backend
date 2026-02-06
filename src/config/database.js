import env from './env.js';

export default {
    development: {
        username: env.database.username,
        password: env.database.password,
        database: env.database.name,
        host: env.database.host,
        dialect: env.database.dialect,
    },
    test: {
        username: env.database.username,
        password: env.database.password,
        database: env.database.name + '_test',
        host: env.database.host,
        dialect: env.database.dialect,
    },
    production: {
        username: env.database.username,
        password: env.database.password,
        database: env.database.name,
        host: env.database.host,
        dialect: env.database.dialect,
    }
};
