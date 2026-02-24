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
        throw { statusCode: 400, message: `This job has already been closed and cannot be modified further.` };
    }

    if (allowedStatuses && !allowedStatuses.includes(job.job_status)) {
        throw { statusCode: 400, message: `This action can only be performed when the job is in ${allowedStatuses.join(', ')} state.` };
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
    if (!survey) throw { statusCode: 404, message: 'Survey report not found. Please start the survey inspection first.' };
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
            throw { statusCode: 400, message: `This survey has already been started or processed.` };
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
        throw { statusCode: 400, message: `Please complete the inspection checklist before uploading evidence proof.` };
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
        throw { statusCode: 400, message: `Survey report cannot be submitted as the job is already being finalized or certified.` };
    }

    const survey = await requireSurvey(job_id);

    // Guard: submission requires PROOF_UPLOADED or REWORK_REQUIRED
    if (!['PROOF_UPLOADED', 'REWORK_REQUIRED'].includes(survey.survey_status)) {
        throw { statusCode: 400, message: `Please upload all required evidence proofs before submitting the survey report.` };
    }

    // Guard: checklist required
    const checklistCount = await ActivityPlanning.count({ where: { job_id } });
    if (checklistCount === 0) {
        throw { statusCode: 400, message: 'Please complete the inspection checklist before submitting the final report.' };
    }

    // ── Compliance Enforcement: GPS & Photo ──
    if (!gps_latitude || !gps_longitude) {
        throw { statusCode: 400, message: "GPS location must be recorded onsite before submission." };
    }
    if (!file && !survey.attendance_photo_url) {
        throw { statusCode: 400, message: "Attendance photo is mandatory before submitting survey." };
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
        throw { statusCode: 400, message: `Only submitted survey reports can be finalized.` };
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
        throw { statusCode: 400, message: `Rework can only be requested for submitted survey reports.` };
    }

    await lifecycleService.updateSurveyStatus(survey.id, 'REWORK_REQUIRED', userId, reason);
    return { message: 'Rework requested.' };
};

// ─────────────────────────────────────────────────────────────────────────────
// SURVEY STATEMENT MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export const draftSurveyStatement = async (jobId, data, userId) => {
    await assertJobAccessible(jobId, userId, { checkSurveyor: false });
    const survey = await requireSurvey(jobId);

    await survey.update({
        survey_statement: data.survey_statement,
        survey_statement_status: 'DRAFTED'
    });
    return { message: 'Survey statement drafted.', status: 'DRAFTED' };
};

export const issueSurveyStatement = async (jobId, file, userId) => {
    await assertJobAccessible(jobId, userId, { checkSurveyor: false });
    const survey = await requireSurvey(jobId);

    if (!file) throw { statusCode: 400, message: 'Please upload the signed Survey Statement PDF to issue it.' };

    const url = await s3Service.uploadFile(file.buffer, file.originalname, file.mimetype, s3Service.UPLOAD_FOLDERS.SURVEYS_PROOF);

    await survey.update({
        survey_statement_pdf_url: url,
        survey_statement_status: 'ISSUED'
    });

    return { message: 'Survey statement issued.', status: 'ISSUED', pdf_url: await fileAccessService.resolveUrl(url, { id: userId }) };
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
    const allowedFilters = {};
    if (filters.survey_status) allowedFilters.survey_status = filters.survey_status;
    if (filters.surveyor_id) allowedFilters.surveyor_id = filters.surveyor_id;
    if (filters.job_id) allowedFilters.job_id = filters.job_id;

    const { count, rows } = await Survey.findAndCountAll({
        where: allowedFilters,
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
        throw { statusCode: 400, message: 'GPS tracking is only available during an active survey inspection.' };
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
