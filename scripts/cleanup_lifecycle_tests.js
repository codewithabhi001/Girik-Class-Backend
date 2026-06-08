import db from '../src/models/index.js';

const { Op } = db.Sequelize;

async function safeDelete(modelName, whereClause) {
    if (!db[modelName]) {
        console.log(`Model ${modelName} is not defined in Sequelize. Skipping.`);
        return 0;
    }
    try {
        const count = await db[modelName].destroy({ where: whereClause });
        console.log(`Deleted ${count} entries from ${modelName}.`);
        return count;
    } catch (e) {
        console.log(`Warning: Failed to delete from ${modelName}: ${e.message}`);
        return 0;
    }
}

async function cleanup() {
    console.log('Starting robust cleanup of lifecycle test jobs, certificates, payments, and other relations...');
    try {
        // Find all test jobs
        const testJobs = await db.JobRequest.findAll({
            where: {
                target_port: 'Singapore',
                target_date: '2026-12-31',
                reason: { [Op.in]: ['Annual', 'Mixed', 'Multi-Surveyor Test'] }
            }
        });

        console.log(`Found ${testJobs.length} test jobs.`);
        if (testJobs.length === 0) {
            console.log('No test jobs found. Nothing to delete.');
            return;
        }

        const jobIds = testJobs.map(j => j.id);

        // Fetch JobCertificates linked to these jobs
        let jobCertIds = [];
        try {
            const jobCerts = await db.JobCertificate.findAll({
                where: { job_request_id: { [Op.in]: jobIds } }
            });
            jobCertIds = jobCerts.map(jc => jc.id);
        } catch (e) {
            console.log(`Failed to fetch JobCertificates: ${e.message}`);
        }

        // Fetch Surveys linked to these JobCertificates
        let surveyIds = [];
        if (jobCertIds.length > 0) {
            try {
                const surveys = await db.Survey.findAll({
                    where: { job_certificate_id: { [Op.in]: jobCertIds } }
                });
                surveyIds = surveys.map(s => s.id);
            } catch (e) {
                console.log(`Failed to fetch Surveys: ${e.message}`);
            }
        }

        // Fetch Certificates linked to these jobs
        let certIds = [];
        try {
            const certs = await db.Certificate.findAll({
                where: { job_id: { [Op.in]: jobIds } }
            });
            certIds = certs.map(c => c.id);
        } catch (e) {
            console.log(`Failed to fetch Certificates: ${e.message}`);
        }

        // --- Deletion Phase ---

        // 1. Delete GPS tracking
        await safeDelete('GpsTracking', {
            [Op.or]: [
                { job_id: { [Op.in]: jobIds } },
                ...(jobCertIds.length ? [{ job_certificate_id: { [Op.in]: jobCertIds } }] : [])
            ]
        });

        // 2. Delete SurveySignedDocument
        if (surveyIds.length > 0) {
            await safeDelete('SurveySignedDocument', { survey_id: { [Op.in]: surveyIds } });
        }
        if (jobCertIds.length > 0) {
            await safeDelete('SurveySignedDocument', { job_certificate_id: { [Op.in]: jobCertIds } });
        }

        // 3. Delete SurveyStatusHistory
        if (surveyIds.length > 0) {
            await safeDelete('SurveyStatusHistory', { survey_id: { [Op.in]: surveyIds } });
        }

        // 4. Delete Surveys
        if (jobCertIds.length > 0) {
            await safeDelete('Survey', { job_certificate_id: { [Op.in]: jobCertIds } });
        }

        // 5. Delete JobDocuments
        await safeDelete('JobDocument', { job_id: { [Op.in]: jobIds } });

        // 6. Delete JobReschedules
        await safeDelete('JobReschedule', { job_id: { [Op.in]: jobIds } });

        // 7. Delete JobNotes
        await safeDelete('JobNote', { job_id: { [Op.in]: jobIds } });

        // 8. Delete JobStatusHistories
        await safeDelete('JobStatusHistory', { job_id: { [Op.in]: jobIds } });

        // 9. Delete ActivityPlannings
        await safeDelete('ActivityPlanning', { job_id: { [Op.in]: jobIds } });

        // 10. Delete NonConformities
        await safeDelete('NonConformity', { job_id: { [Op.in]: jobIds } });

        // 11. Delete FinancialLedger
        await safeDelete('FinancialLedger', { job_id: { [Op.in]: jobIds } });

        // 12. Delete Payments
        await safeDelete('Payment', { job_id: { [Op.in]: jobIds } });

        // 13. Delete JobCertificates
        await safeDelete('JobCertificate', { job_request_id: { [Op.in]: jobIds } });

        // 14. Delete CertificateHistory
        if (certIds.length > 0) {
            await safeDelete('CertificateHistory', { certificate_id: { [Op.in]: certIds } });
        }

        // 15. Delete Certificates
        await safeDelete('Certificate', { job_id: { [Op.in]: jobIds } });

        // 16. Delete JobRequests
        await safeDelete('JobRequest', { id: { [Op.in]: jobIds } });

        // 17. Delete Dummy surveyors
        await safeDelete('User', {
            role: 'SURVEYOR',
            email: { [Op.like]: 'surveyor2-%' }
        });

        console.log('Cleanup completed successfully.');
    } catch (e) {
        console.error('Error during cleanup:', e);
    } finally {
        await db.sequelize.close();
    }
}

cleanup();
