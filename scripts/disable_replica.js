// Force Sequelize to use a single-pool writer connection by bypassing the replica host
process.env.DB_REPLICA_HOST = '';

// Disable SQL query logging during script runs for speed
process.env.DB_LOGGING = 'false';
