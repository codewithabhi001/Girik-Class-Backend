import db from '../../models/index.js';
import * as notificationService from '../../services/notification.service.js';
import { Op } from 'sequelize';

const JobRequest = db.JobRequest;
const JobStatusHistory = db.JobStatusHistory;
const User = db.User;
const CertificateType = db.CertificateType;
const Vessel = db.Vessel;
const AuditLog = db.AuditLog;

const WORKFLOW_TRANSITIONS = {
    CREATED: ['GM_APPROVED', 'REJECTED'],
    GM_APPROVED: ['ASSIGNED', 'REJECTED'],
    ASSIGNED: ['TM_PRE_APPROVED', 'REJECTED'],
    TM_PRE_APPROVED: ['IN_PROGRESS', 'REJECTED'],
    IN_PROGRESS: ['SURVEY_DONE', 'REJECTED'],
    SURVEY_DONE: ['TM_PRE_APPROVED', 'TO_APPROVED', 'TM_FINAL', 'REJECTED'],
    TO_APPROVED: ['TM_FINAL', 'TM_PRE_APPROVED', 'REJECTED'],
    TM_FINAL: ['PAYMENT_DONE', 'REJECTED'],
    PAYMENT_DONE: ['CERTIFIED', 'REJECTED'],
    CERTIFIED: [],
    REJECTED: []
};

const assertTransition = (fromStatus, toStatus) => {
    const allowed = WORKFLOW_TRANSITIONS[fromStatus] || [];
    if (!allowed.includes(toStatus)) {
        throw {
            statusCode: 400,
            message: `Invalid status transition from ${fromStatus} to ${toStatus}`
        };
    }
};

const updateJobStatusWithHistory = async (job, newStatus, remarks, userId) => {
    const oldStatus = job.job_status;
    const oldRemarks = job.remarks || null;
    const updatedRemarks = remarks || oldRemarks;
    assertTransition(oldStatus, newStatus);

    await job.update({ job_status: newStatus, remarks: updatedRemarks });
    await JobStatusHistory.create({
        job_id: job.id,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: userId,
        change_reason: remarks || `Status changed from ${oldStatus} to ${newStatus}`
    });
    await AuditLog.create({
        user_id: userId,
        action: 'UPDATE_JOB_STATUS',
        entity_name: 'JobRequest',
        entity_id: job.id,
        old_values: { job_status: oldStatus, remarks: oldRemarks },
        new_values: { job_status: newStatus, remarks: updatedRemarks },
    });
    return job;
};

