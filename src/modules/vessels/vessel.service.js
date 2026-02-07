import db from '../../models/index.js';

const Vessel = db.Vessel;
const Client = db.Client;

export const createVessel = async (data) => {
    // Check if client exists
    const client = await Client.findByPk(data.client_id);
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

export const getVessels = async (query, user) => {
    const { page = 1, limit = 10, ...filters } = query;
    const where = { ...filters };

    // Multi-tenancy: If role is CLIENT, only show their own vessels
    if (user.role === 'CLIENT') {
        where.client_id = user.client_id;
    }

    return await Vessel.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        include: ['Client'] // Include client details
    });
};

export const getVesselById = async (id, user) => {
    const where = { id };

    // Restriction for CLIENT role
    if (user.role === 'CLIENT') {
        where.client_id = user.client_id;
    }

    const vessel = await Vessel.findOne({ where, include: ['Client'] });
    if (!vessel) throw { statusCode: 404, message: 'Vessel not found' };
    return vessel;
};

export const updateVessel = async (id, data) => {
    const vessel = await getVesselById(id);

    if (data.imo_number && data.imo_number !== vessel.imo_number) {
        const existing = await Vessel.findOne({ where: { imo_number: data.imo_number } });
        if (existing) {
            throw { statusCode: 400, message: 'Another vessel with this IMO number already exists' };
        }
    }

    return await vessel.update(data);
};
