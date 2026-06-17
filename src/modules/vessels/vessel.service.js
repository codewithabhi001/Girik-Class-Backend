import db from '../../models/index.js';
import { VESSEL_CLASS_STATUSES } from '../../constants/statuses.js';
import { buildFullStatusCounts } from '../../utils/statusCount.util.js';
import { flatVesselListRow } from '../../utils/listRowFlatten.util.js';
import * as fileAccessService from '../../services/fileAccess.service.js';
import axios from 'axios';
import env from '../../config/env.js';


const enrichVesselUploadedDocuments = async (docs, user = null) => {
    return Promise.all(docs.map(async (doc) => {
        const plain = doc.get ? doc.get({ plain: true }) : doc;
        const { fileName, signedUrl } = await fileAccessService.processFileAccess(plain, user);
        return {
            id: plain.id,
            document_type: plain.document_type,
            description: plain.description ?? null,
            createdAt: plain.createdAt ?? plain.created_at,
            filename: fileName,
            signedUrl
        };
    }));
};

const Vessel = db.Vessel;
const Client = db.Client;
const FlagAdministration = db.FlagAdministration;

const ensureValidFlag = async (flagId) => {
    if (!flagId) return;
    const flag = await FlagAdministration.findOne({
        where: { id: flagId, status: 'ACTIVE' }
    });
    if (!flag) {
        throw { statusCode: 400, message: `Invalid or inactive flag administration (ID: ${flagId}).` };
    }
};

/**
 * Returns a distinct list of all vessel ship_type values.
 * Supports optional ?search= query to filter by name.
 */
export const getVesselTypes = async (search = null) => {
    const { Op } = db.Sequelize;
    const where = { ship_type: { [Op.ne]: null } };
    if (search) {
        where.ship_type = { [Op.and]: [{ [Op.ne]: null }, { [Op.like]: `%${search}%` }] };
    }

    const rows = await Vessel.findAll({
        where,
        attributes: [[db.sequelize.fn('DISTINCT', db.sequelize.col('ship_type')), 'ship_type']],
        raw: true,
        order: [['ship_type', 'ASC']],
        useReplica: true,
    });

    return rows.map((r) => r.ship_type).filter(Boolean);
};

export const createVessel = async (data, userId) => {
    // Check if client exists
    const client = await Client.findByPk(data.client_id || data.vessel_owner_id, { useMaster: true });
    if (!client) {
        throw { statusCode: 400, message: 'Client not found' };
    }

    // Duplicate check
    const existing = await Vessel.findOne({ where: { imo_number: data.imo_number }, useMaster: true });
    if (existing) {
        throw { statusCode: 400, message: 'Vessel with this IMO number already exists' };
    }
    await ensureValidFlag(data.flag_administration_id);

    const { uploaded_documents, ...vesselData } = data;
    const txn = await db.sequelize.transaction();
    try {
        const vessel = await Vessel.create(vesselData, { transaction: txn });

        if (uploaded_documents && uploaded_documents.length > 0) {
            const docsToCreate = uploaded_documents.map(doc => ({
                vessel_id: vessel.id,
                file_url: doc.file_url,
                document_type: doc.document_type || 'OTHER',
                description: doc.description || '',
                uploaded_by: userId
            }));
            await db.VesselDocument.bulkCreate(docsToCreate, { transaction: txn });
        }

        await txn.commit();
        return vessel;
    } catch (error) {
        await txn.rollback();
        throw error;
    }
};

export const getVessels = async (query, scopeFilters = {}, userRole = null) => {
    const { page = 1, limit = 10, search, ...filters } = query;
    const { Op } = db.Sequelize;
    const where = { ...filters, ...scopeFilters };
    if (search) {
        where.vessel_name = { [Op.like]: `%${search}%` };
    }

    const { count, rows } = await Vessel.findAndCountAll({
        where,
        attributes: ['id', 'vessel_name', 'imo_number', 'ship_type', 'class_status', 'client_id', 'flag_administration_id', 'gross_tonnage', 'created_at'],
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        include: [
            { model: Client, as: 'Client', attributes: ['id', 'company_name', 'company_code', 'status'] },
            { model: FlagAdministration, as: 'FlagAdministration', attributes: ['flag_state_name'] }
        ],
        order: [['created_at', 'DESC']],
        useReplica: true
    });

    // Calculate status counts
    const statusWhere = { ...where };
    delete statusWhere.class_status;
    const statusCounts = await Vessel.findAll({
        where: statusWhere,
        attributes: [
            ['class_status', 'status'],
            [db.sequelize.fn('COUNT', db.sequelize.col('class_status')), 'count']
        ],
        group: ['class_status'],
        raw: true,
        useReplica: true
    });

    return {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
        status_counts: buildFullStatusCounts(statusCounts, VESSEL_CLASS_STATUSES),
        rows: rows.map(flatVesselListRow),
    };
};

export const getVesselById = async (id, scopeFilters = {}, user = null) => {
    if (!id) throw { statusCode: 400, message: 'Vessel ID is required' };
    const vessel = await Vessel.findOne({
        where: { id, ...scopeFilters },
        include: [
            { model: Client, as: 'Client' },
            { model: FlagAdministration, as: 'FlagAdministration', attributes: ['flag_state_name'] },
            {
                model: db.VesselDocument,
                as: 'Documents',
                include: [{ model: db.User, as: 'Uploader', attributes: ['id', 'name'] }]
            }
        ]
    });
    if (!vessel) throw { statusCode: 404, message: 'Vessel not found' };

    const vesselPlain = vessel.get({ plain: true });

    vesselPlain.uploaded_documents = vesselPlain.Documents?.length
        ? await enrichVesselUploadedDocuments(vesselPlain.Documents, user)
        : [];

    delete vesselPlain.Documents; // remove raw DB nested object if needed, or keep it, replacing is cleaner.

    return vesselPlain;
};

