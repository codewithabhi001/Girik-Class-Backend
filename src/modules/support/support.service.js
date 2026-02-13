import db from '../../models/index.js';
import * as notificationService from '../../services/notification.service.js';

const SupportTicket = db.SupportTicket;
const User = db.User;

export const createTicket = async (data, user) => {
    const ticket = await SupportTicket.create({
        ...data,
        user_id: user.id,
        status: 'OPEN'
    });

    await notificationService.notifyRoles(['ADMIN', 'GM'], 'New Support Ticket', `Ticket #${ticket.ticket_number || ticket.id} created by ${user.name}`);

    return ticket;
};

export const getTickets = async (query, user) => {
    const where = {};
    if (user.role === 'CLIENT' || user.role === 'SURVEYOR') {
        where.user_id = user.id;
    }

    return await SupportTicket.findAndCountAll({
        where,
        include: [{ model: User, as: 'Creator', attributes: ['name', 'email'] }],
        order: [['createdAt', 'DESC']]
    });
};

export const getTicketById = async (id, user) => {
    const ticket = await SupportTicket.findByPk(id, { include: [{ model: User, as: 'Creator', attributes: ['name', 'email'] }] });
    if (!ticket) throw { statusCode: 404, message: 'Ticket not found' };

    if (user.role !== 'ADMIN' && user.role !== 'GM' && ticket.user_id !== user.id) {
        throw { statusCode: 403, message: 'Access denied' };
    }

    return ticket;
};

export const updateTicketStatus = async (id, status, internalNote, user) => {
    const ticket = await SupportTicket.findByPk(id);
    if (!ticket) throw { statusCode: 404, message: 'Ticket not found' };

    await ticket.update({ status, internal_note: internalNote });

    if (status === 'RESOLVED' || status === 'CLOSED') {
        await notificationService.notifyUser(ticket.user_id, 'Support Ticket Update', `Your ticket #${ticket.ticket_number || ticket.id} has been marked as ${status.toLowerCase()}.`);
    }

    return ticket;
};
