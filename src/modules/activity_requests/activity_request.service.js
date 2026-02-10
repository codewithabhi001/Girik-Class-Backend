import db from '../../models/index.js';

const ActivityRequest = db.ActivityRequest;
const Vessel = db.Vessel;

export const createActivityRequest = async (data, userId) => {
    const count = await ActivityRequest.count({ paranoid: false });
    const requestNumber = `AR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    return await ActivityRequest.create({
        ...data,
        request_number: requestNumber,
        requested_by: userId,
        status: 'PENDING'
    });
};

export const getActivityRequests = async (query, scopeFilters = {}) => {
    const { page = 1, limit = 10, ...filters } = query;
    return await ActivityRequest.findAll({
        where: { ...filters, ...scopeFilters },
        include: [Vessel, 'LinkedJob'],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: (page - 1) * limit
    });
};

export const getActivityRequestById = async (id, scopeFilters = {}) => {
    const request = await ActivityRequest.findOne({
        where: { id, ...scopeFilters },
        include: [Vessel, 'LinkedJob']
    });
    if (!request) throw { statusCode: 404, message: 'Activity request not found' };
    return request;
};

export const updateActivityStatus = async (id, status, remarks) => {
    const request = await ActivityRequest.findByPk(id);
    if (!request) throw { statusCode: 404, message: 'Activity request not found' };
    return await request.update({ status, remarks });
};
