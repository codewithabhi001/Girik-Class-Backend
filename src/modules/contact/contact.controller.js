import axios from 'axios';
import * as contactService from './contact.service.js';
import logger from '../../utils/logger.js';

// ─── PUBLIC ────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/contact
 * Anyone can submit a contact message from the website.
 */
export const submitEnquiry = async (req, res, next) => {
    try {
        const { website, captcha_token, ...restBody } = req.body;
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.headers['cf-connecting-ip'] || null;
        const userAgent = req.headers['user-agent'] || 'UNKNOWN';
        const country = req.headers['cf-ipcountry'] || 'UNKNOWN';

        // 1. Honeypot check: If 'website' field is populated, it's a bot.
        if (website) {
            logger.warn(`Honeypot trap triggered by bot [IP=${ipAddress}, Country=${country}, UA=${userAgent}]`);
            return res.status(201).json({
                success: true,
                message: 'Your message has been received. We will get back to you shortly.',
                data: {
                    id: 'bot-discarded',
                    full_name: restBody.full_name || 'Visitor',
                    created_at: new Date().toISOString(),
                },
            });
        }

        // 2. Cloudflare Turnstile CAPTCHA verification
        // Test key that always passes: 1x0000000000000000000000000000000AA
        const secretKey = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';
        
        // Enforce CAPTCHA token check in production
        if (!captcha_token && process.env.NODE_ENV === 'production') {
            return res.status(400).json({ success: false, message: 'CAPTCHA verification failed. Please try again.' });
        }
        
        if (captcha_token) {
            const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
            const formData = new URLSearchParams();
            formData.append('secret', secretKey);
            formData.append('response', captcha_token);
            if (ipAddress) formData.append('remoteip', ipAddress);
            
            const turnstileRes = await axios.post(verifyUrl, formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            
            if (!turnstileRes.data.success) {
                console.error('[Turnstile] Verification failed!', turnstileRes.data);
                console.error('[Turnstile] Secret key starts with:', secretKey.substring(0, 5));
                console.error('[Turnstile] Token received:', captcha_token.substring(0, 15) + '...');
                return res.status(400).json({ success: false, message: 'CAPTCHA verification failed. Please try again.' });
            }
        }

        const enquiry = await contactService.submitEnquiry(restBody, ipAddress);
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
            data: result,
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
