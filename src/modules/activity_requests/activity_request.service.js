import db from '../../models/index.js';
import { flatActivityRequestListRow, flatActivityRequestDetailRow } from '../../utils/listRowFlatten.util.js';
import * as fileAccessService from '../../services/fileAccess.service.js';
import * as jobService from '../jobs/job.service.js';
import * as notificationService from '../../services/notification.service.js';

const ActivityRequest = db.ActivityRequest;
const Vessel = db.Vessel;

const activityRequestVesselInclude = {
    model: Vessel,
    attributes: [
        'id', 'vessel_name', 'imo_number', 'call_sign', 'mmsi_number',
        'port_of_registry', 'year_built', 'ship_type', 'gross_tonnage',
        'net_tonnage', 'deadweight', 'class_status', 'current_class_society',
        'engine_type', 'client_id', 'flag_administration_id',
    ],
    include: [
        { model: db.FlagAdministration, as: 'FlagAdministration', attributes: ['flag_state_name'] },
        { model: db.Client, as: 'Client', attributes: ['company_name', 'company_code'] },
    ],
};

const enrichAttachments = async (attachments, user = null) => {
    const urls = Array.isArray(attachments) ? attachments : [];
    return Promise.all(urls.map(async (fileUrl) => {
        const { fileName, signedUrl } = await fileAccessService.processFileAccess({ file_url: fileUrl }, user);
        return { filename: fileName, signedUrl };
    }));
};

