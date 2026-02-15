import db from '../../models/index.js';
import * as notificationService from '../../services/notification.service.js';
import { Op } from 'sequelize';

const SupportTicket = db.SupportTicket;
const User = db.User;
const AuditLog = db.AuditLog;

export const createTicket = async (data, user) => {
    const description = data.description || data.message;
    if (!description) {
        throw { statusCode: 400, message: 'description is required' };
    }
    const ticket = await SupportTicket.create({
        subject: data.subject,
        description,
        priority: data.priority || 'MEDIUM',
        category: data.category || null,
        user_id: user.id,
        status: 'OPEN'
    });
    await AuditLog.create({
        user_id: user.id,
        action: 'CREATE_SUPPORT_TICKET',
        entity_name: 'SupportTicket',
        entity_id: ticket.id,
        old_values: null,
        new_values: {
            subject: ticket.subject,
            status: ticket.status,
            priority: ticket.priority,
            category: ticket.category,
        }
    });

    await notificationService.notifyRoles(['ADMIN', 'GM'], 'New Support Ticket', `Ticket #${ticket.ticket_number || ticket.id} created by ${user.name}`);

    return ticket;
};

export const getTickets = async (query, user) => {
    const { page = 1, limit = 10, status, priority, category, q } = query;
    const where = {};
    if (!['ADMIN', 'GM'].includes(user.role)) {
        where.user_id = user.id;
    }
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (q) {
        where[Op.or] = [
            { subject: { [Op.like]: `%${q}%` } },
            { description: { [Op.like]: `%${q}%` } },
        ];
    }

    return await SupportTicket.findAndCountAll({
        where,
        limit: Math.max(1, parseInt(limit, 10)),
        offset: (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10)),
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
    const oldValues = {
        status: ticket.status,
        resolved_at: ticket.resolved_at,
        resolved_by: ticket.resolved_by,
    };

    const updates = { status };
    if (status === 'RESOLVED' || status === 'CLOSED') {
        updates.resolved_at = new Date();
        updates.resolved_by = user.id;
    } else {
        updates.resolved_at = null;
        updates.resolved_by = null;
    }

    await ticket.update(updates);
    await AuditLog.create({
        user_id: user.id,
        action: 'UPDATE_SUPPORT_TICKET_STATUS',
        entity_name: 'SupportTicket',
        entity_id: ticket.id,
        old_values: oldValues,
        new_values: {
            status: ticket.status,
            resolved_at: ticket.resolved_at,
            resolved_by: ticket.resolved_by,
            internal_note: internalNote || null,
        }
    });

    if (status === 'RESOLVED' || status === 'CLOSED') {
        await notificationService.createNotification(
            ticket.user_id,
            'Support Ticket Update',
            `Your ticket #${ticket.ticket_number || ticket.id} has been marked as ${status.toLowerCase()}.`,
            'INFO'
        );
    }

    return ticket;
};
