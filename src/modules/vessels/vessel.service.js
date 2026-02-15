import db from '../../models/index.js';

const Vessel = db.Vessel;
const Client = db.Client;
const FlagAdministration = db.FlagAdministration;

const ensureValidFlag = async (flagState) => {
    if (!flagState) return;
    const flag = await FlagAdministration.findOne({
        where: { flag_name: flagState, status: 'ACTIVE' }
    });
    if (!flag) {
        throw { statusCode: 400, message: `Invalid flag_state "${flagState}". Use an active flag profile.` };
    }
};

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
    await ensureValidFlag(data.flag_state);
    return await Vessel.create(data);
};

export const getVessels = async (query, scopeFilters = {}, userRole = null) => {
    const { page = 1, limit = 10, ...filters } = query;
    const where = { ...filters, ...scopeFilters };

    // For CLIENT role, return paginated vessels as before
    if (userRole === 'CLIENT') {
        return await Vessel.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: (page - 1) * limit,
            include: [{ model: Client, as: 'Client' }],
            order: [['created_at', 'DESC']]
        });
    }

    // For other roles, group by company name
    const vessels = await Vessel.findAll({
        where,
        include: [{
            model: Client,
            as: 'Client',
            attributes: ['id', 'company_name', 'company_code', 'email', 'phone', 'status']
        }],
        order: [['created_at', 'DESC']]
    });

    // Group vessels by company
    const groupedByCompany = vessels.reduce((acc, vessel) => {
        const companyName = vessel.Client?.company_name || 'Unknown Company';
        const companyId = vessel.Client?.id || 'unknown';

        if (!acc[companyId]) {
            acc[companyId] = {
                company: {
                    id: vessel.Client?.id,
                    name: companyName,
                    code: vessel.Client?.company_code,
                    email: vessel.Client?.email,
                    phone: vessel.Client?.phone,
                    status: vessel.Client?.status
                },
                vessels: []
            };
        }

        acc[companyId].vessels.push(vessel);
        return acc;
    }, {});

    // Convert to array and sort companies alphabetically
    const result = Object.values(groupedByCompany).sort((a, b) =>
        a.company.name.localeCompare(b.company.name)
    );

    return {
        count: vessels.length,
        rows: result
    };
};

export const getVesselById = async (id, scopeFilters = {}) => {
    const vessel = await Vessel.findOne({
        where: { id, ...scopeFilters },
        include: [{ model: Client, as: 'Client' }]
    });
    if (!vessel) throw { statusCode: 404, message: 'Vessel not found' };
    return vessel;
};

export const getVesselsByClientId = async (clientId) => {
    // Check if client exists
    const client = await Client.findByPk(clientId);
    if (!client) {
        throw { statusCode: 404, message: 'Client not found' };
    }

    const vessels = await Vessel.findAll({
        where: { client_id: clientId },
        include: [{
            model: Client,
            as: 'Client',
            attributes: ['id', 'company_name', 'company_code', 'email', 'phone', 'status']
        }],
        order: [['created_at', 'DESC']]
    });

    return {
        client: {
            id: client.id,
            name: client.company_name,
            code: client.company_code,
            email: client.email,
            phone: client.phone,
            status: client.status
        },
        vessels,
        count: vessels.length
    };
};

export const updateVessel = async (id, data, scopeFilters = {}) => {
    const vessel = await getVesselById(id, scopeFilters);

    if (data.imo_number && data.imo_number !== vessel.imo_number) {
        const existing = await Vessel.findOne({ where: { imo_number: data.imo_number } });
        if (existing) {
            throw { statusCode: 400, message: 'Another vessel with this IMO number already exists' };
        }
    }
    if (data.flag_state) {
        await ensureValidFlag(data.flag_state);
    }

    return await vessel.update(data);
};
