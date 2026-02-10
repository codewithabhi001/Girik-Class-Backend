import db from '../../models/index.js';
import * as authService from '../auth/auth.service.js';

const Client = db.Client;
const User = db.User;
const Vessel = db.Vessel;
const JobRequest = db.JobRequest;
const Certificate = db.Certificate;
const Payment = db.Payment;

const CLIENT_FIELDS = [
    'company_name', 'company_code', 'address', 'country', 'email', 'phone',
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
    const { page = 1, limit = 10, ...filters } = query;
    const result = await Client.findAndCountAll({
        where: filters,
        include: [{ model: User, attributes: ['id'] }],
        distinct: true,
        limit: parseInt(limit),
        offset: (page - 1) * limit,
    });

    result.rows = result.rows.map(client => {
        const plainClient = client.get({ plain: true });
        plainClient.has_user = !!(plainClient.Users && plainClient.Users.length > 0);
        delete plainClient.Users;
        return plainClient;
    });

    return result;
};

export const getClientById = async (id) => {
    const client = await Client.findByPk(id);
    if (!client) throw { statusCode: 404, message: 'Client not found' };
    return client;
};

export const updateClient = async (id, data) => {
    const client = await getClientById(id);
    return await client.update(data);
};

export const deleteClient = async (id) => {
    const client = await getClientById(id);
    return await client.update({ status: 'INACTIVE' });
};

// --- Self Service ---
export const getProfile = async (userId) => {
    const user = await User.findByPk(userId, {
        attributes: ['id', 'name', 'email', 'role', 'phone'],
        include: [{
            model: Client,
            attributes: ['company_name', 'company_code', 'address', 'country', 'email', 'phone', 'contact_person_name', 'created_at']
        }]
    });
    if (!user) throw { statusCode: 404, message: 'User not found' };
    return user;
};

export const updateProfile = async (userId, data) => {
    const { name, phone } = data;
    await User.update({ name, phone }, { where: { id: userId } });
    return await getProfile(userId);
};

export const getDashboardData = async (clientId) => {
    if (!clientId) throw { statusCode: 404, message: 'Client not found' };

    const vessels = await Vessel.findAll({ where: { client_id: clientId } });
    const vesselIds = vessels.map(v => v.id);

    const jobs = await JobRequest.findAll({
        where: { vessel_id: vesselIds },
        include: ['Vessel', 'CertificateType'],
        order: [['created_at', 'DESC']]
    });

    const certificates = await Certificate.findAll({
        where: { vessel_id: vesselIds },
        include: ['Vessel']
    });

    const jobIds = jobs.map(j => j.id);
    const payments = await Payment.findAll({ where: { job_id: jobIds } });

    const stats = {
        total_vessels: vessels.length,
        active_jobs: jobs.filter(j => !['CERTIFIED', 'REJECTED', 'CANCELLED'].includes(j.job_status)).length,
        expiring_soon: certificates.filter(c => {
            const daysToExpiry = Math.floor((new Date(c.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
            return daysToExpiry <= 60 && daysToExpiry > 0;
        }).length,
        pending_payments: payments.filter(p => p.payment_status === 'UNPAID').length,
    };

    return {
        stats,
        recent_jobs: jobs.slice(0, 5),
        expiring_certificates: certificates
            .filter(c => {
                const daysToExpiry = Math.floor((new Date(c.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                return daysToExpiry <= 60 && daysToExpiry > 0;
            })
            .slice(0, 5)
    };
};
