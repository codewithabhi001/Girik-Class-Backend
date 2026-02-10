import db from '../../models/index.js';

export const exportUserData = async (userId) => {
    const user = await db.User.findByPk(userId, {
        include: [
            { model: db.JobRequest, as: 'RequestedJobs' },
            { model: db.SupportTicket, as: 'Tickets' }
        ]
    });
    return user;
};

export const anonymizeUser = async (userId) => {
    const user = await db.User.findByPk(userId);
    if (!user) throw { statusCode: 404, message: 'User not found' };

    await user.update({
        name: 'ANONYMOUS',
        email: `anon-${userId}@girik.internal`,
        phone: '0000000000',
        status: 'INACTIVE'
    });

    return { success: true, message: 'User data anonymized' };
};
