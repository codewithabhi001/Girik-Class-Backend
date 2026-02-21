import db from '../../models/index.js';
import * as s3Service from '../../services/s3.service.js';
import * as notificationService from '../../services/notification.service.js';
import * as fileAccessService from '../../services/fileAccess.service.js';
import * as lifecycleService from '../../services/lifecycle.service.js';
import logger from '../../utils/logger.js';

const { Survey, JobRequest, GpsTracking, ActivityPlanning, AuditLog } = db;

// ─────────────────────────────────────────────────────────────────────────────
// SHARED ACCESS GUARD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates that the job exists, is not in a terminal state, and (optionally)
 * the caller is the assigned surveyor.
 */
const assertJobAccessible = async (jobId, userId, { checkSurveyor = true, allowedStatuses = null } = {}) => {
    const job = await JobRequest.findByPk(jobId);
    if (!job) throw { statusCode: 404, message: 'Job not found' };

    if (lifecycleService.JOB_TERMINAL_STATES.includes(job.job_status)) {
        throw { statusCode: 400, message: `Job is in a terminal state (${job.job_status}) and cannot be modified.` };
    }

    if (allowedStatuses && !allowedStatuses.includes(job.job_status)) {
        throw { statusCode: 400, message: `This action requires job to be in: ${allowedStatuses.join(' / ')}. Current: ${job.job_status}` };
    }

    if (checkSurveyor && job.assigned_surveyor_id !== userId) {
        throw { statusCode: 403, message: 'You are not the assigned surveyor for this job.' };
    }

    if (job.is_survey_required === false) {
        throw { statusCode: 400, message: "Survey not required for this job." };
    }

    return job;
};

/**
 * Returns the survey for a job, or throws if not found.
 */
