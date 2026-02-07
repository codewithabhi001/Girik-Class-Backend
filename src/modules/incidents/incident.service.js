import db from '../../models/index.js';

const { Incident, User } = db;

export const createIncident = async (data) => {
    return await Incident.create({
        incident_type: data.incident_type,
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        reported_by: data.reported_by,
        description: data.description,
        severity: data.severity || 'MEDIUM',
        status: 'OPEN'
    });
};

export const getIncidents = async (filters = {}) => {
    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.severity) where.severity = filters.severity;
    if (filters.entity_type) where.entity_type = filters.entity_type;

    return await Incident.findAll({
        where,
        include: [{ model: User, as: 'reporter', attributes: ['id', 'name', 'email'] }],
        order: [['created_at', 'DESC']]
    });
};

export const resolveIncident = async (id, resolvedBy, resolution) => {
    const incident = await Incident.findByPk(id);
    if (!incident) throw new Error('Incident not found');

    return await incident.update({
        status: 'RESOLVED',
        resolved_by: resolvedBy,
        resolution_notes: resolution,
        resolved_at: new Date()
    });
};
