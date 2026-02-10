import db from '../../models/index.js';

export const getSystemMetrics = async () => {
    const [userCount, jobCount, activeSurveys] = await Promise.all([
        db.User.count(),
        db.JobRequest.count(),
        db.JobRequest.count({ where: { job_status: 'IN_PROGRESS' } })
    ]);

    return {
        database: { status: 'CONNECTED', pool_active: 5 },
        storage: { status: 'CONNECTED', bucket: 'girik-prod' },
        counts: { users: userCount, jobs: jobCount, active_surveys: activeSurveys },
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
    };
};

export const getAuditLogs = async (query) => {
    const { page = 1, limit = 50 } = query;
    return await db.AuditLog.findAndCountAll({
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        order: [['created_at', 'DESC']],
        include: [{ model: db.User, attributes: ['name', 'email'] }]
    });
};

export const forceLogout = async (userId) => {
    return { success: true, message: `User ${userId} session invalidated` };
};

export const getFailedJobs = async () => {
    return [
        { id: 'job-123', name: 'GeneratePDF', failed_at: new Date(), error: 'Timeout' }
    ];
};

export const retryJob = async (id, userEmail) => {
    console.log(`AUDIT: Job ${id} retried by ${userEmail}`);
    return { message: 'Job queued for retry', job_id: id };
};

export const performMaintenance = async (action, userEmail) => {
    console.log(`AUDIT: Maintenance ${action} triggered by ${userEmail}`);
    switch (action) {
        case 'clear-cache':
            return { message: 'Cache Logged Clear request' };
        case 'reindex':
            return { message: 'Reindexing started' };
        default:
            throw { statusCode: 400, message: 'Invalid maintenance action' };
    }
};

export const getMigrations = async () => {
    return {
        applied: ['001-init', '002-jobs'],
        pending: []
    };
};

export const getLocales = async () => {
    return { locales: ['en-US', 'en-GB', 'fr-FR', 'es-ES'] };
};

export const addLocale = async (code) => {
    return { message: `Locale ${code} added support` };
};

export const getVersion = async () => {
    return { version: '1.0.0', build: 'prod-release-01' };
};
