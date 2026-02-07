import db from '../../models/index.js';
import * as authService from '../auth/auth.service.js';

const Client = db.Client;
const User = db.User;

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
        where: filters, // Basic filtering
        include: [
            {
                model: User,
                attributes: ['id'],
            }
        ],
        distinct: true,
        limit: parseInt(limit),
        offset: (page - 1) * limit,
    });

    // Add a boolean flag to indicate if any user is created
    result.rows = result.rows.map(client => {
        const plainClient = client.get({ plain: true });
        plainClient.has_user = !!(plainClient.Users && plainClient.Users.length > 0);
        delete plainClient.Users; // Optional: remove the Users array if only the flag is needed
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
    // Soft delete typically preferred, or status update
    return await client.update({ status: 'INACTIVE' });
};
