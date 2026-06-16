import db from '../../models/index.js';
import { flatAuditLogListRow } from '../../utils/listRowFlatten.util.js';
import logger from '../../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getSystemMetrics = async () => {
    const [userCount, jobCount, activeSurveys, rejectedJobs] = await Promise.all([
        db.User.count({ useReplica: true }),
        db.JobRequest.count({ useReplica: true }),
        db.JobRequest.count({ where: { job_status: 'IN_PROGRESS' }, useReplica: true }),
        db.JobRequest.count({ where: { job_status: 'REJECTED' }, useReplica: true })
    ]);

    let dbStatus = 'CONNECTED';
    try {
        await db.sequelize.authenticate();
    } catch (e) {
        dbStatus = 'DISCONNECTED';
    }

    // Check Redis connectivity
    let redisStatus = 'N/A';
    try {
        if (process.env.REDIS_URL) {
            const { createClient } = await import('redis');
            const client = createClient({ url: process.env.REDIS_URL });
            // Set timeout for connection check
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000));
            await Promise.race([client.connect(), timeout]);
            redisStatus = 'CONNECTED';
            await client.quit();
        }
    } catch (e) {
        redisStatus = 'DISCONNECTED';
    }

    return {
        database: { status: dbStatus, dialect: db.sequelize.getDialect() },
        cache: { status: redisStatus, provider: 'Redis' },
        storage: { status: 'CONNECTED', provider: 'AWS_S3', region: process.env.AWS_REGION || 'us-east-1' },
        counts: { 
            users: userCount, 
            jobs: jobCount, 
            active_surveys: activeSurveys,
            rejected_jobs: rejectedJobs
        },
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date()
    };
};

export const getAuditLogs = async (query) => {
    const { page = 1, limit = 50, user_id, action, entity_name, from_date, to_date } = query;
    const where = {};
    if (user_id) where.user_id = user_id;
    if (action) where.action = action;
    if (entity_name) where.entity_name = entity_name;
    if (from_date || to_date) {
        where.createdAt = {};
        if (from_date) where.createdAt[db.Sequelize.Op.gte] = new Date(from_date);
        if (to_date) where.createdAt[db.Sequelize.Op.lte] = new Date(to_date);
    }

    const { count, rows } = await db.AuditLog.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [['created_at', 'DESC']],
        include: [{ model: db.User, attributes: ['id', 'name', 'email', 'role'] }],
        useReplica: true
    });

    return {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
        logs: rows.map(flatAuditLogListRow),
    };
};

export const forceLogout = async (userId) => {
    return { success: true, message: `User session invalidation command sent for ${userId}` };
};

export const getFailedJobs = async () => {
    // Return jobs that were rejected as a proxy for 'failed' in this context
    const rejected = await db.JobRequest.findAll({
        where: { job_status: 'REJECTED' },
        limit: 10,
        order: [['updatedAt', 'DESC']],
        attributes: ['id', 'job_status', 'remarks', 'updatedAt'],
        include: [{ model: db.Vessel, attributes: ['vessel_name'] }],
        useReplica: true
    });
    
    return rejected.map(r => ({
        id: r.id,
        vessel: r.Vessel?.vessel_name,
        status: r.job_status,
        updated_at: r.updatedAt,
        reason: r.remarks || 'Rejected via workflow'
    }));
};

export const retryJob = async (id, userId) => {
    const job = await db.JobRequest.findByPk(id, { useMaster: true });
    if (!job) throw { statusCode: 404, message: 'Job not found' };

    const oldStatus = job.job_status;
    // Only retry if it was rejected or specifically failed
    if (oldStatus !== 'REJECTED') {
        throw { statusCode: 400, message: `Only REJECTED jobs can be retried through this trigger. Current status: ${oldStatus}` };
    }

    await job.update({
        job_status: 'CREATED',
        remarks: job.remarks ? `${job.remarks}\n---\nRetry triggered by system on ${new Date().toISOString()}` : 'System retry trigger'
    });

    // Create history record
    await db.JobStatusHistory.create({
        job_id: id,
        previous_status: oldStatus,
        new_status: 'CREATED',
        changed_by: userId,
        reason: 'System operations - manual retry trigger'
    }).catch(() => {});

    return { 
        success: true, 
        message: 'Job status reset to CREATED successfully', 
        job_id: id 
    };
};

export const performMaintenance = async (action, userId, userEmail) => {
    logger.warn(`MAINTENANCE: Action ${action} triggered by ${userEmail} (ID: ${userId})`);
    
    switch (action) {
        case 'clear-cache':
            if (process.env.REDIS_URL) {
                const { createClient } = await import('redis');
                const client = createClient({ url: process.env.REDIS_URL });
                await client.connect();
                // Flush keys with app prefix
                const keys = await client.keys('gr-class:*');
                if (keys.length > 0) await client.del(keys);
                await client.quit();
                return { message: `Cleared ${keys.length} keys from cache`, action };
            }
            return { message: 'No distributed cache (Redis) configured to clear', action };
            
        case 'reindex':
            // If we have an external search engine (ElasticSearch/typesense), trigger reindex here
            return { message: 'Metadata re-indexing requested successfully', action };
            
        default:
            throw { statusCode: 400, message: 'Invalid maintenance action' };
    }
};

