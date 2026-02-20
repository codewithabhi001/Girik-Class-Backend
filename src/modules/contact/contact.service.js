import { Op } from 'sequelize';
import db from '../../models/index.js';
import * as notificationService from '../../services/notification.service.js';
import logger from '../../utils/logger.js';

const WebsiteContact = db.WebsiteContact;
const User = db.User;

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC – Submit an enquiry from the website contact form (no auth required)
// ─────────────────────────────────────────────────────────────────────────────
export const submitEnquiry = async (data, ipAddress) => {
    const { full_name, company, corporate_email, message, phone, subject, source_page } = data;

    const enquiry = await WebsiteContact.create({
        full_name,
        company: company || null,
        corporate_email,
        message,
        phone: phone || null,
        subject: subject || null,
        source_page: source_page || 'CONTACT',
        ip_address: ipAddress || null,
        status: 'NEW',
    });

    logger.info(`New website enquiry submitted by ${full_name} <${corporate_email}> [id=${enquiry.id}]`);

    // Fire-and-forget – do NOT await; public endpoint must return immediately
    // without blocking on email delivery to all ADMIN/GM users.
    notificationService.notifyRoles(
        ['ADMIN', 'GM'],
        'New Website Enquiry',
        `${full_name} (${company || 'N/A'}) sent a new message via the contact form.`,
        'INFO'
    ).catch(err => logger.error('Failed to notify roles for new enquiry', err));

    return enquiry;
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN / GM – List all enquiries with filters & pagination
// ─────────────────────────────────────────────────────────────────────────────
export const getAllEnquiries = async (query) => {
    const {
        page = 1,
        limit = 20,
        status,
        source_page,
        q,
        from_date,
        to_date,
    } = query;

    const where = {};

    if (status) where.status = status;
    if (source_page) where.source_page = source_page;

    if (q) {
        where[Op.or] = [
            { full_name: { [Op.like]: `%${q}%` } },
            { corporate_email: { [Op.like]: `%${q}%` } },
            { company: { [Op.like]: `%${q}%` } },
            { message: { [Op.like]: `%${q}%` } },
        ];
    }

    if (from_date || to_date) {
        where.created_at = {};
        if (from_date) where.created_at[Op.gte] = new Date(from_date);
        if (to_date) where.created_at[Op.lte] = new Date(to_date);
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));

    return await WebsiteContact.findAndCountAll({
        where,
        include: [
            {
                model: User,
                as: 'Responder',
                attributes: ['id', 'name', 'email'],
                required: false,
            },
        ],
        order: [['created_at', 'DESC']],
        limit: limitNum,
        offset: (pageNum - 1) * limitNum,
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN / GM – Get single enquiry by ID
// ─────────────────────────────────────────────────────────────────────────────
export const getEnquiryById = async (id) => {
    const enquiry = await WebsiteContact.findByPk(id, {
        include: [
            {
                model: User,
                as: 'Responder',
                attributes: ['id', 'name', 'email'],
                required: false,
            },
        ],
    });
    if (!enquiry) throw { statusCode: 404, message: 'Enquiry not found' };
    return enquiry;
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN / GM – Update status / add internal note
// ─────────────────────────────────────────────────────────────────────────────
export const updateEnquiryStatus = async (id, { status, internal_note }, user) => {
    const enquiry = await WebsiteContact.findByPk(id);
    if (!enquiry) throw { statusCode: 404, message: 'Enquiry not found' };

    const updates = { status };
    if (internal_note !== undefined) updates.internal_note = internal_note;

    if (status === 'REPLIED') {
        updates.replied_by = user.id;
        updates.replied_at = new Date();
    }

    await enquiry.update(updates);
    logger.info(`Enquiry ${id} status updated to ${status} by user ${user.id}`);
    return enquiry;
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN / GM – Delete an enquiry (hard delete – use with caution)
// ─────────────────────────────────────────────────────────────────────────────
export const deleteEnquiry = async (id) => {
    const enquiry = await WebsiteContact.findByPk(id);
    if (!enquiry) throw { statusCode: 404, message: 'Enquiry not found' };
    await enquiry.destroy();
    logger.info(`Enquiry ${id} deleted`);
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN / GM – Stats summary (e.g. for a dashboard widget)
// ─────────────────────────────────────────────────────────────────────────────
export const getEnquiryStats = async () => {
    const statuses = ['NEW', 'READ', 'REPLIED', 'ARCHIVED'];
    const results = {};

    for (const s of statuses) {
        results[s] = await WebsiteContact.count({ where: { status: s } });
    }

    results.TOTAL = await WebsiteContact.count();
    return results;
};
