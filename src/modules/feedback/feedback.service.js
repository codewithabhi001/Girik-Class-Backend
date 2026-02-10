import db from '../../models/index.js';
import * as notificationService from '../../services/notification.service.js';

const CustomerFeedback = db.CustomerFeedback;
const JobRequest = db.JobRequest;

export const submitFeedback = async (data, userId, clientId) => {
    const job = await JobRequest.findByPk(data.job_id, {
        include: [{ model: db.Vessel, attributes: ['client_id'] }]
    });

    if (!job) throw { statusCode: 404, message: 'Job not found' };

    if (clientId && job.Vessel.client_id !== clientId) {
        throw { statusCode: 403, message: 'Unauthorized to provide feedback for this job' };
    }

    if (!['COMPLETED', 'CLOSED', 'CERTIFIED'].includes(job.job_status)) {
        throw { statusCode: 400, message: 'Feedback allowed only for COMPLETED jobs' };
    }

    const existing = await CustomerFeedback.findOne({ where: { job_id: data.job_id } });
    if (existing) {
        throw { statusCode: 400, message: 'Feedback already submitted for this job' };
    }

    const feedback = await CustomerFeedback.create({
        ...data,
        client_id: clientId,
        user_id: userId
    });

    if (feedback.rating < 3) {
        await notificationService.notifyRoles(['GM', 'ADMIN'], 'Customer Dissatisfaction Alert', `Low rating (${feedback.rating}/5) received for Job ${job.job_number || job.id}.`);
    }

    return feedback;
};

export const getFeedbackForJob = async (jobId) => {
    return await CustomerFeedback.findOne({
        where: { job_id: jobId },
        include: ['Client'] // Ensure association exists
    });
};

export const getAllFeedback = async (query) => {
    const { page = 1, limit = 10 } = query;
    return await CustomerFeedback.findAndCountAll({
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        order: [['created_at', 'DESC']], // Use created_at if submitted_at doesn't exist
        include: ['Client']
    });
};