export const getVesselsByClientId = async (clientId) => {
    // Check if client exists
    const client = await Client.findByPk(clientId);
    if (!client) {
        throw { statusCode: 404, message: 'Client not found' };
    }

    const vessels = await Vessel.findAll({
        where: { client_id: clientId },
        attributes: ['id', 'vessel_name', 'imo_number', 'ship_type', 'class_status', 'client_id', 'flag_administration_id', 'gross_tonnage', 'created_at'],
        include: [
            {
                model: Client,
                as: 'Client',
                attributes: ['id', 'company_name', 'company_code', 'status']
            },
            {
                model: FlagAdministration,
                as: 'FlagAdministration',
                attributes: ['flag_state_name']
            }
        ],
        order: [['created_at', 'DESC']],
        useReplica: true
    });

    return {
        client_id: client.id,
        client_name: client.company_name,
        client_code: client.company_code,
        client_email: client.email,
        client_phone: client.phone,
        client_status: client.status,
        count: vessels.length,
        rows: vessels.map(flatVesselListRow),
    };
};

export const updateVessel = async (id, data, scopeFilters = {}, userId = null) => {
    if (!id) throw { statusCode: 400, message: 'Vessel ID is required for update' };
    // We use Vessel.findOne to get the Sequelize instance for .update()
    const vesselQuery = await Vessel.findOne({
        where: { id, ...scopeFilters },
        useMaster: true
    });

    if (!vesselQuery) {
        throw { statusCode: 404, message: 'Vessel not found' };
    }

    if (data.imo_number && data.imo_number !== vesselQuery.imo_number) {
        const existing = await Vessel.findOne({ where: { imo_number: data.imo_number }, useMaster: true });
        if (existing) {
            throw { statusCode: 400, message: 'Another vessel with this IMO number already exists' };
        }
    }
    if (data.flag_administration_id) {
        await ensureValidFlag(data.flag_administration_id);
    }

    const { uploaded_documents, ...updateData } = data;
    const txn = await db.sequelize.transaction();

    try {
        await vesselQuery.update(updateData, { transaction: txn });

        if (uploaded_documents && uploaded_documents.length > 0) {
            const docsToCreate = uploaded_documents.map(doc => ({
                vessel_id: vesselQuery.id,
                file_url: doc.file_url,
                document_type: doc.document_type || 'OTHER',
                description: doc.description || '',
                uploaded_by: userId
            }));
            await db.VesselDocument.bulkCreate(docsToCreate, { transaction: txn });
        }

        await txn.commit();
        return vesselQuery;
    } catch (error) {
        await txn.rollback();
        throw error;
    }
};

export const lookupVesselByImo = async (imoNumber) => {
    if (!imoNumber || !/^\d{7}$/.test(imoNumber)) {
        throw { statusCode: 400, message: 'Invalid IMO number format. Must be 7 digits.' };
    }

    const apiKey = env.vesselApiKey;
    if (!apiKey) {
        throw { statusCode: 500, message: 'Vessel API key is not configured.' };
    }

    try {
        const response = await axios.get(`https://api.vesselapi.com/v1/vessel/${imoNumber}?filter.idType=imo`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        const data = response.data;
        if (!data || !data.vessel) {
            throw { statusCode: 404, message: 'Vessel not found in external registry.' };
        }

        const extVessel = data.vessel;

        // Try to match Flag Administration
        let flag_administration_id = null;
        if (extVessel.country) {
            const countryLower = extVessel.country.toLowerCase().trim();
            let flag = await db.FlagAdministration.findOne({
                where: {
                    status: 'ACTIVE',
                    [db.Sequelize.Op.or]: [
                        db.Sequelize.where(
                            db.Sequelize.fn('lower', db.Sequelize.col('country')),
                            countryLower
                        ),
                        db.Sequelize.where(
                            db.Sequelize.fn('lower', db.Sequelize.col('flag_state_name')),
                            { [db.Sequelize.Op.like]: `%${countryLower}%` }
                        )
                    ]
                }
            });
            
            if (!flag) {
                // Dynamically create the flag administration
                const newFlagStateName = `${extVessel.country} Shipping Registry`;
                flag = await db.FlagAdministration.create({
                    flag_state_name: newFlagStateName,
                    country: extVessel.country,
                    authority_name: `${extVessel.country} Maritime Authority`,
                    contact_email: `administration@${extVessel.country.toLowerCase().replace(/[^a-z0-9]/g, '')}.gov`,
                    status: 'ACTIVE'
                });
            }

            if (flag) {
                flag_administration_id = flag.id;
            }
        }

        return {
            vessel_name: extVessel.name ? extVessel.name.toUpperCase() : '',
            imo_number: String(extVessel.imo),
            mmsi_number: extVessel.mmsi ? String(extVessel.mmsi) : '',
            call_sign: extVessel.call_sign || '',
            ship_type: extVessel.vessel_type || '',
            year_built: extVessel.year_built || null,
            gross_tonnage: extVessel.gross_tonnage || null,
            net_tonnage: null,
            deadweight: extVessel.deadweight_tonnage || null,
            port_of_registry: extVessel.home_port || '',
            current_class_society: extVessel.class_society || '',
            engine_type: extVessel.engine_model_name || '',
            builder_name: extVessel.builder || '',
            flag_administration_id,
            external_flag: extVessel.country || ''
        };

    } catch (error) {
        if (error.statusCode) throw error;
        console.error('Error looking up vessel from API:', error.message);
        throw { 
            statusCode: error.response?.status || 500, 
            message: error.response?.data?.error?.message || 'Error fetching vessel details from external registry.' 
        };
    }
};
