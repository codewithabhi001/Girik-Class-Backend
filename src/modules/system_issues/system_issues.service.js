import db from '../../models/index.js';

export const createReport = async (reportData) => {
    const report = await db.SystemIssueReport.create({
        user_id: reportData.user_id || null,
        error_message: reportData.error_message,
        stack_trace: reportData.stack_trace || null,
        description: reportData.description || null,
        page_url: reportData.page_url || null,
        user_agent: reportData.user_agent || null,
        status: 'OPEN'
    });
    return report;
};

export const getReports = async (query) => {
    const { page = 1, limit = 20, status } = query;
    const where = {};
    if (status) {
        where.status = status;
    }

    const limitInt = parseInt(limit, 10);
    const offset = (parseInt(page, 10) - 1) * limitInt;

    const { count, rows } = await db.SystemIssueReport.findAndCountAll({
        where,
        limit: limitInt,
        offset,
        order: [['created_at', 'DESC']],
        include: [
            {
                model: db.User,
                as: 'Reporter',
                attributes: ['id', 'name', 'email', 'role']
            },
            {
                model: db.User,
                as: 'Resolver',
                attributes: ['id', 'name', 'email', 'role']
            }
        ],
        useReplica: true
    });

    return {
        total: count,
        page: parseInt(page, 10),
        limit: limitInt,
        totalPages: Math.ceil(count / limitInt),
        reports: rows
    };
};

export const updateReportStatus = async (id, status, resolverId) => {
    const report = await db.SystemIssueReport.findByPk(id, { useMaster: true });
    if (!report) {
        throw { statusCode: 404, message: 'Issue report not found.' };
    }

    const updates = { status };
    if (status === 'RESOLVED') {
        updates.resolved_at = new Date();
        updates.resolved_by = resolverId;
    } else {
        updates.resolved_at = null;
        updates.resolved_by = null;
    }

    await report.update(updates);

    // Reload with associations
    return await db.SystemIssueReport.findByPk(id, {
        include: [
            {
                model: db.User,
                as: 'Reporter',
                attributes: ['id', 'name', 'email', 'role']
            },
            {
                model: db.User,
                as: 'Resolver',
                attributes: ['id', 'name', 'email', 'role']
            }
        ]
    });
};
