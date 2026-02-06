import db from '../../models/index.js';

const Vessel = db.Vessel;

export const createVessel = async (data) => {
    return await Vessel.create(data);
};

export const getVessels = async (query) => {
    const { page = 1, limit = 10, ...filters } = query;
    return await Vessel.findAndCountAll({
        where: filters,
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        include: ['Client'] // Include client details
    });
};

export const getVesselById = async (id) => {
    const vessel = await Vessel.findByPk(id, { include: ['Client'] });
    if (!vessel) throw { statusCode: 404, message: 'Vessel not found' };
    return vessel;
};

export const updateVessel = async (id, data) => {
    const vessel = await getVesselById(id);
    return await vessel.update(data);
};
