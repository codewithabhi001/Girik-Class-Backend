import db from '../models/index.js';
import * as s3Service from './s3.service.js';
import env from '../config/env.js';
import { getContext } from '../utils/context.util.js';

const { JobRequest, Vessel, Certificate, AuditLog } = db;

// ── Signed URL cache (URLs are valid for 60 min, cache for 50 min) ──
const _signedUrlCache = new Map();
const SIGNED_URL_CACHE_TTL = 50 * 60 * 1000; // 50 minutes

// Periodic cleanup every 10 minutes to prevent memory leak
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of _signedUrlCache) {
        if (now - entry.ts > SIGNED_URL_CACHE_TTL) {
            _signedUrlCache.delete(key);
        }
    }
}, 10 * 60 * 1000).unref();

/**
 * Extract S3 key from a full URL or return the key itself if already a key.
 * @param {string} urlOrKey 
 * @returns {string} S3 Key
 */
export const getKeyFromUrl = (urlOrKey) => {
    if (!urlOrKey) return null;
    try {
        const url = new URL(urlOrKey);
        // Remove leading slash and decode URI components (e.g. %20 -> space, %28 -> '(' )
        return decodeURIComponent(url.pathname.substring(1));
    } catch (e) {
        // Not a URL, assume it's a key
        return decodeURIComponent(urlOrKey);
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
    // Allow only keys starting with public/ to be served via CDN
    if (!cleanKey || !cleanKey.startsWith('public/')) {
        return null;
    }
    const cdnDomain = env.aws.cloudfrontDomain || 'cdn.grclass.com';
    return `https://${cdnDomain}/${cleanKey}`;
};

/**
 * Generate a signed URL for a given key with expiry.
 * @param {string} key 
 * @param {number} expiresInSeconds 
 * @param {Object} user - User requesting the URL (for audit)
 * @param {boolean} skipAudit - Whether to skip individual audit logging
 * @returns {Promise<string>} Signed URL
 */
export const generateSignedUrl = async (key, expiresInSeconds = 300, user = null, skipAudit = false, options = {}) => {
    const cleanKey = getKeyFromUrl(key);
    if (!cleanKey) return null;

    // ── Check cache first ──
    const cacheKey = `${cleanKey}:${expiresInSeconds}:${options.ResponseContentDisposition || ''}`;
    const cached = _signedUrlCache.get(cacheKey);
    if (cached && (Date.now() - cached.ts < SIGNED_URL_CACHE_TTL)) {
        return cached.url;
    }

    const signedUrl = await s3Service.getSignedFileUrl(cleanKey, expiresInSeconds, options);
    _signedUrlCache.set(cacheKey, { url: signedUrl, ts: Date.now() });

    // Audit Log (non-blocking) - Only if not skipped
    const ctx = getContext();
    const activeUserId = user?.id || ctx.userId;

    if (activeUserId && !skipAudit) {
        AuditLog.create({
            user_id: activeUserId,
            action: 'GENERATE_SIGNED_URL',
            entity_name: 'File',
            entity_id: null,
            old_values: null,
            new_values: { key: cleanKey, expires_in: expiresInSeconds }
        }).catch(err => console.warn('Audit log failed for signed URL generation', err));
    }

    return signedUrl;
};

/**
 * Resolve a key/url into a CDN URL or a signed URL based on its prefix.
 * @param {string} keyOrUrl 
 * @param {Object} user - Optional user for audit logging
 * @param {boolean} skipAudit - Whether to skip individual audit logging
 * @returns {Promise<string>}
 */
export const resolveUrl = async (keyOrUrl, user = null, skipAudit = false, forcePublic = false) => {
    if (!keyOrUrl) return null;
    const key = getKeyFromUrl(keyOrUrl);

    // Check if it's a public path or forced public
    if (key.startsWith('public/') || forcePublic) {
        // Use CDN domain for public assets
        const cdnDomain = env.aws.cloudfrontDomain || 'cdn.grclass.com';
        return `https://${cdnDomain}/${key}`;
    }

    // Otherwise return a signed URL (default 1 hour expiry)
    return await generateSignedUrl(key, 3600, user, skipAudit);
};

/**
 * Recursively search for URL keys and resolve them.
 * @param {Object|Array} data 
 * @param {Object} user 
 * @returns {Promise<Object|Array>}
 */
export const resolveEntity = async (data, user = null) => {
    if (!data) return data;

    const auditEntries = [];

    const recurse = async (item) => {
        if (!item) return item;
        if (Array.isArray(item)) {
            return await Promise.all(item.map(i => recurse(i)));
        }

        if (item instanceof Date) return item;
        if (typeof item === 'object') {
            // If it's a Sequelize model instance, convert to plain object
            let plain = (typeof item.get === 'function') ? item.get({ plain: true }) : { ...item };

            const urlKeys = ['url', 'file_url', 'logo_url', 'attachment_url', 'attendance_photo_url', 'signature_url', 'evidence_proof_url', 'survey_statement_pdf_url', 'pdf_file_url', 'qr_code_url', 'document_url', 'cv_file_url', 'id_proof_url', 'certificate_files_url', 'profile_pic_url', 'cv_url', 'license_copy_url', 'signed_checklist_files', 'thumbnail_url', 'receipt_url', 'template_files', 'uploaded_file_url', 'generated_pdf_url', 'manually_overridden_file_url', 'file_key'];

            const fieldPromises = Object.entries(plain).map(async ([key, value]) => {
                if (urlKeys.includes(key)) {
                    if (typeof value === 'string' && value && !value.startsWith('http')) {
                        // Force public CDN for profile_pic_url, logo_url, and thumbnail_url if used in public context / public assets
                        const forcePublic = key === 'profile_pic_url' || key === 'logo_url' || key === 'thumbnail_url';
                        const resolved = await resolveUrl(value, user, true, forcePublic); // skip individual audit
                        plain[key] = resolved;
                        if (key === 'file_key') {
                            plain['url'] = resolved;
                        }
                        if (user && !value.startsWith('public/')) {
                            auditEntries.push({
                                user_id: user.id,
                                action: 'GENERATE_SIGNED_URL',
                                entity_name: 'File',
                                new_values: { key: value, field: key }
                            });
                        }
                    } else if (Array.isArray(value)) {
                        plain[key] = await Promise.all(value.map(async v => {
                            if (typeof v === 'string' && v && !v.startsWith('http')) {
                                const forcePublic = key === 'profile_pic_url' || key === 'logo_url';
                                const resolved = await resolveUrl(v, user, true, forcePublic);
                                if (user && !v.startsWith('public/')) {
                                    auditEntries.push({
                                        user_id: user.id,
                                        action: 'GENERATE_SIGNED_URL',
                                        entity_name: 'File',
                                        new_values: { key: v, field: key }
                                    });
                                }
                                return resolved;
                            } else if (v && typeof v === 'object' && typeof v.url === 'string' && !v.url.startsWith('http')) {
                                const forcePublic = key === 'profile_pic_url' || key === 'logo_url';
                                const resolved = await resolveUrl(v.url, user, true, forcePublic);
                                if (user && !v.url.startsWith('public/')) {
                                    auditEntries.push({
                                        user_id: user.id,
                                        action: 'GENERATE_SIGNED_URL',
                                        entity_name: 'File',
                                        new_values: { key: v.url, field: key }
                                    });
                                }
                                return { ...v, url: resolved };
                            }
                            return v;
                        }));
                    }

                    // Extract and append file names dynamically for S3 keys / resolved URLs
                    if (typeof value === 'string' && value) {
                        const s3Key = getKeyFromUrl(value);
                        if (s3Key) {
                            const fullFileName = s3Key.split('/').pop();
                            const cleanFileName = fullFileName.replace(/^[0-9]+_/, '');
                            
                            const baseNameKey = key.endsWith('_url') ? key.replace(/_url$/, '_name') : `${key}_name`;
                            const originalNameKey = `original_${baseNameKey}`;
                            
                            plain[baseNameKey] = fullFileName;
                            plain[originalNameKey] = cleanFileName;
                            
                            if (key === 'file_url') {
                                plain['file_name'] = fullFileName;
                                plain['fileName'] = fullFileName;
                                plain['original_file_name'] = cleanFileName;
                            }
                        }
                    } else if (Array.isArray(value)) {
                        const fullNames = [];
                        const cleanNames = [];
                        for (const v of value) {
                            let itemKey = null;
                            if (typeof v === 'string' && v) {
                                itemKey = getKeyFromUrl(v);
                            } else if (v && typeof v === 'object' && typeof v.url === 'string') {
                                itemKey = getKeyFromUrl(v.url);
                            }
                            if (itemKey) {
                                const fullFileName = itemKey.split('/').pop();
                                const cleanFileName = fullFileName.replace(/^[0-9]+_/, '');
                                fullNames.push(fullFileName);
                                cleanNames.push(cleanFileName);
                            }
                        }
                        if (fullNames.length > 0) {
                            const baseNamesKey = key.endsWith('s') ? `${key}_names` : `${key}s_names`;
                            const originalNamesKey = `original_${baseNamesKey}`;
                            plain[baseNamesKey] = fullNames;
                            plain[originalNamesKey] = cleanNames;
                        }
                    }
                } else if (value && (typeof value === 'object' || Array.isArray(value))) {
                    plain[key] = await recurse(value);
                }
            });

            await Promise.all(fieldPromises);
            return plain;
        }
        return item;
    };

    const result = await recurse(data);

    // Perform bulk audit logging if any entries were collected
    if (auditEntries.length > 0) {
        // Double check user IDs if missing
        const ctx = getContext();
        const entries = auditEntries.map(e => ({
            ...e,
            user_id: e.user_id || ctx.userId
        })).filter(e => e.user_id);

        if (entries.length > 0) {
            AuditLog.bulkCreate(entries).catch(err => {
                console.warn(`Bulk audit logging failed for ${entries.length} entries:`, err);
            });
        }
    }

    return result;
};

/**
 * Validate if a user has access to a specific entity's files.
 * @param {Object} user 
 * @param {string} entityType - JOB, VESSEL, CERTIFICATE
 * @param {number|string} entityId 
 * @returns {Promise<boolean>}
 */
export const validateUserEntityAccess = async (user, entityType, entityId) => {
    if (!entityId) return false;
    entityType = String(entityType).toUpperCase();
    if (entityType === 'JOBS') entityType = 'JOB';
    if (entityType === 'VESSELS') entityType = 'VESSEL';
    if (entityType === 'CERTIFICATES') entityType = 'CERTIFICATE';

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
            const job = await JobRequest.findOne({ where: { id: entityId, assigned_surveyor_id: user.id } });
            if (job) return true;
            const count = await db.JobCertificate.count({
                where: { job_request_id: entityId, assigned_surveyor_id: user.id }
            });
            return count > 0;
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
export const processFileAccess = async (fileRecord, user, options = {}) => {
    const key = getKeyFromUrl(fileRecord.file_url);
    const isPublic = key.startsWith('public/');

    let signedUrl = null;
    let expiresAt = null;

    if (isPublic) {
        signedUrl = generatePublicCdnUrl(key);
    } else {
        const expiresIn = 600; // 10 minutes
        signedUrl = await generateSignedUrl(key, expiresIn, user, false, options);
        expiresAt = new Date(Date.now() + expiresIn * 1000);
    }

    return {
        fileName: key.split('/').pop(), // Simple filename extraction
        contentType: fileRecord.file_type || 'application/octet-stream',
        expiresAt: expiresAt, // Null for public CDN
        signedUrl: signedUrl
    };
};
