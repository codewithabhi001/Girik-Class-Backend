import db from '../../models/index.js';
import {
    flatSearchCertificateRow,
    flatSearchJobRow,
    flatSearchVesselRow,
} from '../../utils/listRowFlatten.util.js';

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
    let vesselWhere = {
        [Op.or]: [
            { vessel_name: { [Op.like]: `%${q}%` } },
            { imo_number: { [Op.like]: `%${q}%` } }
        ]
    };

    let jobWhere = {
        [Op.or]: [
            { id: { [Op.like]: `%${q}%` } },
            { job_request_number: { [Op.like]: `%${q}%` } },
            { remarks: { [Op.like]: `%${q}%` } }
        ]
    };

    let certWhere = {
        certificate_number: { [Op.like]: `%${q}%` }
    };

    const vesselInclude = [];
    const certInclude = [];
    let clientVesselIds = null;

    // CLIENT role: Get all vessel IDs for the client to filter jobs and certificates
    if (user.role === 'CLIENT') {
        vesselWhere.client_id = user.client_id;

        // Get all vessel IDs for this client to filter jobs and certificates
        const clientVessels = await db.Vessel.findAll({
            where: { client_id: user.client_id },
            attributes: ['id'],
            raw: true,
            useReplica: true
        });
        clientVesselIds = clientVessels.map(v => v.id);

        // Filter jobs to only show client's vessels' jobs
        if (clientVesselIds.length > 0) {
            jobWhere.vessel_id = { [Op.in]: clientVesselIds };
        } else {
            // No vessels, return empty jobs
            jobWhere = { id: null }; // Force empty result
        }

        // Filter certificates to only show client's vessels' certificates
        if (clientVesselIds.length > 0) {
            certWhere.vessel_id = { [Op.in]: clientVesselIds };
        } else {
            // No vessels, return empty certificates
            certWhere = { id: null }; // Force empty result
        }
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

    const vessels = await db.Vessel.findAll({
        where: vesselWhere,
        include: vesselInclude,
        attributes: ['id', 'vessel_name', 'imo_number', 'client_id'],
        limit: 10,
        useReplica: true
    });

    const jobs = await db.JobRequest.findAll({
        where: jobWhere,
        attributes: ['id', 'job_request_number', 'job_status', 'vessel_id', 'created_at'],
        include: [{ model: db.Vessel, attributes: ['vessel_name', 'imo_number'] }],
        limit: 10,
        useReplica: true
    });

    const certificates = await db.Certificate.findAll({
        where: certWhere,
        include: certInclude,
        attributes: ['id', 'certificate_number', 'vessel_id', 'status', 'expiry_date'],
        limit: 10,
        subQuery: false,
        useReplica: true
    });

    return {
        vessels: vessels.map(flatSearchVesselRow),
        jobs: jobs.map(flatSearchJobRow),
        certificates: certificates.map(flatSearchCertificateRow),
    };
};
