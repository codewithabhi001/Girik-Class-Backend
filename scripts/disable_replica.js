// Force Sequelize to use a single-pool writer connection by bypassing the replica host
process.env.DB_REPLICA_HOST = '';

// Enable SQL query logging during script runs
process.env.DB_LOGGING = 'true';