export const createJob = async (data, userId) => {
    if (data.certificate_type_id) {
        const certType = await CertificateType.findByPk(data.certificate_type_id);
        if (!certType) {
            throw { statusCode: 400, message: 'Invalid or unknown certificate_type_id. Please use a valid certificate type from /api/v1/certificates/types.' };
        }
    }
    if (data.vessel_id) {
        const vessel = await Vessel.findByPk(data.vessel_id);
        if (!vessel) {
            throw { statusCode: 400, message: 'Invalid or unknown vessel_id.' };
        }
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
    // Notify Client
    const clientUser = await User.findOne({ where: { client_id: jobWithVessel.Vessel.client_id, role: 'CLIENT' } }); // Assuming one client user per client
    if (clientUser) {
        await notificationService.sendNotification(clientUser.id, 'JOB_CREATED', {
            vesselName: jobWithVessel.Vessel.vessel_name,
            port: jobWithVessel.target_port
        });
    }

    return job;
};

export const createJobForClient = async (data, clientId, userId) => {
    const vessel = await db.Vessel.findOne({ where: { id: data.vessel_id, client_id: clientId } });
    if (!vessel) throw { statusCode: 403, message: 'Unauthorized vessel selection' };
    return createJob(data, userId);
};

const ALLOWED_JOB_FILTERS = [
    'id',
    'vessel_id',
    'certificate_type_id',
    'requested_by_user_id',
    'gm_assigned_surveyor_id',
    'target_port',
    'target_date',
];
const INTERNAL_RECENT_ROLES = new Set(['ADMIN', 'GM', 'TM', 'TO', 'TA', 'FLAG_ADMIN']);
const RECENT_JOBS_DEFAULT_DAYS = 30;

const parseCsvOrSingle = (value) => {
    if (value == null || value === '') return [];
    return String(value).split(',').map((item) => item.trim()).filter(Boolean);
};

const hasAnyUserFilter = (rest) => {
    const filterKeys = [
        ...ALLOWED_JOB_FILTERS,
        'status',
        'created_from',
        'created_to',
    ];
    return filterKeys.some((key) => rest[key] != null && String(rest[key]).trim() !== '');
};

export const getJobs = async (query, scopeFilters = {}, userRole = null) => {
    const {
        page = 1,
        limit = 10,
        status,
        created_from,
        created_to,
        recent_days,
        ...rest
    } = query;

    const whereClause = {};
    Object.entries(scopeFilters || {}).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            whereClause[key] = { [Op.in]: value };
        } else {
            whereClause[key] = value;
        }
    });

    const statuses = parseCsvOrSingle(status);
    if (statuses.length === 1) {
        whereClause.job_status = statuses[0];
    } else if (statuses.length > 1) {
        whereClause.job_status = { [Op.in]: statuses };
    }

    ALLOWED_JOB_FILTERS.forEach((key) => {
        if (rest[key] == null || String(rest[key]).trim() === '') return;
        const values = parseCsvOrSingle(rest[key]);
        if (values.length === 1) {
            whereClause[key] = values[0];
        } else if (values.length > 1) {
            whereClause[key] = { [Op.in]: values };
        }
    });

    if ((created_from && String(created_from).trim() !== '') || (created_to && String(created_to).trim() !== '')) {
        whereClause.createdAt = {};
        if (created_from && String(created_from).trim() !== '') {
            whereClause.createdAt[Op.gte] = new Date(created_from);
        }
        if (created_to && String(created_to).trim() !== '') {
            whereClause.createdAt[Op.lte] = new Date(created_to);
        }
    } else if (INTERNAL_RECENT_ROLES.has(userRole) && !hasAnyUserFilter({ status, created_from, created_to, ...rest })) {
        const days = Math.max(1, parseInt(recent_days || RECENT_JOBS_DEFAULT_DAYS, 10));
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - days);
        whereClause.createdAt = { [Op.gte]: sinceDate };
    }

    const pageNumber = Math.max(1, parseInt(page, 10));
    const pageLimit = Math.max(1, parseInt(limit, 10));
    const isSurveyor = userRole === 'SURVEYOR';

    const jobAttributes = isSurveyor
        ? [
            'id',
            'vessel_id',
            'certificate_type_id',
            'target_port',
            'target_date',
            'job_status',
            'createdAt',
        ]
        : [
            'id',
            'vessel_id',
            'certificate_type_id',
            'requested_by_user_id',
            'gm_assigned_surveyor_id',
            'target_port',
            'target_date',
            'job_status',
            'createdAt',
        ];

    const include = [
        {
            model: Vessel,
            attributes: isSurveyor
                ? ['id', 'vessel_name', 'imo_number']
                : ['id', 'vessel_name', 'imo_number', 'client_id']
        },
        { model: CertificateType, attributes: ['id', 'name', 'issuing_authority'] },
    ];

    if (!isSurveyor) {
        include.push(
            { model: User, as: 'requester', attributes: ['id', 'name', 'email', 'role'] },
            { model: User, as: 'surveyor', attributes: ['id', 'name', 'email'] },
        );
    }

    return await JobRequest.findAndCountAll({
        where: whereClause,
        attributes: jobAttributes,
        limit: pageLimit,
        offset: (pageNumber - 1) * pageLimit,
        order: [['createdAt', 'DESC']],
        include,
    });
};

export const getJobById = async (id, scopeFilters = {}) => {
    const job = await JobRequest.findOne({
        where: { id, ...scopeFilters },
        include: ['Vessel', 'CertificateType', 'JobStatusHistories']
    });
    if (!job) throw { statusCode: 404, message: 'Job not found' };
    return job;
};

export const updateJobStatus = async (id, newStatus, remarks, userId) => {
    const job = await JobRequest.findByPk(id);
    if (!job) throw { statusCode: 404, message: 'Job not found' };
    return updateJobStatusWithHistory(job, newStatus, remarks, userId);
};

export const gmApproveJob = async (id, remarks, userId) => {
    const job = await JobRequest.findByPk(id);
    if (!job) throw { statusCode: 404, message: 'Job not found' };
    return updateJobStatusWithHistory(job, 'GM_APPROVED', remarks || 'GM approved job request', userId);
};

