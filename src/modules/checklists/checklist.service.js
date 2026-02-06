import db from '../../models/index.js';

const ActivityPlanning = db.ActivityPlanning;

export const getChecklist = async (jobId) => {
    return await ActivityPlanning.findAll({ where: { job_id: jobId } });
};

export const submitChecklist = async (jobId, items, user) => {
    // items: [{ question_code, answer, remarks }]
    // Delete old or update? Usually survey checklists are one-off or versioned.
    // For simplicity: Replace.

    await ActivityPlanning.destroy({ where: { job_id: jobId } });

    const entries = items.map(item => ({
        job_id: jobId,
        ...item
    }));

    return await ActivityPlanning.bulkCreate(entries);
};
