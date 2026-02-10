import db from '../../models/index.js';

const { JobRequest, SurveyReport } = db;

export const syncOfflineData = async (userId, offlineData) => {
    const results = { synced: 0, failed: 0 };

    for (const data of offlineData) {
        try {
            if (data.type === 'survey') {
                await SurveyReport.create({ ...data.payload, surveyor_id: userId });
            }
            // Handle other types
            results.synced++;
        } catch (error) {
            results.failed++;
        }
    }

    return results;
};

export const getOfflineJobs = async (userId) => {
    return await JobRequest.findAll({
        where: {
            gm_assigned_surveyor_id: userId,
            job_status: ['ASSIGNED', 'SURVEY_DONE']
        },
        include: ['Vessel', 'CertificateType']
    });
};
