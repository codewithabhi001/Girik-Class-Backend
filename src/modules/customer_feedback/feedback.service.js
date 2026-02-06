
import db from '../../models/index.js';
import * as notificationService from '../../services/notification.service.js';

const CustomerFeedback = db.CustomerFeedback;
const JobRequest = db.JobRequest;

export const submitFeedback = async (data, user) => {
    // Check if job exists and is completed
    const job = await JobRequest.findByPk(data.job_id);
    if (!job) throw { statusCode: 404, message: 'Job not found' };

    // Ensure job is completed. 
    // Assuming status or checking logic. Docs say "Allowed only after job completion".
    if (job.job_status !== 'COMPLETED' && job.job_status !== 'CLOSED') { // Assuming 'CLOSED' or 'COMPLETED'
        throw { statusCode: 400, message: 'Feedback allowed only for COMPLETED jobs' };
    }

    // Check if feedback already exists
    const existing = await CustomerFeedback.findOne({ where: { job_id: data.job_id } });
    if (existing) {
        throw { statusCode: 400, message: 'Feedback already submitted for this job' };
    }

    const feedback = await CustomerFeedback.create({
        ...data,
        client_id: user.id
    });

    // Low Satisfaction Alert
    if (feedback.rating < 3) {
        // Emit EVENT_CUSTOMER_DISSATISFACTION -> Notify GM
        await notificationService.notifyRoles(['GM', 'ADMIN'], 'Customer Dissatisfaction Alert', `Low rating (${feedback.rating}/5) received for Job ${job.job_number || job.id}.`);
    }

    return feedback;
};

export const getFeedbackForJob = async (jobId) => {
    return await CustomerFeedback.findOne({
        where: { job_id: jobId },
        include: ['Client']
    });
};

export const getAllFeedback = async (query) => {
    const { page = 1, limit = 10 } = query;
    return await CustomerFeedback.findAndCountAll({
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        order: [['submitted_at', 'DESC']],
        include: ['Client'] // Maybe include Job too
    });
};
