import * as clientService from './client.service.js';

export const createClient = async (req, res, next) => {
    try {
        const client = await clientService.createClient(req.body);
        res.status(201).json({
            success: true,
            message: 'Client created successfully',
            data: client
        });
    } catch (error) { next(error); }
};

export const getClients = async (req, res, next) => {
    try {
        const clients = await clientService.getClients(req.query);
        res.json({
            success: true,
            message: 'Clients fetched successfully',
            data: clients
        });
    } catch (error) { next(error); }
};

export const getClientById = async (req, res, next) => {
    try {
        const client = await clientService.getClientById(req.params.id);
        res.json({
            success: true,
            message: 'Client details fetched successfully',
            data: client
        });
    } catch (error) { next(error); }
};

export const updateClient = async (req, res, next) => {
    try {
        const client = await clientService.updateClient(req.params.id, req.body);
        res.json({
            success: true,
            message: 'Client updated successfully',
            data: client
        });
    } catch (error) { next(error); }
};

export const deleteClient = async (req, res, next) => {
    try {
        await clientService.deleteClient(req.params.id);
        res.status(200).json({
            success: true,
            message: 'Client deleted/deactivated successfully'
        });
    } catch (error) { next(error); }
};

// --- Self Service (CLIENT role) ---
export const getProfile = async (req, res, next) => {
    try {
        const profile = await clientService.getProfile(req.user.id);
        res.json({ success: true, data: profile });
    } catch (e) { next(e); }
};

export const updateProfile = async (req, res, next) => {
    try {
        const profile = await clientService.updateProfile(req.user.id, req.body);
        res.json({ success: true, data: profile });
    } catch (e) { next(e); }
};

export const getDashboard = async (req, res, next) => {
    try {
        const data = await clientService.getDashboardData(req.user.client_id);
        res.json({ success: true, data });
    } catch (e) { next(e); }
};

export const getClientDocuments = async (req, res, next) => {
    try {
        const clientId = req.user.role === 'CLIENT' ? req.user.client_id : req.params.id;
        if (!clientId) throw { statusCode: 400, message: 'Client ID is required' };

        // Ensure user only accesses their own documents if they are a client
        if (req.user.role === 'CLIENT' && req.params.id && req.params.id !== req.user.client_id) {
            throw { statusCode: 403, message: 'Forbidden access to other client documents' };
        }

        const documents = await clientService.getClientDocuments(clientId, req.user);
        res.json({ success: true, count: documents.length, data: documents });
    } catch (e) { next(e); }
};
