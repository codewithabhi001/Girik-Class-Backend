import db from '../../models/index.js';
import * as fileAccessService from '../../services/fileAccess.service.js';
import * as lifecycleService from '../../services/lifecycle.service.js';

const { ActivityPlanning, JobRequest, Survey } = db;

// ─────────────────────────────────────────────────────────────────────────────
// GET CHECKLIST
// ─────────────────────────────────────────────────────────────────────────────

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

    const items = await ActivityPlanning.findAll({ where });
    return await fileAccessService.resolveEntity(items);
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT CHECKLIST
// ─────────────────────────────────────────────────────────────────────────────

export const submitChecklist = async (jobId, items, userId) => {
    const job = await JobRequest.findByPk(jobId);
    if (!job) throw { statusCode: 404, message: 'Job not found' };

    // ── Guard 1: Terminal state ──
    if (lifecycleService.JOB_TERMINAL_STATES.includes(job.job_status)) {
        throw { statusCode: 400, message: `Job is in a terminal state (${job.job_status}) and cannot be modified.` };
    }

    // ── Guard 2: Post-finalization (payment / certified) ──
    if (lifecycleService.JOB_POST_FINALIZATION_STATES.includes(job.job_status)) {
        throw { statusCode: 400, message: `Checklist cannot be updated when job is ${job.job_status}.` };
    }

    // ── Guard 3: Only the assigned surveyor ──
    if (job.assigned_surveyor_id !== userId) {
        throw { statusCode: 403, message: 'You are not the assigned surveyor for this job.' };
    }

    const survey = await Survey.findOne({ where: { job_id: jobId } });
    if (!survey) throw { statusCode: 400, message: 'Survey has not been started. Please check-in first.' };

    // ── Guard 4: Survey must be STARTED or REWORK_REQUIRED (not before, not after) ──
    if (lifecycleService.SURVEY_TERMINAL_STATES.includes(survey.survey_status)) {
        throw { statusCode: 400, message: 'Survey is finalized and cannot be modified.' };
    }
    if (!['STARTED', 'REWORK_REQUIRED'].includes(survey.survey_status)) {
        throw { statusCode: 400, message: `Checklist can only be submitted when survey is STARTED or REWORK_REQUIRED. Current: ${survey.survey_status}` };
    }

    const txn = await db.sequelize.transaction();
    try {
        // Replace checklist (idempotent re-submission within same phase)
        await ActivityPlanning.destroy({ where: { job_id: jobId }, transaction: txn });

        const entries = items.map(item => ({ job_id: jobId, ...item }));
        const results = await ActivityPlanning.bulkCreate(entries, { transaction: txn });

        // Advance survey status
        await lifecycleService.updateSurveyStatus(survey.id, 'CHECKLIST_SUBMITTED', userId,
            'Checklist items submitted', { transaction: txn });

        await txn.commit();
        return await fileAccessService.resolveEntity(results, { id: userId });
    } catch (error) {
        await txn.rollback();
        throw error;
    }
};
