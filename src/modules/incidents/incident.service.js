import db from '../../models/index.js';

const Incident = db.Incident;
const Vessel = db.Vessel;

export const reportIncident = async (data, userId, clientId) => {
    // If clientId is provided (from CLIENT role), ensure vessel belongs to them
    if (clientId) {
        const vessel = await Vessel.findOne({ where: { id: data.vessel_id, client_id: clientId } });
        if (!vessel) throw { statusCode: 403, message: 'Unauthorized vessel selection' };
    }

    return await Incident.create({
        ...data,
        reported_by: userId,
        status: 'OPEN'
    });
};

export const getIncidents = async (query, scopeFilters = {}) => {
    const { page = 1, limit = 10, ...filters } = query;
    return await Incident.findAll({
        where: { ...filters, ...scopeFilters },
        include: [Vessel],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: (page - 1) * limit
    });
};

export const getIncidentById = async (id, scopeFilters = {}) => {
    const incident = await Incident.findOne({
        where: { id, ...scopeFilters },
        include: [Vessel]
    });
    if (!incident) throw { statusCode: 404, message: 'Incident not found' };
    return incident;
};

export const updateIncidentStatus = async (id, status, remarks) => {
    const incident = await Incident.findByPk(id);
    if (!incident) throw { statusCode: 404, message: 'Incident not found' };
    return await incident.update({ status, remarks });
};
