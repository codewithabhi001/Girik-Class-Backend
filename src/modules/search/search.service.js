import db from '../../models/index.js';

export const globalSearch = async (query, user) => {
    const { q } = query;
    const { Op } = db.Sequelize;

    const results = {
        vessels: [],
        jobs: [],
        certificates: []
    };

    // Scoped Search
    let vesselWhere = {
        [Op.or]: [
            { vessel_name: { [Op.like]: `%${q}%` } },
            { imo_number: { [Op.like]: `%${q}%` } }
        ]
    };

    if (user.role === 'CLIENT') {
        vesselWhere.client_id = user.client_id;
    }

    results.vessels = await db.Vessel.findAll({ where: vesselWhere, limit: 10 });

    results.jobs = await db.JobRequest.findAll({
        where: {
            [Op.or]: [
                { id: { [Op.like]: `%${q}%` } },
                { remarks: { [Op.like]: `%${q}%` } }
            ]
        },
        limit: 10
    });

    results.certificates = await db.Certificate.findAll({
        where: {
            [Op.or]: [
                { certificate_number: { [Op.like]: `%${q}%` } }
            ]
        },
        limit: 10
    });

    return results;
};
