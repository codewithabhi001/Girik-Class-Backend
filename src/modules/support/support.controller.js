import * as supportService from './support.service.js';

export const createTicket = async (req, res, next) => {
    try {
        const ticket = await supportService.createTicket(req.body, req.user);
        res.status(201).json({ success: true, data: ticket });
    } catch (e) { next(e); }
};

export const getTickets = async (req, res, next) => {
    try {
        const result = await supportService.getTickets(req.query, req.user);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const getTicketById = async (req, res, next) => {
    try {
        const ticket = await supportService.getTicketById(req.params.id, req.user);
        res.json({ success: true, data: ticket });
    } catch (e) { next(e); }
};

export const updateTicketStatus = async (req, res, next) => {
    try {
        const ticket = await supportService.updateTicketStatus(req.params.id, req.body.status, req.body.internal_note, req.user);
        res.json({ success: true, data: ticket });
    } catch (e) { next(e); }
};
