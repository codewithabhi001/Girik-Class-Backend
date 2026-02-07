import db from '../../models/index.js';

const { Job, Survey, User } = db;

export const syncOfflineData = async (userId, offlineData) => {
    const results = { synced: 0, failed: 0 };

    for (const data of offlineData) {
        try {
            if (data.type === 'survey') {
                await Survey.create({ ...data.payload, surveyor_id: userId });
            } else if (data.type === 'gps') {
                // Handle GPS data
            }
            results.synced++;
        } catch (error) {
            results.failed++;
        }
    }

    return results;
};

export const getOfflineJobs = async (userId) => {
    return await Job.findAll({
        where: {
            gm_assigned_surveyor_id: userId,
            job_status: ['ASSIGNED', 'SURVEY_DONE']
        },
        include: ['vessel', 'certificateType']
    });
};
