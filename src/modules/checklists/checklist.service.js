import db from '../../models/index.js';

const ActivityPlanning = db.ActivityPlanning;

export const getChecklist = async (jobId) => {
    return await ActivityPlanning.findAll({ where: { job_id: jobId } });
};

export const submitChecklist = async (jobId, items, userId) => {
    await ActivityPlanning.destroy({ where: { job_id: jobId } });

    const entries = items.map(item => ({
        job_id: jobId,
        ...item
    }));

    return await ActivityPlanning.bulkCreate(entries);
};
