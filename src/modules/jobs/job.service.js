import db from '../../models/index.js';
import * as notificationService from '../../services/notification.service.js';

const JobRequest = db.JobRequest;
const JobStatusHistory = db.JobStatusHistory;
const User = db.User;

export const createJob = async (data, userId) => {
    const job = await JobRequest.create({
        ...data,
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

    return job;
};

export const createJobForClient = async (data, clientId, userId) => {
    const vessel = await db.Vessel.findOne({ where: { id: data.vessel_id, client_id: clientId } });
    if (!vessel) throw { statusCode: 403, message: 'Unauthorized vessel selection' };
    return createJob(data, userId);
};

export const getJobs = async (query, scopeFilters = {}) => {
    const { page = 1, limit = 10, ...filters } = query;
    const whereClause = { ...filters, ...scopeFilters };

    return await JobRequest.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        include: ['Vessel', 'CertificateType']
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

    const oldStatus = job.job_status;

    await job.update({ job_status: newStatus, remarks });

    await JobStatusHistory.create({
        job_id: job.id,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: userId,
        change_reason: remarks
    });

    return job;
};

export const assignSurveyor = async (jobId, surveyorId, userId) => {
    const job = await JobRequest.findByPk(jobId);
    if (!job) throw { statusCode: 404, message: 'Job not found' };

    await job.update({
        gm_assigned_surveyor_id: surveyorId,
        job_status: 'ASSIGNED'
    });

    await JobStatusHistory.create({
        job_id: job.id,
        old_status: job.job_status,
        new_status: 'ASSIGNED',
        changed_by: userId,
        change_reason: `Assigned surveyor ${surveyorId}`
    });

    return job;
};

export const reassignSurveyor = async (jobId, surveyorId, reason, userId) => {
    const job = await JobRequest.findByPk(jobId);
    if (!job) throw { statusCode: 404, message: 'Job not found' };

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

    await notificationService.notifyRoles(['SURVEYOR'], 'Job Reassigned', `Job ${jobId} has been reassigned to you.`);

    return job;
};

export const escalateJob = async (jobId, reason, targetRole, userId) => {
    const job = await JobRequest.findByPk(jobId);
    if (!job) throw { statusCode: 404, message: 'Job not found' };

    await JobStatusHistory.create({
        job_id: job.id,
        old_status: job.job_status,
        new_status: job.job_status,
        changed_by: userId,
        change_reason: `ESCALATED to ${targetRole}: ${reason}`
    });

    await notificationService.notifyRoles([targetRole], 'Job Escalation', `Job ${jobId} escalated. Reason: ${reason}`, 'URGENT');

    return job;
};

export const cancelJob = async (id, reason, userId) => {
    const job = await JobRequest.findByPk(id);
    if (!job) throw { statusCode: 404, message: 'Job not found' };

    if (job.job_status === 'COMPLETED' || job.job_status === 'CANCELLED') {
        throw { statusCode: 400, message: 'Cannot cancel a completed or already cancelled job' };
    }
    return updateJobStatus(id, 'CANCELLED', reason, userId);
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
    const job = await JobRequest.findByPk(id);
    if (!job) throw { statusCode: 404, message: 'Job not found' };

    if (job.job_status === 'COMPLETED') throw { statusCode: 400, message: 'Cannot hold a completed job' };

    return updateJobStatus(id, 'ON_HOLD', reason, userId);
};

export const resumeJob = async (id, reason, userId) => {
    const job = await JobRequest.findByPk(id);
    if (!job) throw { statusCode: 404, message: 'Job not found' };

    if (job.job_status !== 'ON_HOLD') throw { statusCode: 400, message: 'Job is not on hold' };

    return updateJobStatus(id, 'IN_PROGRESS', reason, userId);
};

export const cloneJob = async (id, userId) => {
    const originalJob = await JobRequest.findByPk(id);
    if (!originalJob) throw { statusCode: 404, message: 'Job not found' };

    const newJobData = {
        vessel_id: originalJob.vessel_id,
        certificate_type_id: originalJob.certificate_type_id,
        reason: `Clone of Job ${originalJob.job_number || originalJob.id}`,
        target_port: originalJob.target_port,
        target_date: new Date(),
        job_status: 'CREATED',
        requested_by_user_id: userId
    };

    const newJob = await JobRequest.create(newJobData);

    await JobStatusHistory.create({
        job_id: newJob.id,
        old_status: null,
        new_status: 'CREATED',
        changed_by: userId,
        change_reason: `Cloned from Job ${originalJob.id}`
    });

    return newJob;
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