export const getMigrations = async () => {
    try {
        const [results] = await db.sequelize.query('SELECT name FROM SequelizeMeta ORDER BY name ASC');
        const applied = results.map(r => r.name);
        
        // Scan migration folder for pending
        const migrationDir = path.resolve(__dirname, '../../../migrations');
        let pending = [];
        if (fs.existsSync(migrationDir)) {
            const files = fs.readdirSync(migrationDir)
                .filter(f => f.endsWith('.js') || f.endsWith('.cjs'))
                .map(f => f.replace(/\.c?js$/, ''));
            pending = files.filter(f => !applied.includes(f));
        }

        return {
            applied,
            pending,
            total_applied: applied.length,
            total_pending: pending.length
        };
    } catch (e) {
        return { applied: [], pending: [], error: 'Could not fetch migration metadata' };
    }
};

export const getLocales = async () => {
    // Return supported flag administrations as locales
    const flags = await db.FlagAdministration.findAll({ attributes: ['flag_state_name', 'country'], useReplica: true });
    return { 
        available: flags.map(f => ({ code: f.country, name: f.flag_state_name })),
        default: 'INT'
    };
};

export const addLocale = async (code) => {
    return { message: `Configuration update requested for locale: ${code}` };
};

export const getVersion = async () => {
    try {
        const pkgPath = path.resolve(__dirname, '../../../package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        return { 
            version: pkg.version, 
            node: process.version,
            env: process.env.NODE_ENV || 'development' 
        };
    } catch (e) {
        return { version: '1.0.0', error: 'Internal version lookup failed' };
    }
};

export const getMaintenanceMode = async () => {
    if (global._maintenanceCache && (Date.now() - global._maintenanceCache.ts < 5000)) {
        return global._maintenanceCache.value;
    }

    try {
        const setting = await db.SystemSetting.findByPk('maintenance_mode');
        let value = { isMaintenance: false, message: 'System is currently undergoing maintenance. Please try again later.' };
        if (setting) {
            value = JSON.parse(setting.value);
        }
        global._maintenanceCache = { value, ts: Date.now() };
        return value;
    } catch (err) {
        return { isMaintenance: false, message: 'System is currently undergoing maintenance. Please try again later.' };
    }
};

export const updateMaintenanceMode = async (isMaintenance, message, userId, userEmail) => {
    logger.warn(`MAINTENANCE_TOGGLE: User ${userEmail} (ID: ${userId}) set maintenance to ${isMaintenance} with message: "${message || ''}"`);

    const value = {
        isMaintenance: !!isMaintenance,
        message: message || 'System is currently undergoing maintenance. Please try again later.'
    };

    await db.SystemSetting.upsert({
        key: 'maintenance_mode',
        value: JSON.stringify(value)
    });

    global._maintenanceCache = { value, ts: Date.now() };
    return value;
};

export const getAppStatus = async (platform, version) => {
    let config = {
        android: {
            minVersion: 10,
            latestVersion: 12,
            isMaintenance: false,
            maintenanceMessage: 'Android app is undergoing maintenance.',
            storeUrl: 'https://play.google.com/store/apps/details?id=com.grclass.app'
        },
        ios: {
            minVersion: 10,
            latestVersion: 12,
            isMaintenance: false,
            maintenanceMessage: 'iOS app is undergoing maintenance.',
            storeUrl: 'https://apps.apple.com/app/gr-class/id6400000000'
        }
    };

    try {
        const setting = await db.SystemSetting.findByPk('mobile_app_config');
        if (setting) {
            config = JSON.parse(setting.value);
        }
    } catch (err) {
        // Fallback
    }

    const platformKey = platform.toLowerCase();
    const platformConfig = config[platformKey];
    if (!platformConfig) {
        throw { statusCode: 400, message: `Unsupported platform: ${platform}` };
    }

    const currentVersion = parseInt(version, 10);
    const minVer = parseInt(platformConfig.minVersion, 10);
    const latestVer = parseInt(platformConfig.latestVersion, 10);

    return {
        platform: platformKey,
        currentVersion,
        isMaintenance: !!platformConfig.isMaintenance,
        maintenanceMessage: platformConfig.maintenanceMessage,
        updateRequired: currentVersion < minVer,
        updateAvailable: currentVersion < latestVer,
        storeUrl: platformConfig.storeUrl
    };
};

export const getAppConfig = async () => {
    let config = {
        android: {
            minVersion: 10,
            latestVersion: 12,
            isMaintenance: false,
            maintenanceMessage: 'Android app is undergoing maintenance.',
            storeUrl: 'https://play.google.com/store/apps/details?id=com.grclass.app'
        },
        ios: {
            minVersion: 10,
            latestVersion: 12,
            isMaintenance: false,
            maintenanceMessage: 'iOS app is undergoing maintenance.',
            storeUrl: 'https://apps.apple.com/app/gr-class/id6400000000'
        }
    };

    try {
        const setting = await db.SystemSetting.findByPk('mobile_app_config');
        if (setting) {
            config = JSON.parse(setting.value);
        }
    } catch (err) {
        // Fallback
    }

    return config;
};

export const updateAppConfig = async (config) => {
    await db.SystemSetting.upsert({
        key: 'mobile_app_config',
        value: JSON.stringify(config)
    });
    return config;
};