const requireSurvey = async (jobId) => {
    const survey = await Survey.findOne({ where: { job_id: jobId } });
    if (!survey) throw { statusCode: 404, message: 'Survey not found. Please check-in first.' };
    return survey;
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Check-In / Start Survey
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SURVEYOR action.
 * Allowed only when job is SURVEY_AUTHORIZED.
 * Survey must be NOT_STARTED.
 */
export const startSurvey = async (data, userId) => {
    const { job_id, latitude, longitude } = data;

    // Guard: job must be SURVEY_AUTHORIZED
    await assertJobAccessible(job_id, userId, {
        checkSurveyor: true,
        allowedStatuses: ['SURVEY_AUTHORIZED']
    });

    const txn = await db.sequelize.transaction();
    try {
        const [survey, created] = await Survey.findOrCreate({
            where: { job_id },
            defaults: { surveyor_id: userId, survey_status: 'NOT_STARTED' },
            transaction: txn
        });

        // Guard: cannot re-start an already-started survey
        if (!created && survey.survey_status !== 'NOT_STARTED') {
            throw { statusCode: 400, message: `Survey cannot be started: already in ${survey.survey_status} state.` };
        }

        await lifecycleService.updateSurveyStatus(survey.id, 'STARTED', userId, 'Surveyor checked in', { transaction: txn });

        await GpsTracking.create({ surveyor_id: userId, job_id, latitude, longitude }, { transaction: txn });

        await txn.commit();
        logger.info({ entity: 'SURVEY', event: 'CHECKIN', jobId: job_id, surveyId: survey.id, triggeredBy: userId });
        return { message: 'Survey started.', survey_id: survey.id, job_id };
    } catch (error) {
        await txn.rollback();
        throw error;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Submit Checklist
// Handled in checklist.service. Guards repeated here for defence-in-depth.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Upload Evidence Proof
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SURVEYOR action.
 * Survey must be CHECKLIST_SUBMITTED (or REWORK_REQUIRED to allow re-upload).
 */
export const uploadProof = async (jobId, file, userId) => {
    await assertJobAccessible(jobId, userId, { checkSurveyor: true });

    const survey = await requireSurvey(jobId);

    // Guard: must have submitted checklist first
    if (!['CHECKLIST_SUBMITTED', 'REWORK_REQUIRED'].includes(survey.survey_status)) {
        throw { statusCode: 400, message: `Proof can only be uploaded when survey is CHECKLIST_SUBMITTED or REWORK_REQUIRED. Current: ${survey.survey_status}` };
    }

    // S3 upload (outside transaction — idempotent/reversible)
    const url = await s3Service.uploadFile(file.buffer, file.originalname, file.mimetype, s3Service.UPLOAD_FOLDERS.SURVEYS_PROOF);

    const txn = await db.sequelize.transaction();
    try {
        await survey.update({ evidence_proof_url: url }, { transaction: txn });
        await lifecycleService.updateSurveyStatus(survey.id, 'PROOF_UPLOADED', userId, 'Evidence proof uploaded', { transaction: txn });
        await txn.commit();
        return await fileAccessService.resolveEntity({ url }, { id: userId });
    } catch (error) {
        await txn.rollback();
        throw error;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — Submit Survey Report (Check-Out)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SURVEYOR action.
 * Survey must be PROOF_UPLOADED or REWORK_REQUIRED.
 * Job must not be PAYMENT_DONE or beyond.
 */
export const submitSurveyReport = async (data, file, userId) => {
    const { job_id, gps_latitude, gps_longitude, survey_statement } = data;

    const job = await assertJobAccessible(job_id, userId, { checkSurveyor: true });

    // Guard: once payment is done, survey can no longer be submitted
    if (lifecycleService.JOB_POST_FINALIZATION_STATES.includes(job.job_status)) {
        throw { statusCode: 400, message: `Survey submission is not allowed when job is ${job.job_status}.` };
    }

    const survey = await requireSurvey(job_id);

    // Guard: submission requires PROOF_UPLOADED or REWORK_REQUIRED
    if (!['PROOF_UPLOADED', 'REWORK_REQUIRED'].includes(survey.survey_status)) {
        throw { statusCode: 400, message: `Survey cannot be submitted from ${survey.survey_status} state. Upload proof first.` };
    }

    // Guard: checklist required
    const checklistCount = await ActivityPlanning.count({ where: { job_id } });
    if (checklistCount === 0) {
        throw { statusCode: 400, message: 'Checklist must be submitted before the survey report.' };
    }

    let photoUrl = survey.attendance_photo_url;
    if (file) photoUrl = await s3Service.uploadFile(file.buffer, file.originalname, file.mimetype, s3Service.UPLOAD_FOLDERS.SURVEYS_PHOTO);

    const txn = await db.sequelize.transaction();
    try {
        await survey.update({ gps_latitude, gps_longitude, attendance_photo_url: photoUrl, survey_statement }, { transaction: txn });
        await lifecycleService.updateSurveyStatus(survey.id, 'SUBMITTED', userId, 'Survey report submitted', { transaction: txn });
        await GpsTracking.create({ surveyor_id: userId, job_id, latitude: gps_latitude, longitude: gps_longitude }, { transaction: txn });

        await txn.commit();
        await survey.reload(); // Refresh the instance state (SUBMITTED)
        logger.info({ entity: 'SURVEY', event: 'SUBMITTED', jobId: job_id, surveyId: survey.id, triggeredBy: userId });
        return await fileAccessService.resolveEntity(survey, { id: userId });
    } catch (error) {
        await txn.rollback();
        throw error;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// FINALIZE — TM Action
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TM-only action.
 * Survey must be SUBMITTED.
 * No open Non-Conformities (checked inside lifecycle.service).
 */
export const finalizeSurvey = async (jobId, userId) => {
    await assertJobAccessible(jobId, userId, { checkSurveyor: false });

    const survey = await requireSurvey(jobId);

    if (survey.survey_status !== 'SUBMITTED') {
        throw { statusCode: 400, message: `Survey must be SUBMITTED before it can be finalized. Current: ${survey.survey_status}` };
    }

    // lifecycle service handles TM role check, NC check, and job sync
    await lifecycleService.updateSurveyStatus(survey.id, 'FINALIZED', userId, 'Final approval granted by TM');

    const job = await JobRequest.findByPk(jobId, { include: ['Vessel'] });
    if (job?.assigned_surveyor_id) {
        await notificationService.sendNotification(job.assigned_surveyor_id, 'JOB_FINALIZED', {
            vesselName: job.Vessel?.vessel_name
        }).catch(() => { }); // non-critical
    }

    return { message: 'Survey finalized. Job is now FINALIZED.' };
};

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST REWORK — TM / GM Action
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Allowed only when survey is SUBMITTED and job has not passed FINALIZED.
 */
export const requestRework = async (jobId, reason, userId) => {
    const job = await assertJobAccessible(jobId, userId, { checkSurveyor: false });

    // Guard: no rework once job is at or past FINALIZED
    if (lifecycleService.JOB_POST_FINALIZATION_STATES.includes(job.job_status)) {
        throw { statusCode: 400, message: `Rework cannot be requested when job is ${job.job_status}.` };
    }

    const survey = await requireSurvey(jobId);

    if (survey.survey_status !== 'SUBMITTED') {
        throw { statusCode: 400, message: `Rework can only be requested when survey is SUBMITTED. Current: ${survey.survey_status}` };
    }

    await lifecycleService.updateSurveyStatus(survey.id, 'REWORK_REQUIRED', userId, reason);
    return { message: 'Rework requested.' };
};

// ─────────────────────────────────────────────────────────────────────────────
// READ-ONLY
// ─────────────────────────────────────────────────────────────────────────────

export const getTimeline = async (id) => {
    const job = await JobRequest.findByPk(id);
    if (!job) throw { statusCode: 404, message: 'Job not found' };
    if (job.is_survey_required === false) {
        throw { statusCode: 400, message: "Survey not required for this job." };
    }

    const gps = await GpsTracking.findAll({ where: { job_id: id }, order: [['timestamp', 'ASC']] });
    const survey = await Survey.findOne({
        where: { job_id: id },
        include: [{ model: db.SurveyStatusHistory, order: [['created_at', 'ASC']] }]
    });
    return { job_id: id, gps_trace: gps, survey_details: await fileAccessService.resolveEntity(survey) };
};

export const getSurveyReports = async (query) => {
    const { page = 1, limit = 10, ...filters } = query;
    const { count, rows } = await Survey.findAndCountAll({
        where: filters,
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        include: [
            { model: JobRequest, include: [{ model: db.Vessel, attributes: ['vessel_name', 'imo_number'] }] },
            { model: db.User, attributes: ['name', 'email'] }
        ],
        order: [['submitted_at', 'DESC']]
    });
    return { count, rows: await fileAccessService.resolveEntity(rows) };
};

// ─────────────────────────────────────────────────────────────────────────────
// STREAM GPS LOCATION — during active survey
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Records a live GPS ping from the surveyor during an active survey.
 * Can be called repeatedly throughout the inspection.
 */
export const streamLocation = async (jobId, { latitude, longitude }, userId) => {
    const job = await JobRequest.findByPk(jobId);
    if (!job) throw { statusCode: 404, message: 'Job not found' };
    if (job.assigned_surveyor_id !== userId) {
        throw { statusCode: 403, message: 'You are not the assigned surveyor for this job.' };
    }

    if (job.is_survey_required === false) {
        throw { statusCode: 400, message: "Survey not required for this job." };
    }

    const survey = await Survey.findOne({ where: { job_id: jobId } });
    const activeStatuses = ['STARTED', 'CHECKLIST_SUBMITTED', 'PROOF_UPLOADED'];
    if (!survey || !activeStatuses.includes(survey.survey_status)) {
        throw { statusCode: 400, message: 'Location can only be streamed during an active survey.' };
    }

    const record = await GpsTracking.create({ surveyor_id: userId, job_id: jobId, latitude, longitude });
    // Keep survey's last known coordinates current
    await survey.update({ gps_latitude: latitude, gps_longitude: longitude });
    return record;
};

export const flagViolation = async (jobId, userId) => {
    await assertJobAccessible(jobId, userId, { checkSurveyor: false });
    await notificationService.notifyRoles(['ADMIN', 'TM', 'GM'], 'Survey Violation Flagged',
        `Suspicious behavior flagged for Job ${jobId}.`, 'CRITICAL');
    await AuditLog.create({
        user_id: userId, action: 'FLAG_VIOLATION',
        entity_name: 'JobRequest', entity_id: jobId,
        new_values: { violation_flagged: true }
    });
    return { message: 'Violation flagged and admins notified.' };
};
