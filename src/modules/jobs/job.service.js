import db from '../../models/index.js';
import * as notificationService from '../../services/notification.service.js';

const JobRequest = db.JobRequest;
const JobStatusHistory = db.JobStatusHistory;
const User = db.User;

export const createJob = async (data, user) => {
    const job = await JobRequest.create({
        ...data,
        requested_by_user_id: user.id,
        job_status: 'CREATED'
    });

    await JobStatusHistory.create({
        job_id: job.id,
        old_status: null,
        new_status: 'CREATED',
        changed_by: user.id,
        change_reason: 'Initial creation'
    });

    return job;
};

export const getJobs = async (query, user) => {
    const { page = 1, limit = 10, ...filters } = query;

    const whereClause = { ...filters };
    if (user.role === 'CLIENT') {
        const vessels = await db.Vessel.findAll({ where: { client_id: user.client_id }, attributes: ['id'] });
        const vesselIds = vessels.map(v => v.id);
        whereClause.vessel_id = vesselIds;
    } else if (user.role === 'SURVEYOR') {
        whereClause.gm_assigned_surveyor_id = user.id;
    }

    return await JobRequest.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        include: ['Vessel', 'CertificateType']
    });
};

export const getJobById = async (id) => {
    const job = await JobRequest.findByPk(id, {
        include: ['Vessel', 'CertificateType', 'JobStatusHistory']
    });
    if (!job) throw { statusCode: 404, message: 'Job not found' };
    return job;
};

export const updateJobStatus = async (id, newStatus, remarks, user) => {
    const job = await getJobById(id);
    const oldStatus = job.job_status;

    await job.update({ job_status: newStatus, remarks });

    await JobStatusHistory.create({
        job_id: job.id,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: user.id,
        change_reason: remarks
    });

    return job;
};

export const assignSurveyor = async (jobId, surveyorId, user) => {
    const job = await getJobById(jobId);

    await job.update({
        gm_assigned_surveyor_id: surveyorId,
        job_status: 'ASSIGNED'
    });

    await JobStatusHistory.create({
        job_id: job.id,
        old_status: job.job_status,
        new_status: 'ASSIGNED',
        changed_by: user.id,
        change_reason: `Assigned surveyor ${surveyorId}`
    });

    return job;
}

export const reassignSurveyor = async (jobId, surveyorId, reason, user) => {
    const job = await getJobById(jobId);
    const oldSurveyor = job.gm_assigned_surveyor_id;

    await job.update({
        gm_assigned_surveyor_id: surveyorId
    });

    await JobStatusHistory.create({
        job_id: job.id,
        old_status: job.job_status,
        new_status: job.job_status,
        changed_by: user.id,
        change_reason: `Reassigned from ${oldSurveyor} to ${surveyorId}: ${reason}`
    });

    await notificationService.notifyRoles(['SURVEYOR'], 'Job Reassigned', `Job ${jobId} has been reassigned to you.`);

    return job;
};

export const escalateJob = async (jobId, reason, targetRole, user) => {
    const job = await getJobById(jobId);

    await JobStatusHistory.create({
        job_id: job.id,
        old_status: job.job_status,
        new_status: job.job_status,
        changed_by: user.id,
        change_reason: `ESCALATED to ${targetRole}: ${reason}`
    });

    await notificationService.notifyRoles([targetRole], 'Job Escalation', `Job ${jobId} escalated. Reason: ${reason}`, 'URGENT');

    return job;
};

export const cancelJob = async (id, reason, user) => {
    const job = await getJobById(id);
    if (job.job_status === 'COMPLETED' || job.job_status === 'CANCELLED') {
        throw { statusCode: 400, message: 'Cannot cancel a completed or already cancelled job' };
    }
    return updateJobStatus(id, 'CANCELLED', reason, user);
};

export const holdJob = async (id, reason, user) => {
    const job = await getJobById(id);
    if (job.job_status === 'COMPLETED') throw { statusCode: 400, message: 'Cannot hold a completed job' };

    return updateJobStatus(id, 'ON_HOLD', reason, user);
};

export const resumeJob = async (id, reason, user) => {
    const job = await getJobById(id);
    if (job.job_status !== 'ON_HOLD') throw { statusCode: 400, message: 'Job is not on hold' };

    return updateJobStatus(id, 'IN_PROGRESS', reason, user);
};

export const cloneJob = async (id, user) => {
    const originalJob = await getJobById(id);

    const newJobData = {
        vessel_id: originalJob.vessel_id,
        certificate_type_id: originalJob.certificate_type_id,
        reason: `Clone of Job ${originalJob.job_number || originalJob.id}`,
        target_port: originalJob.target_port,
        target_date: new Date(),
        job_status: 'CREATED',
        requested_by_user_id: user.id
    };

    const newJob = await JobRequest.create(newJobData);

    await JobStatusHistory.create({
        job_id: newJob.id,
        old_status: null,
        new_status: 'CREATED',
        changed_by: user.id,
        change_reason: `Cloned from Job ${originalJob.id}`
    });

    return newJob;
};

export const getJobHistory = async (id) => {
    return await JobStatusHistory.findAll({
        where: { job_id: id },
        order: [['created_at', 'ASC']],
        include: [{ model: User, as: 'Modifier', attributes: ['name', 'email', 'role'] }]
    });
};