export const createActivityRequest = async (data, userId, user = null) => {
    const count = await ActivityRequest.count({ paranoid: false, useMaster: true });
    const requestNumber = `AR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const created = await ActivityRequest.create({
        ...data,
        request_number: requestNumber,
        requested_by: userId,
        status: 'PENDING',
    });

    return getActivityRequestById(created.id, {}, user, { useMaster: true });
};

export const getActivityRequests = async (query, scopeFilters = {}) => {
    const { page = 1, limit = 10, ...filters } = query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageLimit = Math.max(1, parseInt(limit, 10));
    const { count, rows } = await ActivityRequest.findAndCountAll({
        where: { ...filters, ...scopeFilters },
        attributes: ['id', 'request_number', 'activity_type', 'requested_service', 'proposed_date', 'location_port', 'status', 'vessel_id', 'created_at'],
        include: [
            {
                model: Vessel,
                attributes: ['id', 'vessel_name', 'imo_number'],
            },
            { model: db.JobRequest, as: 'LinkedJob', attributes: ['id', 'job_status', 'job_request_number'] },
        ],
        order: [['created_at', 'DESC']],
        limit: pageLimit,
        offset: (pageNum - 1) * pageLimit,
        useReplica: true
    });
    return {
        total: count,
        page: pageNum,
        limit: pageLimit,
        totalPages: Math.ceil(count / pageLimit),
        rows: rows.map(flatActivityRequestListRow),
    };
};

export const getActivityRequestById = async (id, scopeFilters = {}, user = null, options = {}) => {
    const request = await ActivityRequest.findOne({
        where: { id, ...scopeFilters },
        include: [
            { model: db.User, as: 'Requester', attributes: ['id', 'name', 'email'] },
            activityRequestVesselInclude,
            {
                model: db.JobRequest,
                as: 'LinkedJob',
                attributes: ['id', 'job_status', 'reason', 'job_request_number']
            }
        ],
        ...options
    });
    if (!request) throw { statusCode: 404, message: 'Activity request not found' };

    const plain = request.get({ plain: true });
    plain.attachments = await enrichAttachments(plain.attachments, user);
    return flatActivityRequestDetailRow(plain);
};

export const updateActivityStatus = async (id, status, remarks, user = null) => {
    if (status === 'CONVERTED_TO_JOB') {
        throw {
            statusCode: 400,
            message: 'Use POST /api/v1/activity-requests/:id/convert-to-job to create a linked job.',
        };
    }
    const request = await ActivityRequest.findByPk(id, { useMaster: true });
    if (!request) throw { statusCode: 404, message: 'Activity request not found' };
    if (request.status === 'CONVERTED_TO_JOB') {
        throw { statusCode: 400, message: 'Cannot change status of an activity request already converted to a job.' };
    }
    await request.update({
        status,
        rejection_reason: status === 'REJECTED' ? remarks : request.rejection_reason,
    });
    return getActivityRequestById(id, {}, user, { useMaster: true });
};

/** Prefer non-empty override; otherwise use fallback (ignores blank strings). */
const pickNonEmpty = (override, fallback) => {
    if (override != null && String(override).trim() !== '') return String(override).trim();
    if (fallback != null && String(fallback).trim() !== '') return fallback;
    return null;
};

const mapActivityPriorityToJob = (priority) => {
    const map = { LOW: 'LOW', MEDIUM: 'NORMAL', HIGH: 'HIGH', URGENT: 'URGENT' };
    return map[priority] || 'NORMAL';
};

const buildDefaultJobReason = (activity) => {
    const parts = [activity.requested_service, activity.description].filter((s) => s && String(s).trim());
    if (parts.length) return parts.join(' — ');
    return `Converted from activity request ${activity.request_number}`;
};

const flatConvertedJobSummary = (job, bodyCertTypeId = null) => ({
    id: job.id,
    job_request_number: job.job_request_number,
    job_status: job.job_status,
    vessel_id: job.vessel_id,
    certificate_type_id: bodyCertTypeId,
    target_port: job.target_port,
    target_date: job.target_date,
    priority: job.priority,
    reason: job.reason,
    source_activity_request_id: job.source_activity_request_id,
});

/**
 * Convert an APPROVED activity request into a job request.
 * Body mirrors POST /jobs; vessel/port/date/reason default from the activity row when omitted.
 */
export const convertActivityRequestToJob = async (id, body, userId, scopeFilters = {}, user = null) => {
    const txn = await db.sequelize.transaction();
    let job;
    let certificateTypeId;
    try {
        const activity = await ActivityRequest.findOne({
            where: { id, ...scopeFilters },
            transaction: txn,
            lock: txn.LOCK.UPDATE,
        });
        if (!activity) throw { statusCode: 404, message: 'Activity request not found' };

        if (activity.status !== 'APPROVED') {
            throw {
                statusCode: 400,
                message: `Only APPROVED activity requests can be converted to a job. Current status: ${activity.status}`,
            };
        }
        if (activity.linked_job_id) {
            throw { statusCode: 409, message: 'This activity request is already linked to a job' };
        }

        const vesselId = pickNonEmpty(body.vessel_id, activity.vessel_id);
        if (!vesselId) {
            throw {
                statusCode: 400,
                message: 'Vessel is required. Set vessel_id on the activity request or pass vessel_id in the convert body.',
            };
        }

        const targetPort = pickNonEmpty(body.target_port, activity.location_port);
        if (!targetPort) {
            throw {
                statusCode: 400,
                message: 'Target port is required. Pass target_port or set location_port on the activity request.',
            };
        }

        const targetDate = pickNonEmpty(body.target_date, activity.proposed_date);
        if (!targetDate) {
            throw {
                statusCode: 400,
                message: 'Target date is required. Pass target_date or set proposed_date on the activity request.',
            };
        }

        certificateTypeId = body.certificate_type_id || (body.certificates && body.certificates[0]?.certificate_type_id);
        const jobData = {
            vessel_id: vesselId,
            certificates: body.certificates,
            certificate_type_id: body.certificate_type_id,
            source_activity_request_id: activity.id,
            reason: pickNonEmpty(body.reason, null) || buildDefaultJobReason(activity),
            target_port: targetPort,
            target_date: targetDate,
            priority: pickNonEmpty(body.priority, null) || mapActivityPriorityToJob(activity.priority),
            uploaded_documents: body.uploaded_documents,
            remarks: pickNonEmpty(body.remarks, null) || `Converted from ${activity.request_number}`,
        };

        job = await jobService.createJob(jobData, userId, {
            transaction: txn,
            requestedByUserId: activity.requested_by,
            statusHistoryReason: `Converted from activity request ${activity.request_number}`,
            skipNotifications: true,
            skipMandatoryDocumentCheck: false,
        });

        await activity.update({
            linked_job_id: job.id,
            status: 'CONVERTED_TO_JOB',
        }, { transaction: txn });

        await txn.commit();
    } catch (err) {
        await txn.rollback();
        throw err;
    }

    try {
        const jobWithVessel = await db.JobRequest.findByPk(job.id, { include: ['Vessel'], useMaster: true });
        notificationService.notifyRoles(['ADMIN', 'GM', 'TM'], 'JOB_CREATED', {
            vesselName: jobWithVessel.Vessel?.vessel_name,
            port: jobWithVessel.target_port,
        });
        const clientUser = await db.User.findOne({
            where: { client_id: jobWithVessel.Vessel?.client_id, role: 'CLIENT' },
            useMaster: true
        });
        if (clientUser) {
            notificationService.sendNotification(clientUser.id, 'JOB_CREATED', {
                vesselName: jobWithVessel.Vessel?.vessel_name,
                port: jobWithVessel.target_port,
            });
        }
    } catch {
        // Notifications are best-effort after successful conversion
    }

    const activityRequest = await getActivityRequestById(id, scopeFilters, user, { useMaster: true });

    return {
        activity_request: activityRequest,
        job: flatConvertedJobSummary(job, certificateTypeId),
    };
};
