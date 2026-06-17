import db from '../../models/index.js';
import { flatClientListRow } from '../../utils/listRowFlatten.util.js';
import * as authService from '../auth/auth.service.js';

const Client = db.Client;
const User = db.User;
const Vessel = db.Vessel;
const JobRequest = db.JobRequest;
const Certificate = db.Certificate;
const Payment = db.Payment;

const CLIENT_FIELDS = [
    'company_name', 'company_code', 'company_id_number', 'address', 'country', 'email', 'phone',
    'contact_person_name', 'contact_person_email', 'status',
];

export const createClient = async (data) => {
    const { user: userData, ...clientPayload } = data;
    const clientFields = Object.fromEntries(
        CLIENT_FIELDS.filter((k) => clientPayload[k] !== undefined).map((k) => [k, clientPayload[k]])
    );

    if (!userData) {
        return await Client.create(clientFields);
    }

    const result = await db.sequelize.transaction(async (transaction) => {
        const client = await Client.create(clientFields, { transaction });
        const { user } = await authService.register(
            {
                name: userData.name,
                email: userData.email,
                password: userData.password,
                role: userData.role || 'CLIENT',
                phone: userData.phone,
                client_id: client.id,
            },
            { transaction }
        );
        return { client, user };
    });

    return result;
};

export const getClients = async (query) => {
    const { page = 1, limit = 10, search, ...filters } = query;
    const { Op } = db.Sequelize;
    const where = { ...filters };

    if (search) {
        where[Op.or] = [
            { company_name: { [Op.like]: `%${search}%` } },
            { company_code: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } }
        ];
    }

    const result = await Client.findAndCountAll({
        where,
        attributes: [
            'id',
            'company_name',
            'company_code',
            'status',
            'email',
            'created_at'
        ],

        include: [{ model: User, attributes: ['id'] }],
        distinct: true,
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        useReplica: true
    });

    result.rows = result.rows.map(flatClientListRow);

    return result;
};

export const getClientById = async (id, options = {}) => {
    const client = await Client.findByPk(id, options);
    if (!client) throw { statusCode: 404, message: 'Client not found' };
    return client;
};

export const updateClient = async (id, data) => {
    const client = await getClientById(id, { useMaster: true });
    return await client.update(data);
};

export const deleteClient = async (id) => {
    const client = await getClientById(id, { useMaster: true });
    return await client.update({ status: 'INACTIVE' });
};


export const getClientDocuments = async (clientId, user) => {
    if (!clientId) throw { statusCode: 404, message: 'Client not found' };

    const vessels = await Vessel.findAll({ where: { client_id: clientId }, attributes: ['id', 'vessel_name'], useReplica: true });
    const vesselIds = vessels.map(v => v.id);

    const jobs = await JobRequest.findAll({
        where: { vessel_id: vesselIds },
        attributes: ['id'],
        include: [{
            model: db.JobCertificate,
            as: 'certificates',
            attributes: ['id'],
            include: [{ model: db.CertificateType, attributes: ['name'] }]
        }],
        useReplica: true
    });
    const jobIds = jobs.map(j => j.id);

    let allDocs = [];

    if (vesselIds.length > 0) {
        const vesselDocs = await db.VesselDocument.findAll({
            where: { vessel_id: vesselIds },
            attributes: [
                'id',
                'vessel_id',
                'file_url',
                'document_type',
                'description',
                'uploaded_by',
                'created_at',
                'updated_at'
            ],
            order: [['created_at', 'DESC']],
            useReplica: true
        });
        allDocs = allDocs.concat(vesselDocs.map(d => ({
            ...d.toJSON(),
            file_type: null,
            entity_type: 'VESSEL',
            entity_id: d.vessel_id
        })));
    }

    if (jobIds.length > 0) {
        const jobDocs = await db.JobDocument.findAll({
            where: { job_id: jobIds },
            attributes: [
                'id',
                'job_id',
                'required_document_id',
                'file_url',
                'uploaded_by',
                'created_at',
                'updated_at'
            ],
            order: [['created_at', 'DESC']],
            useReplica: true
        });
        allDocs = allDocs.concat(jobDocs.map(d => ({
            ...d.toJSON(),
            file_type: null,
            document_type: null,
            description: null,
            entity_type: 'JOB',
            entity_id: d.job_id
        })));
    }

    // You could also fetch from ActivityPlanning/Checklist if needed
    // Assuming surveys.length > 0 for surveyor docs, but JobDocs should cover most for clients

    // Sort combined docs
    allDocs.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));

    const { processFileAccess } = await import('../../services/fileAccess.service.js');

    const enrichedDocs = await Promise.all(allDocs.map(async (docJson) => {
        const accessInfo = await processFileAccess(docJson, user);

        let entityName = 'Unknown Entity';
        if (docJson.entity_type === 'VESSEL') {
            const v = vessels.find(v => v.id === docJson.entity_id);
            if (v) entityName = `Vessel (${v.vessel_name})`;
        } else if (docJson.entity_type === 'JOB') {
            const j = jobs.find(j => j.id === docJson.entity_id);
            const firstCertType = j?.certificates?.[0]?.CertificateType;
            if (firstCertType) entityName = `Job (${firstCertType.name})`;
        }

        return {
            ...docJson,
            ...accessInfo,
            entity_name: entityName,
            file_url: undefined // hide raw S3 url
        };
    }));

    return enrichedDocs;
};