export const gmRejectJob = async (id, remarks, userId) => {
    const job = await JobRequest.findByPk(id);
    if (!job) throw { statusCode: 404, message: 'Job not found' };
    return updateJobStatusWithHistory(job, 'REJECTED', remarks || 'GM rejected job request', userId);
};

export const tmPreApproveJob = async (id, remarks, userId) => {
    const job = await JobRequest.findByPk(id);
    if (!job) throw { statusCode: 404, message: 'Job not found' };
    if (!job.gm_assigned_surveyor_id) {
        throw { statusCode: 400, message: 'Cannot pre-approve before surveyor assignment' };
    }
    const updatedJob = await updateJobStatusWithHistory(job, 'TM_PRE_APPROVED', remarks || 'TM pre-survey approved', userId);
    const jobWithVessel = await JobRequest.findByPk(job.id, { include: ['Vessel'] });
    await notificationService.sendNotification(job.gm_assigned_surveyor_id, 'JOB_APPROVED', {
        jobId: job.id,
        status: 'TM_PRE_APPROVED',
        vesselName: jobWithVessel.Vessel.vessel_name
    });
    // Notify Client
    const clientUser = await User.findOne({ where: { client_id: jobWithVessel.Vessel.client_id, role: 'CLIENT' } });
    if (clientUser) {
        await notificationService.sendNotification(clientUser.id, 'JOB_APPROVED', {
            jobId: job.id,
            status: 'TM_PRE_APPROVED',
            vesselName: jobWithVessel.Vessel.vessel_name
        });
    }
    return updatedJob;
};

export const tmPreRejectJob = async (id, remarks, userId) => {
    const job = await JobRequest.findByPk(id);
    if (!job) throw { statusCode: 404, message: 'Job not found' };
    return updateJobStatusWithHistory(job, 'REJECTED', remarks || 'TM pre-survey rejected', userId);
};

export const toApproveSurvey = async (id, remarks, userId) => {
    const job = await JobRequest.findByPk(id);
    if (!job) throw { statusCode: 404, message: 'Job not found' };
    return updateJobStatusWithHistory(job, 'TO_APPROVED', remarks || 'TO approved survey report', userId);
};

export const toSendBackSurvey = async (id, remarks, userId) => {
    const job = await JobRequest.findByPk(id);
    if (!job) throw { statusCode: 404, message: 'Job not found' };
    const updatedJob = await updateJobStatusWithHistory(job, 'TO_PRE_APPROVED', remarks || 'TO sent report back for correction', userId);
    const jobWithVessel = await JobRequest.findByPk(job.id, { include: ['Vessel'] });
    await notificationService.sendNotification(job.gm_assigned_surveyor_id, 'JOB_SENT_BACK', {
        jobId: job.id,
        vesselName: jobWithVessel.Vessel.vessel_name,
        remarks: remarks || 'Correction needed'
    });
    return updatedJob;
};

export const tmSendBackSurvey = async (id, remarks, userId) => {
    const job = await JobRequest.findByPk(id);
    if (!job) throw { statusCode: 404, message: 'Job not found' };
    const updatedJob = await updateJobStatusWithHistory(job, 'TM_PRE_APPROVED', remarks || 'TM rejected survey and requested rework', userId);
    const jobWithVessel = await JobRequest.findByPk(job.id, { include: ['Vessel'] });
    await notificationService.sendNotification(job.gm_assigned_surveyor_id, 'JOB_SENT_BACK', {
        jobId: job.id,
        vesselName: jobWithVessel.Vessel.vessel_name,
        remarks: remarks || 'Rework requested'
    });
    return updatedJob;
};

export const assignSurveyor = async (jobId, surveyorId, userId) => {
    const job = await JobRequest.findByPk(jobId);
    if (!job) throw { statusCode: 404, message: 'Job not found' };
    if (job.job_status !== 'GM_APPROVED') {
        throw { statusCode: 400, message: 'Surveyor can only be assigned after GM approval' };
    }
    const surveyor = await User.findByPk(surveyorId);
    if (!surveyor || surveyor.role !== 'SURVEYOR') {
        throw { statusCode: 400, message: 'Invalid surveyorId. User must exist with SURVEYOR role.' };
    }
    const oldStatus = job.job_status;
    await job.update({
        gm_assigned_surveyor_id: surveyorId,
        job_status: 'ASSIGNED'
    });

    await JobStatusHistory.create({
        job_id: job.id,
        old_status: oldStatus,
        new_status: 'ASSIGNED',
        changed_by: userId,
        change_reason: `Assigned surveyor ${surveyorId}`
    });
    await AuditLog.create({
        user_id: userId,
        action: 'ASSIGN_SURVEYOR',
        entity_name: 'JobRequest',
        entity_id: job.id,
        old_values: { gm_assigned_surveyor_id: null, job_status: oldStatus },
        new_values: { gm_assigned_surveyor_id: surveyorId, job_status: 'ASSIGNED' },
    });

    const jobWithVessel = await JobRequest.findByPk(job.id, { include: ['Vessel'] });
    await notificationService.sendNotification(surveyorId, 'JOB_ASSIGNED', {
        vesselName: jobWithVessel.Vessel.vessel_name,
        port: jobWithVessel.target_port
    });

    return job;
};

