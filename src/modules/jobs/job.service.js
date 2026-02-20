import db from '../../models/index.js';
import * as notificationService from '../../services/notification.service.js';
import * as fileAccessService from '../../services/fileAccess.service.js';
import * as lifecycleService from '../../services/lifecycle.service.js';
import { Op } from 'sequelize';

const JobRequest = db.JobRequest;
const JobStatusHistory = db.JobStatusHistory;
const User = db.User;
const CertificateType = db.CertificateType;
const Vessel = db.Vessel;
const Certificate = db.Certificate;
const AuditLog = db.AuditLog;

// ─────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────

/**
 * Assert a job exists, is not terminal, and optionally that the job belongs
 * to the caller's client scope. Returns the job.
 */
const requireJob = async (id) => {
    const job = await JobRequest.findByPk(id);
    if (!job) throw { statusCode: 404, message: 'Job not found' };
    return job;
};

// ─────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────

export const createJob = async (data, userId) => {
    if (data.certificate_type_id) {
        const certType = await CertificateType.findByPk(data.certificate_type_id);
        if (!certType) throw { statusCode: 400, message: 'Invalid certificate_type_id.' };
    }
    if (data.vessel_id) {
        const vessel = await Vessel.findByPk(data.vessel_id);
        if (!vessel) throw { statusCode: 400, message: 'Invalid vessel_id.' };
    }

    const { job_status: _omit, ...safeData } = data;
    const job = await JobRequest.create({
        ...safeData,
        requested_by_user_id: userId,
        job_status: 'CREATED'
    });

    await JobStatusHistory.create({
        job_id: job.id,
        old_status: null,
        new_status: 'CREATED',
        changed_by: userId,
        change_reason: 'Initial creation'
    });

    const jobWithVessel = await JobRequest.findByPk(job.id, { include: ['Vessel'] });
    await notificationService.notifyRoles(['ADMIN', 'GM', 'TM'], 'JOB_CREATED', {
        vesselName: jobWithVessel.Vessel.vessel_name,
        port: jobWithVessel.target_port
    });
    const clientUser = await User.findOne({ where: { client_id: jobWithVessel.Vessel.client_id, role: 'CLIENT' } });
    if (clientUser) {
        await notificationService.sendNotification(clientUser.id, 'JOB_CREATED', {
            vesselName: jobWithVessel.Vessel.vessel_name, port: jobWithVessel.target_port
        });
    }

    return job;
};

export const createJobForClient = async (data, clientId, userId) => {
    const vessel = await Vessel.findOne({ where: { id: data.vessel_id, client_id: clientId } });
    if (!vessel) throw { statusCode: 403, message: 'Unauthorized vessel selection' };
    return createJob(data, userId);
};

// ─────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────

const ALLOWED_JOB_FILTERS = ['id', 'vessel_id', 'certificate_type_id', 'requested_by_user_id',
    'assigned_surveyor_id', 'assigned_by_user_id', 'target_port', 'target_date'];
const INTERNAL_RECENT_ROLES = new Set(['ADMIN', 'GM', 'TM', 'TO', 'TA', 'FLAG_ADMIN']);
const RECENT_JOBS_DEFAULT_DAYS = 30;

const parseCsvOrSingle = (value) => {
    if (value == null || value === '') return [];
    return String(value).split(',').map(i => i.trim()).filter(Boolean);
};

const hasAnyUserFilter = (rest) =>
    [...ALLOWED_JOB_FILTERS, 'status', 'created_from', 'created_to']
        .some(k => rest[k] != null && String(rest[k]).trim() !== '');

