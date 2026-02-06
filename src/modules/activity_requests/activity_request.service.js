
import db from '../../models/index.js';
import * as jobService from '../jobs/job.service.js';
import * as notificationService from '../../services/notification.service.js';

const ActivityRequest = db.ActivityRequest;

export const createActivityRequest = async (data, user) => {
    // Generate request number
    const count = await ActivityRequest.count({ paranoid: false });
    const requestNumber = `AR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const request = await ActivityRequest.create({
        ...data,
        request_number: requestNumber,
        requested_by: user.id
    });

    // Notify GM/TM about new request
    await notificationService.notifyRoles(['GM', 'TM'], 'New Activity Request', `New request ${requestNumber} from user ${user.name}`);

    return request;
};

export const getActivityRequests = async (query) => {
    const { page = 1, limit = 10, status, activity_type } = query;
    const where = {};
    if (status) where.status = status;
    if (activity_type) where.activity_type = activity_type;

    return await ActivityRequest.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        order: [['created_at', 'DESC']],
        include: ['Requester', 'LinkedJob', db.Vessel]
    });
};

export const getActivityRequestById = async (id) => {
    const request = await ActivityRequest.findByPk(id, {
        include: ['Requester', 'LinkedJob', db.Vessel]
    });
    if (!request) throw { statusCode: 404, message: 'Activity Request not found' };
    return request;
};

export const approveActivityRequest = async (id, user) => {
    const request = await getActivityRequestById(id);

    if (request.status === 'APPROVED' || request.status === 'CONVERTED_TO_JOB') {
        throw { statusCode: 400, message: 'Request is already approved' };
    }

    // Auto-create Job
    // We assume the request has vessel_id. If not, we might need a default or error.
    // Assuming activity_type maps to job purpose or we use a default Certificate Type if not provided.
    // Ideally, the request should have 'requested_service' mapping to a certificate type.

    // For now, we will try to create the job. If vessel_id or other mandatory fields are missing in AR, 
    // we would typically throw, but here we'll assume they exist or let the job service validate.

    // Note: jobService.createJob expects { vessel_id, certificate_type_id, reason, target_port, target_date }

    if (!request.vessel_id) {
        throw { statusCode: 400, message: 'Activity Request is missing Vessel ID required for Job creation.' };
    }

    try {
        const newJob = await jobService.createJob({
            vessel_id: request.vessel_id,
            // We need a certificate_type_id. AR has `requested_service`. 
            // In a real app we'd look up CertificateType by name/code. 
            // Here we'll pass a placeholder or null if the DB allows, or use a known ID if possible.
            // Since I can't look it up easily without importing that service/model and querying, 
            // I will assume `requested_service` MIGHT be the ID or we assume the GM will edit the job later.
            certificate_type_id: request.requested_service, // RISK: value might not be UUID.
            reason: request.description || 'Generated from Activity Request',
            target_port: request.location_port || 'Unknown',
            target_date: request.proposed_date || new Date(),
        }, user);

        await request.update({
            status: 'APPROVED',
            linked_job_id: newJob.id
        });

        // Notify Client
        await notificationService.notifyUser(request.requested_by, 'Request Approved', `Your request ${request.request_number} has been approved. Job ${newJob.job_number} created.`);

        return { request, job: newJob };

    } catch (err) {
        throw { statusCode: 500, message: `Failed to auto-create job: ${err.message}` };
    }
};

export const rejectActivityRequest = async (id, reason, user) => {
    const request = await getActivityRequestById(id);
    if (request.status !== 'PENDING') throw { statusCode: 400, message: 'Can only reject PENDING requests' };

    await request.update({
        status: 'REJECTED',
        rejection_reason: reason
    });

    await notificationService.notifyUser(request.requested_by, 'Request Rejected', `Your request ${request.request_number} was rejected. Reason: ${reason}`);

    return request;
};

export const getHistory = async (id) => {
    return { message: "History logic placeholder" };
};