export const reassignSurveyor = async (jobId, surveyorId, reason, userId) => {
    const job = await JobRequest.findByPk(jobId);
    if (!job) throw { statusCode: 404, message: 'Job not found' };
    const surveyor = await User.findByPk(surveyorId);
    if (!surveyor || surveyor.role !== 'SURVEYOR') {
        throw { statusCode: 400, message: 'Invalid surveyorId. User must exist with SURVEYOR role.' };
    }

    const oldSurveyor = job.gm_assigned_surveyor_id;

    await job.update({
        gm_assigned_surveyor_id: surveyorId
    });

    await JobStatusHistory.create({
        job_id: job.id,
        old_status: job.job_status,
        new_status: job.job_status,
        changed_by: userId,
        change_reason: `Reassigned from ${oldSurveyor} to ${surveyorId}: ${reason}`
    });
    await AuditLog.create({
        user_id: userId,
        action: 'REASSIGN_SURVEYOR',
        entity_name: 'JobRequest',
        entity_id: job.id,
        old_values: { gm_assigned_surveyor_id: oldSurveyor },
        new_values: { gm_assigned_surveyor_id: surveyorId, reason: reason || null },
    });

    await notificationService.notifyRoles(['SURVEYOR'], 'Job Reassigned', `Job ${jobId} has been reassigned to you.`);

    return job;
};

export const cancelJob = async (id, reason, userId) => {
    const job = await JobRequest.findByPk(id);
    if (!job) throw { statusCode: 404, message: 'Job not found' };

    // Keep workflow statuses strict; rejected/certified jobs are terminal.
    if (job.job_status === 'CERTIFIED' || job.job_status === 'REJECTED') {
        throw { statusCode: 400, message: 'Cannot cancel a certified or rejected job' };
    }
    return updateJobStatusWithHistory(job, 'REJECTED', reason || 'Job cancelled', userId);
};

export const cancelJobForClient = async (id, reason, clientId, userId) => {
    const job = await JobRequest.findByPk(id, { include: ['Vessel'] });
    if (!job) throw { statusCode: 404, message: 'Job not found' };

    if (job.Vessel.client_id !== clientId) {
        throw { statusCode: 403, message: 'Unauthorized job cancellation' };
    }
    return cancelJob(id, reason, userId);
};

export const holdJob = async (id, reason, userId) => {
    throw { statusCode: 400, message: 'ON_HOLD is not part of the current strict workflow. Use review endpoints instead.' };
};

export const resumeJob = async (id, reason, userId) => {
    throw { statusCode: 400, message: 'Resume is not supported in strict workflow mode.' };
};


export const getJobHistory = async (id) => {
    return await JobStatusHistory.findAll({
        where: { job_id: id },
        order: [['changed_at', 'ASC']],
        include: [{ model: User, attributes: ['name', 'email', 'role'] }]
    });
};

export const addInternalNote = async (jobId, noteText, userId) => {
    return await db.JobNote.create({
        job_id: jobId,
        user_id: userId,
        note_text: noteText,
        is_internal: true
    });
};

export const updatePriority = async (jobId, priority, reason, userId) => {
    const job = await JobRequest.findByPk(jobId);
    if (!job) throw { statusCode: 404, message: 'Job not found' };

    const oldPriority = job.priority;

    await job.update({ priority });

    await db.AuditLog.create({
        user_id: userId,
        action: 'UPDATE_PRIORITY',
        entity_name: 'JobRequest',
        entity_id: job.id,
        old_values: { priority: oldPriority },
        new_values: { priority },
        reason
    });

    return job;
};
