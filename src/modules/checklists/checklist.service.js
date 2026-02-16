import db from '../../models/index.js';

const ActivityPlanning = db.ActivityPlanning;
const JobRequest = db.JobRequest;

export const getChecklist = async (jobId, filters = {}) => {
    const { answer, question_code, search } = filters;
    const where = { job_id: jobId };

    if (answer) where.answer = answer;
    if (question_code) where.question_code = question_code;

    if (search) {
        where[db.Sequelize.Op.or] = [
            { question_text: { [db.Sequelize.Op.like]: `%${search}%` } },
            { remarks: { [db.Sequelize.Op.like]: `%${search}%` } }
        ];
    }

    return await ActivityPlanning.findAll({ where });
};

export const submitChecklist = async (jobId, items, userId) => {
    const job = await JobRequest.findByPk(jobId);
    if (!job) throw { statusCode: 404, message: 'Job not found' };
    if (job.job_status !== 'IN_PROGRESS') {
        throw { statusCode: 400, message: 'Checklist can only be submitted after starting the survey (job must be IN_PROGRESS)' };
    }
    if (job.gm_assigned_surveyor_id !== userId) {
        throw { statusCode: 403, message: 'You are not assigned to this job' };
    }

    await ActivityPlanning.destroy({ where: { job_id: jobId } });

    const entries = items.map(item => ({
        job_id: jobId,
        ...item
    }));

    return await ActivityPlanning.bulkCreate(entries);
};