export const getJobs = async (query, scopeFilters = {}, userRole = null) => {
    const { page = 1, limit = 10, status, created_from, created_to, recent_days, ...rest } = query;

    const whereClause = {};
    Object.entries(scopeFilters || {}).forEach(([k, v]) => {
        whereClause[k] = Array.isArray(v) ? { [Op.in]: v } : v;
    });

    const statuses = parseCsvOrSingle(status);
    if (statuses.length === 1) whereClause.job_status = statuses[0];
    else if (statuses.length > 1) whereClause.job_status = { [Op.in]: statuses };

    ALLOWED_JOB_FILTERS.forEach(k => {
        if (rest[k] == null || String(rest[k]).trim() === '') return;
        const values = parseCsvOrSingle(rest[k]);
        if (values.length === 1) whereClause[k] = values[0];
        else if (values.length > 1) whereClause[k] = { [Op.in]: values };
    });

    if (created_from || created_to) {
        whereClause.createdAt = {};
        if (created_from) whereClause.createdAt[Op.gte] = new Date(created_from);
        if (created_to) whereClause.createdAt[Op.lte] = new Date(created_to);
    } else if (INTERNAL_RECENT_ROLES.has(userRole) && !hasAnyUserFilter({ status, created_from, created_to, ...rest })) {
        const days = Math.max(1, parseInt(recent_days || RECENT_JOBS_DEFAULT_DAYS, 10));
        const since = new Date();
        since.setDate(since.getDate() - days);
        whereClause.createdAt = { [Op.gte]: since };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageLimit = Math.max(1, parseInt(limit, 10));
    const isSurveyor = userRole === 'SURVEYOR';

    const jobAttributes = isSurveyor
        ? ['id', 'vessel_id', 'certificate_type_id', 'target_port', 'target_date', 'job_status', 'createdAt']
        : ['id', 'vessel_id', 'certificate_type_id', 'requested_by_user_id', 'assigned_surveyor_id',
            'assigned_by_user_id', 'approved_by_user_id', 'target_port', 'target_date', 'job_status', 'createdAt'];

    const include = [
        { model: Vessel, attributes: isSurveyor ? ['id', 'vessel_name', 'imo_number'] : ['id', 'vessel_name', 'imo_number', 'client_id'] },
        { model: CertificateType, attributes: ['id', 'name', 'issuing_authority'] }
    ];
    if (!isSurveyor) include.push(
        { model: User, as: 'requester', attributes: ['id', 'name', 'email', 'role'] },
        { model: User, as: 'surveyor', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'approver', attributes: ['id', 'name', 'role'] }
    );

    const { count, rows } = await JobRequest.findAndCountAll({
        where: whereClause, attributes: jobAttributes,
        limit: pageLimit, offset: (pageNum - 1) * pageLimit,
        order: [['createdAt', 'DESC']], include
    });

    return {
        total: count, page: parseInt(page), limit: parseInt(limit),
        totalPages: Math.ceil(count / pageLimit),
        jobs: await fileAccessService.resolveEntity(rows)
    };
};

export const getJobById = async (id, scopeFilters = {}) => {
    const job = await JobRequest.findOne({
        where: { id, ...scopeFilters },
        include: [
            'Vessel', 'CertificateType', 'JobStatusHistories',
            { model: Certificate, as: 'Certificate', attributes: ['id', 'certificate_number', 'pdf_file_url'] },
            { model: User, as: 'approver', attributes: ['id', 'name', 'role'] }
        ]
    });
    if (!job) throw { statusCode: 404, message: 'Job not found' };

    if (job.Certificate?.pdf_file_url) {
        const key = fileAccessService.getKeyFromUrl(job.Certificate.pdf_file_url);
        const url = key?.startsWith('public/certificates/')
            ? fileAccessService.generatePublicCdnUrl(key)
            : await fileAccessService.generateSignedUrl(key, 3600);
        job.setDataValue('certificate_url', url);
        job.setDataValue('certificate_number', job.Certificate.certificate_number);
        job.setDataValue('certificate_id', job.Certificate.id);
    }

    return await fileAccessService.resolveEntity(job);
};

// ─────────────────────────────────────────────
// WORKFLOW TRANSITIONS — one function per transition
// All transitions delegate to lifecycle.service to maintain single source of truth.
// ─────────────────────────────────────────────

/**
 * CREATED → APPROVED
 * Roles: ADMIN, GM
 */
export const approveRequest = async (id, remarks, user) => {
    const job = await requireJob(id);
    if (job.job_status !== 'CREATED') {
        throw { statusCode: 400, message: `approveRequest requires job in CREATED state. Current: ${job.job_status}` };
    }
    const updated = await lifecycleService.updateJobStatus(id, 'APPROVED', user.id, remarks || `${user.role} approved request`);
    await updated.update({ approved_by_user_id: user.id });
    return updated;
};

/**
 * APPROVED → ASSIGNED (sets surveyor)
 * Roles: ADMIN, GM
 */
export const assignSurveyor = async (jobId, surveyorId, userId) => {
    const job = await requireJob(jobId);
    if (job.job_status !== 'APPROVED') {
        throw { statusCode: 400, message: 'Surveyor can only be assigned when job is APPROVED.' };
    }
    const surveyor = await User.findByPk(surveyorId);
    if (!surveyor || surveyor.role !== 'SURVEYOR') {
        throw { statusCode: 400, message: 'Invalid surveyorId: user must exist with SURVEYOR role.' };
    }
    await job.update({ assigned_surveyor_id: surveyorId, assigned_by_user_id: userId });
    const updated = await lifecycleService.updateJobStatus(jobId, 'ASSIGNED', userId, `Surveyor ${surveyorId} assigned`);

    const jobWithVessel = await JobRequest.findByPk(jobId, { include: ['Vessel'] });
    await notificationService.sendNotification(surveyorId, 'JOB_ASSIGNED', {
        jobId, vesselName: jobWithVessel.Vessel.vessel_name, port: jobWithVessel.target_port
    });
    return updated;
};

/**
 * Surveyor update without status change (ASSIGNED or later)
 * Roles: GM, TM
 */
export const reassignSurveyor = async (jobId, surveyorId, reason, userId) => {
    const job = await requireJob(jobId);
    // Guard: cannot reassign a terminal job
    if (lifecycleService.JOB_TERMINAL_STATES.includes(job.job_status)) {
        throw { statusCode: 400, message: `Cannot reassign surveyor on a ${job.job_status} job.` };
    }
    const surveyor = await User.findByPk(surveyorId);
    if (!surveyor || surveyor.role !== 'SURVEYOR') {
        throw { statusCode: 400, message: 'Invalid surveyorId: user must exist with SURVEYOR role.' };
    }
    const oldSurveyor = job.assigned_surveyor_id;
    await job.update({ assigned_surveyor_id: surveyorId, assigned_by_user_id: userId });
    await JobStatusHistory.create({
        job_id: jobId, old_status: job.job_status, new_status: job.job_status,
        changed_by: userId, change_reason: `Reassigned from ${oldSurveyor} to ${surveyorId}: ${reason}`
    });
    return job;
};

/**
 * ASSIGNED → SURVEY_AUTHORIZED
 * Roles: ADMIN, TM
 */
export const authorizeSurvey = async (id, remarks, user) => {
    const job = await requireJob(id);
    if (job.job_status !== 'ASSIGNED') {
        throw { statusCode: 400, message: `authorizeSurvey requires job in ASSIGNED state. Current: ${job.job_status}` };
    }
    if (!job.assigned_surveyor_id) {
        throw { statusCode: 400, message: 'Cannot authorize survey: no surveyor has been assigned yet.' };
    }
    const updated = await lifecycleService.updateJobStatus(id, 'SURVEY_AUTHORIZED', user.id,
        remarks || `${user.role} authorized survey`);
    await updated.update({ approved_by_user_id: user.id });

    const jobWithVessel = await JobRequest.findByPk(id, { include: ['Vessel'] });
    await notificationService.sendNotification(job.assigned_surveyor_id, 'JOB_APPROVED', {
        jobId: id, status: 'SURVEY_AUTHORIZED', vesselName: jobWithVessel.Vessel.vessel_name
    });
    const clientUser = await User.findOne({ where: { client_id: jobWithVessel.Vessel.client_id, role: 'CLIENT' } });
    if (clientUser) {
        await notificationService.sendNotification(clientUser.id, 'JOB_APPROVED', {
            jobId: id, vesselName: jobWithVessel.Vessel.vessel_name
        });
    }
    return updated;
};

/**
 * SURVEY_DONE → REVIEWED
 * Roles: TO
 */
export const reviewJob = async (id, remarks, user) => {
    if (user.role !== 'TO') {
        throw { statusCode: 403, message: 'Only Technical Officer (TO) can mark a job as REVIEWED.' };
    }
    const job = await requireJob(id);
    if (job.job_status !== 'SURVEY_DONE') {
        throw { statusCode: 400, message: `reviewJob requires job in SURVEY_DONE state. Current: ${job.job_status}` };
    }
    return await lifecycleService.updateJobStatus(id, 'REVIEWED', user.id, remarks || 'TO technical review passed.');
};

/**
 * SURVEY_DONE / REVIEWED → REWORK_REQUESTED
 * Roles: ADMIN, TM, TO
 */
export const sendBackJob = async (id, remarks, user) => {
    const job = await requireJob(id);
    const allowedFromStates = { ADMIN: null, TM: ['SURVEY_DONE', 'REVIEWED'], TO: ['SURVEY_DONE'] };
    const allowed = allowedFromStates[user.role];
    if (!allowed && user.role !== 'ADMIN') {
        throw { statusCode: 403, message: `${user.role} cannot send back jobs.` };
    }
    if (allowed && !allowed.includes(job.job_status)) {
        throw { statusCode: 400, message: `${user.role} can only send back from: ${allowed.join(', ')}. Current: ${job.job_status}` };
    }
    const updated = await lifecycleService.updateJobStatus(id, 'REWORK_REQUESTED', user.id,
        remarks || `${user.role} requested rework`);

    const jobWithVessel = await JobRequest.findByPk(id, { include: ['Vessel'] });
    if (job.assigned_surveyor_id) {
        await notificationService.sendNotification(job.assigned_surveyor_id, 'JOB_SENT_BACK', {
            jobId: id, vesselName: jobWithVessel.Vessel.vessel_name, remarks: remarks || 'Rework requested'
        });
    }
    return updated;
};

/**
 * → REJECTED (terminal)
 * ADMIN: any non-terminal | GM: CREATED only | TM: ASSIGNED, SURVEY_DONE, REVIEWED
 */
export const rejectJob = async (id, remarks, user) => {
    const job = await requireJob(id);
    const { role } = user;
    const current = job.job_status;

    // Terminal guard
    if (lifecycleService.JOB_TERMINAL_STATES.includes(current)) {
        throw { statusCode: 400, message: `Cannot reject a ${current} job.` };
    }
    if (role === 'GM' && current !== 'CREATED') {
        throw { statusCode: 403, message: 'GM can only reject CREATED jobs.' };
    }
    if (role === 'TM' && !['ASSIGNED', 'SURVEY_DONE', 'REVIEWED'].includes(current)) {
        throw { statusCode: 403, message: 'TM can only reject ASSIGNED, SURVEY_DONE, or REVIEWED jobs.' };
    }

    return await lifecycleService.updateJobStatus(id, 'REJECTED', user.id, remarks || `${role} rejected job`);
};

/**
 * → REJECTED (cancel path — CLIENT-accessible with ownership check)
 */
export const cancelJob = async (id, reason, userId) => {
    const job = await requireJob(id);
    if (lifecycleService.JOB_TERMINAL_STATES.includes(job.job_status)) {
        throw { statusCode: 400, message: `Cannot cancel a ${job.job_status} job.` };
    }
    return await lifecycleService.updateJobStatus(id, 'REJECTED', userId, reason || 'Job cancelled');
};

export const cancelJobForClient = async (id, reason, clientId, userId) => {
    const job = await JobRequest.findByPk(id, { include: ['Vessel'] });
    if (!job) throw { statusCode: 404, message: 'Job not found' };
    if (job.Vessel.client_id !== clientId) {
        throw { statusCode: 403, message: 'Unauthorized: this job does not belong to your account.' };
    }
    if (['FINALIZED', 'CERTIFIED', 'REJECTED'].includes(job.job_status)) {
        throw { statusCode: 400, message: `Cannot cancel a ${job.job_status} job.` };
    }
    return await lifecycleService.updateJobStatus(id, 'REJECTED', userId, reason || 'Cancelled by client');
};

// ─────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────

export const updatePriority = async (jobId, priority, reason, userId) => {
    const job = await requireJob(jobId);
    const oldPriority = job.priority;
    await job.update({ priority });
    await AuditLog.create({
        user_id: userId, action: 'UPDATE_PRIORITY',
        entity_name: 'JobRequest', entity_id: job.id,
        old_values: { priority: oldPriority }, new_values: { priority }, reason
    });
    return job;
};

export const getJobHistory = async (id) => {
    return await JobStatusHistory.findAll({
        where: { job_id: id },
        order: [['changed_at', 'ASC']],
        include: [{ model: User, attributes: ['name', 'email', 'role'] }]
    });
};

export const addInternalNote = async (jobId, noteText, userId) => {
    return await db.JobNote.create({ job_id: jobId, user_id: userId, note_text: noteText, is_internal: true });
};

export const updateJobStatus = (id, status, remarks, userId) => {
    throw { statusCode: 400, message: 'Direct status update is disabled. Use semantic workflow endpoints.' };
};
