import { Op } from 'sequelize';
import db from '../../models/index.js';
import { flatContactEnquiryListRow } from '../../utils/listRowFlatten.util.js';
import * as notificationService from '../../services/notification.service.js';
import emailService from '../../services/email.service.js';
import logger from '../../utils/logger.js';
import { scanEnquiryPayload } from '../../utils/spamDetector.util.js';

const WebsiteContact = db.WebsiteContact;
const User = db.User;

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC – Submit an enquiry from the website contact form (no auth required)
// ─────────────────────────────────────────────────────────────────────────────
export const submitEnquiry = async (data, ipAddress) => {
    const { full_name, company, corporate_email, message, phone, subject, source_page } = data;

    // 1. Spam content & disposable email detection
    const scanResult = scanEnquiryPayload({ full_name, corporate_email, subject, message });
    if (scanResult.isSpam) {
        logger.warn(`Spam enquiry blocked [reason=${scanResult.reason}] from ${corporate_email} [IP=${ipAddress}]`);
        throw { statusCode: 400, message: 'Enquiry submission rejected by security filter.' };
    }

    // 2. Duplicate submission check within 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const duplicateOr = [{ corporate_email }];
    if (phone) duplicateOr.push({ phone });
    if (ipAddress) duplicateOr.push({ ip_address: ipAddress });

    const existingEnquiry = await WebsiteContact.findOne({
        where: {
            created_at: { [Op.gte]: tenMinutesAgo },
            [Op.or]: duplicateOr
        }
    });

    if (existingEnquiry) {
        logger.warn(`Duplicate enquiry attempt blocked within 10-min window [email=${corporate_email}, IP=${ipAddress}]`);
        throw { statusCode: 429, message: 'A recent enquiry with this contact details has already been submitted. Please wait 10 minutes.' };
    }

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
        'NEW_WEBSITE_ENQUIRY',
        {
            fullName: full_name,
            company: company || 'N/A',
            email: corporate_email,
            message,
            phone: phone || 'N/A',
            subject: subject || 'N/A',
            enquiry_id: enquiry.id,
            // Keep full_name for the notification formatter (push/in-app)
            full_name: full_name
        }
    ).catch(err => logger.error('Failed to notify roles for new enquiry', err));

    // Send acknowledgement email to the user
    emailService.sendTemplateEmail(
        corporate_email,
        'CONTACT_ACKNOWLEDGEMENT',
        { fullName: full_name, email: corporate_email }
    ).catch(err => logger.error(`Failed to send contact acknowledgement email to ${corporate_email}`, err));

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

    const result = await WebsiteContact.findAndCountAll({
        where,
        attributes: [
            'id',
            'full_name',
            'company',
            'corporate_email',
            'phone',
            'subject',
            'source_page',
            'status',
            'internal_note',
            'replied_by',
            'replied_at',
            'created_at'
        ],
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
        useReplica: true
    });

    return {
        total: result.count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(result.count / limitNum),
        rows: result.rows.map(flatContactEnquiryListRow),
    };
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
    const enquiry = await WebsiteContact.findByPk(id, { useMaster: true });
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
    const enquiry = await WebsiteContact.findByPk(id, { useMaster: true });
    if (!enquiry) throw { statusCode: 404, message: 'Enquiry not found' };
    await enquiry.destroy();
    logger.info(`Enquiry ${id} deleted`);
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN / GM – Stats summary (e.g. for a dashboard widget)
// ─────────────────────────────────────────────────────────────────────────────
export const getEnquiryStats = async () => {
    const stats = await WebsiteContact.findAll({
        attributes: [
            'status',
            [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
        ],
        group: ['status'],
        useReplica: true
    });

    const results = {
        NEW: 0,
        READ: 0,
        REPLIED: 0,
        ARCHIVED: 0,
        TOTAL: 0
    };

    let total = 0;
    stats.forEach(s => {
        const statusName = s.status;
        const count = parseInt(s.getDataValue('count'), 10);
        results[statusName] = count;
        total += count;
    });

    results.TOTAL = total;
    return results;
};
