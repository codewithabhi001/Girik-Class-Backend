import db from '../../models/index.js';

export const globalSearch = async (query, user) => {
    let { q } = query;
    if (!q || q.trim().length < 2) throw { statusCode: 400, message: 'Search query must be at least 2 characters.' };
    q = q.trim().replace(/[%_]/g, '\\$&');
    const { Op } = db.Sequelize;

    const results = {
        vessels: [],
        jobs: [],
        certificates: []
    };

    // Scoped Search
    // Scoped Search
    let vesselWhere = {
        [Op.or]: [
            { vessel_name: { [Op.like]: `%${q}%` } },
            { imo_number: { [Op.like]: `%${q}%` } }
        ]
    };

    let jobWhere = {
        [Op.or]: [
            { id: { [Op.like]: `%${q}%` } },
            { remarks: { [Op.like]: `%${q}%` } }
        ]
    };

    let certWhere = {
        certificate_number: { [Op.like]: `%${q}%` }
    };

    const vesselInclude = [];

    const certInclude = [];

    if (user.role === 'CLIENT') {
        vesselWhere.client_id = user.client_id;
        // For CLIENT, we might also want to restrict Jobs and Certs to their vessels,
        // but current logic only restricts Vessels. Preserving existing pattern for CLIENT unless requested.
    }

    if (user.role === 'SURVEYOR') {
        // Surveyor sees Vessels they have jobs on
        vesselInclude.push({
            model: db.JobRequest,
            attributes: [],
            where: { assigned_surveyor_id: user.id },
            required: true
        });

        // Surveyor sees only their assigned Jobs
        jobWhere.assigned_surveyor_id = user.id;

        // Surveyor sees Certificates linked to Vessels they have jobs on
        // Logic: Certificate -> belongsTo Vessel -> hasMany JobRequest (where surveyor matches)
        certInclude.push({
            model: db.Vessel,
            attributes: [],
            required: true,
            include: [{
                model: db.JobRequest,
                attributes: [],
                where: { assigned_surveyor_id: user.id },
                required: true
            }]
        });
    }

    results.vessels = await db.Vessel.findAll({
        where: vesselWhere,
        include: vesselInclude,
        limit: 10
    });

    results.jobs = await db.JobRequest.findAll({
        where: jobWhere,
        limit: 10
    });

    results.certificates = await db.Certificate.findAll({
        where: certWhere,
        include: certInclude,
        limit: 10,
        subQuery: false
    });

    return results;
};
