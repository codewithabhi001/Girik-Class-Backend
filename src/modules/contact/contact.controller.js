import * as contactService from './contact.service.js';

// ─── PUBLIC ────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/contact
 * Anyone can submit a contact message from the website.
 */
export const submitEnquiry = async (req, res, next) => {
    try {
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || null;
        const enquiry = await contactService.submitEnquiry(req.body, ipAddress);
        res.status(201).json({
            success: true,
            message: 'Your message has been received. We will get back to you shortly.',
            data: {
                id: enquiry.id,
                full_name: enquiry.full_name,
                created_at: enquiry.created_at,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─── ADMIN / GM ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/contact
 * List all enquiries with filters (ADMIN, GM only)
 */
export const getAllEnquiries = async (req, res, next) => {
    try {
        const result = await contactService.getAllEnquiries(req.query);
        res.status(200).json({
            success: true,
            total: result.count,
            data: result.rows,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/contact/stats
 * Enquiry stats by status (ADMIN, GM only)
 */
export const getEnquiryStats = async (req, res, next) => {
    try {
        const stats = await contactService.getEnquiryStats();
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/contact/:id
 * Get a single enquiry (ADMIN, GM only)
 */
export const getEnquiryById = async (req, res, next) => {
    try {
        const enquiry = await contactService.getEnquiryById(req.params.id);
        res.status(200).json({ success: true, data: enquiry });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/v1/contact/:id/status
 * Update the status / add an internal note (ADMIN, GM only)
 */
export const updateEnquiryStatus = async (req, res, next) => {
    try {
        const enquiry = await contactService.updateEnquiryStatus(
            req.params.id,
            req.body,
            req.user
        );
        res.status(200).json({
            success: true,
            message: 'Enquiry updated successfully.',
            data: enquiry,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/v1/contact/:id
 * Hard-delete an enquiry (ADMIN only)
 */
export const deleteEnquiry = async (req, res, next) => {
    try {
        await contactService.deleteEnquiry(req.params.id);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};
