import db from '../models/index.js';

const Client = db.Client;

export const createClient = async (data) => {
    return await Client.create(data);
};

export const getClients = async (query) => {
    const { page = 1, limit = 10, ...filters } = query;
    return await Client.findAndCountAll({
        where: filters, // Basic filtering
        limit: parseInt(limit),
        offset: (page - 1) * limit,
    });
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
