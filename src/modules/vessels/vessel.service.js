import db from '../../models/index.js';

const Vessel = db.Vessel;
const Client = db.Client;

export const createVessel = async (data) => {
    // Check if client exists
    const client = await Client.findByPk(data.client_id || data.vessel_owner_id);
    if (!client) {
        throw { statusCode: 400, message: 'Client not found' };
    }

    // Duplicate check
    const existing = await Vessel.findOne({ where: { imo_number: data.imo_number } });
    if (existing) {
        throw { statusCode: 400, message: 'Vessel with this IMO number already exists' };
    }
    return await Vessel.create(data);
};

export const getVessels = async (query, scopeFilters = {}) => {
    const { page = 1, limit = 10, ...filters } = query;
    const where = { ...filters, ...scopeFilters };

    return await Vessel.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        include: [{ model: Client, as: 'Client' }] // Explicit model reference
    });
};

export const getVesselById = async (id, scopeFilters = {}) => {
    const vessel = await Vessel.findOne({
        where: { id, ...scopeFilters },
        include: [{ model: Client, as: 'Client' }]
    });
    if (!vessel) throw { statusCode: 404, message: 'Vessel not found' };
    return vessel;
};

export const updateVessel = async (id, data, scopeFilters = {}) => {
    const vessel = await getVesselById(id, scopeFilters);

    if (data.imo_number && data.imo_number !== vessel.imo_number) {
        const existing = await Vessel.findOne({ where: { imo_number: data.imo_number } });
        if (existing) {
            throw { statusCode: 400, message: 'Another vessel with this IMO number already exists' };
        }
    }

    return await vessel.update(data);
};
