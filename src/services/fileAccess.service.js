import db from '../models/index.js';
import * as s3Service from './s3.service.js';
import env from '../config/env.js';

const { JobRequest, Vessel, Certificate, AuditLog } = db;

/**
 * Extract S3 key from a full URL or return the key itself if already a key.
 * @param {string} urlOrKey 
 * @returns {string} S3 Key
 */
export const getKeyFromUrl = (urlOrKey) => {
    if (!urlOrKey) return null;
    try {
        const url = new URL(urlOrKey);
        // Remove leading slash
        return url.pathname.substring(1);
    } catch (e) {
        // Not a URL, assume it's a key
        return urlOrKey;
    }
};

/**
 * Generate a public CDN URL for a given key.
 * Only for public/certificates/* path.
 * @param {string} key 
 * @returns {string} CDN URL
 */
export const generatePublicCdnUrl = (key) => {
    const cleanKey = getKeyFromUrl(key);
    // Allow any key starting with public/ to be served via CDN
    if (!cleanKey || !cleanKey.startsWith('public/')) {
        return null;
    }
    const cdnDomain = env.aws.cloudfrontDomain || 'cdn.girikship.com'; // Fallback or env
    // Ensure https
    return `https://${cdnDomain}/${cleanKey}`;
};

/**
 * Generate a signed URL for a given key with expiry.
 * @param {string} key 
 * @param {number} expiresInSeconds 
 * @param {Object} user - User requesting the URL (for audit)
 * @returns {Promise<string>} Signed URL
 */
export const generateSignedUrl = async (key, expiresInSeconds = 300, user = null) => {
    const cleanKey = getKeyFromUrl(key);
    if (!cleanKey) return null;

    const signedUrl = await s3Service.getSignedFileUrl(cleanKey, expiresInSeconds);

    // Audit Log
    if (user) {
        try {
            await AuditLog.create({
                user_id: user.id,
                action: 'GENERATE_SIGNED_URL',
                entity_name: 'File',
                entity_id: null, // No specific ID for a file usually, or could use Document ID if available context
                old_values: null,
                new_values: { key: cleanKey, expires_in: expiresInSeconds }
            });
        } catch (err) {
            console.warn('Audit log failed for signed URL generation', err);
        }
    }

    return signedUrl;
};

/**
 * Resolve a key/url into a CDN URL or a signed URL based on its prefix.
 * @param {string} keyOrUrl 
 * @param {Object} user - Optional user for audit logging
 * @returns {Promise<string>}
 */
export const resolveUrl = async (keyOrUrl, user = null) => {
    if (!keyOrUrl) return null;
    const key = getKeyFromUrl(keyOrUrl);

    // Check if it's a public path
    if (key.startsWith('public/')) {
        return generatePublicCdnUrl(key);
    }

    // Otherwise return a signed URL (default 1 hour expiry)
    return await generateSignedUrl(key, 3600, user);
};

/**
 * Recursively search for URL keys and resolve them.
 * @param {Object|Array} data 
 * @param {Object} user 
 * @returns {Promise<Object|Array>}
 */
export const resolveEntity = async (data, user = null) => {
    if (!data) return data;

    if (Array.isArray(data)) {
        return await Promise.all(data.map(item => resolveEntity(item, user)));
    }

    if (typeof data === 'object') {
        // If it's a Sequelize model instance, convert to plain object
        let plain = (typeof data.get === 'function') ? data.get({ plain: true }) : { ...data };

        const urlKeys = ['url', 'file_url', 'attachment_url', 'attendance_photo_url', 'pdf_file_url', 'qr_code_url', 'document_url', 'cv_file_url', 'id_proof_url', 'certificate_files_url'];

        for (const [key, value] of Object.entries(plain)) {
            if (urlKeys.includes(key)) {
                if (typeof value === 'string' && value && !value.startsWith('http')) {
                    plain[key] = await resolveUrl(value, user);
                } else if (Array.isArray(value)) {
                    plain[key] = await Promise.all(value.map(async v => (typeof v === 'string' && v && !v.startsWith('http')) ? await resolveUrl(v, user) : v));
                }
            } else if (value && (typeof value === 'object' || Array.isArray(value))) {
                plain[key] = await resolveEntity(value, user);
            }
        }
        return plain;
    }

    return data;
};

/**
 * Validate if a user has access to a specific entity's files.
 * @param {Object} user 
 * @param {string} entityType - JOB, VESSEL, CERTIFICATE
 * @param {number|string} entityId 
 * @returns {Promise<boolean>}
 */
export const validateUserEntityAccess = async (user, entityType, entityId) => {
    if (user.role === 'ADMIN' || user.role === 'GM' || user.role === 'TM' || user.role === 'TO') return true; // Admins/Internal staff access all

    if (user.role === 'CLIENT') {
        if (entityType === 'VESSEL') {
            const vessel = await Vessel.findOne({ where: { id: entityId, client_id: user.client_id } });
            return !!vessel;
        } else if (entityType === 'JOB') {
            const job = await JobRequest.findByPk(entityId, { include: [{ model: Vessel, attributes: ['client_id'] }] });
            return job && job.Vessel.client_id === user.client_id;
        } else if (entityType === 'CERTIFICATE') {
            const cert = await Certificate.findByPk(entityId, { include: [{ model: Vessel, attributes: ['client_id'] }] });
            return cert && cert.Vessel.client_id === user.client_id;
        }
    }

    if (user.role === 'SURVEYOR') {
        // Surveyor can only access assigned jobs
        if (entityType === 'JOB') {
            const job = await JobRequest.findOne({ where: { id: entityId, surveyor_id: user.id } });
            return !!job;
        }
    }

    return false;
};

/**
 * Process a file record and return the structured response with appropriate URL.
 * @param {Object} fileRecord - { file_url, file_type, document_type, ... }
 * @param {Object} user 
 * @returns {Promise<Object>}
 */
export const processFileAccess = async (fileRecord, user) => {
    const key = getKeyFromUrl(fileRecord.file_url);
    const isPublic = key.startsWith('public/');

    let signedUrl = null;
    let expiresAt = null;

    if (isPublic) {
        signedUrl = generatePublicCdnUrl(key);
    } else {
        const expiresIn = 600; // 10 minutes
        signedUrl = await generateSignedUrl(key, expiresIn, user);
        expiresAt = new Date(Date.now() + expiresIn * 1000);
    }

    return {
        fileName: key.split('/').pop(), // Simple filename extraction
        contentType: fileRecord.file_type || 'application/octet-stream',
        expiresAt: expiresAt, // Null for public CDN
        signedUrl: signedUrl
    };
};
