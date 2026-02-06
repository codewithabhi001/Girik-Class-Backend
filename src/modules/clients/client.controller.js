import * as clientService from './client.service.js';

export const createClient = async (req, res, next) => {
    try {
        const client = await clientService.createClient(req.body);
        res.status(201).json(client);
    } catch (error) {
        next(error);
    }
};

export const getClients = async (req, res, next) => {
    try {
        const clients = await clientService.getClients(req.query);
        res.json(clients);
    } catch (error) {
        next(error);
    }
};

export const getClientById = async (req, res, next) => {
    try {
        const client = await clientService.getClientById(req.params.id);
        res.json(client);
    } catch (error) {
        next(error);
    }
};

export const updateClient = async (req, res, next) => {
    try {
        const client = await clientService.updateClient(req.params.id, req.body);
        res.json(client);
    } catch (error) {
        next(error);
    }
};

export const deleteClient = async (req, res, next) => {
    try {
        await clientService.deleteClient(req.params.id);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};
