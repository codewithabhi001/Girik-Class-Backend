import db from '../../models/index.js';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger.js';
import { buildCertificateScopeWhere } from './certificate-scope.js';
import * as fileAccessService from '../../services/fileAccess.service.js';
import * as lifecycleService from '../../services/lifecycle.service.js';
import env from '../../config/env.js';
import { RBAC, isRoleAllowed } from '../../config/rbac.config.js';
import * as emailService from '../../services/email.service.js';
import * as s3Service from '../../services/s3.service.js';
import * as certificatePdfService from '../../services/certificate-pdf.service.js';
import { buildTagValuesForJob } from '../../utils/tagBuilder.util.js';
import { CERTIFICATE_STATUSES } from '../../constants/statuses.js';
import { buildFullStatusCounts } from '../../utils/statusCount.util.js';
import {
    flatCertificateListRow,
    flatCertificateTypeListRow,
    shapeCertificateTypeDetail,
} from '../../utils/listRowFlatten.util.js';
import QRCode from 'qrcode';


const Certificate = db.Certificate;
const CertificateType = db.CertificateType;
const CertificateTemplate = db.CertificateTemplate;
const JobRequest = db.JobRequest;
const Vessel = db.Vessel;
const JobStatusHistory = db.JobStatusHistory;
const AuditLog = db.AuditLog;
const { Op } = db.Sequelize;

const cleanCustomHtml = (html) => {
    if (!html) return html;
    let cleaned = html;
    cleaned = cleaned.replace(/<img\s+([^>]*?)>/gi, (match) => {
        const hasSigAlt = /alt\s*=\s*["']signature["']/i.test(match);
        const hasSigSrc = /src\s*=\s*["'][^"']*Gr-class-sign[^"']*["']/i.test(match);
        if (hasSigAlt || hasSigSrc) {
            return match.replace(/(src\s*=\s*["'])[^"']*?(['"])/i, `$1{signature}$2`);
        }
        return match;
    });
    // Normalize embedded data-uri signatures back to placeholder so tiered resolution can re-apply
    cleaned = cleaned.replace(
        /<img([^>]*?)src\s*=\s*["']data:image\/[^"']+["']([^>]*?)alt\s*=\s*["']signature["']([^>]*?)>/gi,
        '<img$1src="{signature}"$2alt="signature"$3>'
    );
    cleaned = cleaned.replace(
        /<img([^>]*?)alt\s*=\s*["']signature["']([^>]*?)src\s*=\s*["']data:image\/[^"']+["']([^>]*?)>/gi,
        '<img$1alt="signature"$2src="{signature}"$3>'
    );
    return cleaned;
};

const loadAssetAsDataUri = async (urlOrPathOrKey) => {
    if (!urlOrPathOrKey) return '';
    if (urlOrPathOrKey.startsWith('data:')) return urlOrPathOrKey;

    const fs = await import('fs');
    try {
        if (fs.existsSync(urlOrPathOrKey)) {
            const buffer = fs.readFileSync(urlOrPathOrKey);
            return `data:image/png;base64,${buffer.toString('base64')}`;
        }
    } catch {
        // fall through to S3
    }

    try {
        const fileContent = await s3Service.getFileContent(urlOrPathOrKey);
        let mime = 'image/png';
        const lowerKey = urlOrPathOrKey.toLowerCase();
        if (lowerKey.endsWith('.jpg') || lowerKey.endsWith('.jpeg')) mime = 'image/jpeg';
        if (lowerKey.endsWith('.svg')) mime = 'image/svg+xml';
        if (lowerKey.endsWith('.webp')) mime = 'image/webp';
        return `data:${mime};base64,${fileContent.toString('base64')}`;
    } catch (err) {
        logger.error('Error fetching asset for certificate PDF:', err);
        return '';
    }
};

const _readLocalPaymentsAssetBase64 = async (filename) => {
    try {
        const fs = await import('fs');
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const assetPath = path.join(__dirname, '..', 'payments', filename);
        if (fs.existsSync(assetPath)) {
            return `data:image/png;base64,${fs.readFileSync(assetPath).toString('base64')}`;
        }
    } catch {
        // ignore
    }
    return '';
};

const resolveAssetUrlForPreview = async (urlOrKey, user) => {
    if (!urlOrKey) return null;
    if (urlOrKey.startsWith('data:') || urlOrKey.startsWith('http://') || urlOrKey.startsWith('https://')) {
        return urlOrKey;
    }
    const cdnUrl = fileAccessService.generatePublicCdnUrl(urlOrKey);
    if (cdnUrl) return cdnUrl;
    return fileAccessService.resolveUrl(urlOrKey, user, true);
};

/** CDN/signed URL for browser preview — avoids slow S3 download + base64 embed. */
const resolveCertificateSignatureForPreview = async (cert, user, transaction = null) => {
    if (cert.signature_url) {
        const url = await resolveAssetUrlForPreview(cert.signature_url, user);
        if (url) return url;
    }

    let certType = cert.CertificateType;
    if (!certType && cert.certificate_type_id) {
        certType = await db.CertificateType.findByPk(cert.certificate_type_id, {
            transaction,
            attributes: ['signature_url'],
        });
    }
    if (certType?.signature_url) {
        const url = await resolveAssetUrlForPreview(certType.signature_url, user);
        if (url) return url;
    }

    const setting = await db.SystemSetting.findByPk('GR_CLASS_REPRESENTATIVE_SIGNATURE', {
        transaction,
        attributes: ['value'],
    });
    if (setting?.value) {
        const url = await resolveAssetUrlForPreview(setting.value, user);
        if (url) return url;
    }

    return _readLocalPaymentsAssetBase64('Gr-class-sign.png');
};

/**
 * Resolve signature image for certificate PDF generation.
 * Priority: certificate override → certificate type default → global setting → local fallback file.
 */
const resolveCertificateSignatureBase64 = async (cert, transaction = null) => {
    if (cert.signature_url) {
        const resolved = await loadAssetAsDataUri(cert.signature_url);
        if (resolved) return resolved;
    }

    let certType = cert.CertificateType;
    if (!certType && cert.certificate_type_id) {
        certType = await db.CertificateType.findByPk(cert.certificate_type_id, { transaction });
    }
    if (certType?.signature_url) {
        const resolved = await loadAssetAsDataUri(certType.signature_url);
        if (resolved) return resolved;
    }

    const setting = await db.SystemSetting.findByPk('GR_CLASS_REPRESENTATIVE_SIGNATURE', { transaction });
    if (setting?.value) {
        const resolved = await loadAssetAsDataUri(setting.value);
        if (resolved) return resolved;
    }

    try {
        const fs = await import('fs');
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const sigPath = path.join(__dirname, '..', 'payments', 'Gr-class-sign.png');
        if (fs.existsSync(sigPath)) {
            return `data:image/png;base64,${fs.readFileSync(sigPath).toString('base64')}`;
        }
    } catch (err) {
        logger.error('Error loading fallback signature file for PDF:', err);
    }

    return '';
};

/** Reusable scope filter for certificate list/get by role. Used in getCertificates, getCertificateById, preview, getHistory, download. */
export const getCertificateScopeFilter = async (user) => {
    return buildCertificateScopeWhere(user, { JobRequest, Vessel });
};

/** List certificate types — minimal fields only (no description / required_documents). */
export const getCertificateTypes = async (options = {}) => {
    let includeInactive = false;
    let search = null;
    let page = null;
    let limit = null;
    let status = null;
    if (typeof options === 'object' && options !== null) {
        includeInactive = options.includeInactive ?? false;
        search = options.search;
        page = options.page;
        limit = options.limit;
        status = options.status;
    } else {
        includeInactive = !!options;
    }

    const where = {};
    if (status) {
        where.status = status;
    } else if (!includeInactive) {
        where.status = 'ACTIVE';
    }

    if (search) {
        where[Op.or] = [
            { name: { [Op.like]: `%${search}%` } },
            { short_code: { [Op.like]: `%${search}%` } }
        ];
    }

    const queryOptions = {
        where,
        attributes: ['id', 'name', 'short_code', 'issuing_authority', 'validity_years', 'status', 'requires_survey'],
        include: [{
            model: db.CertificateTemplate,
            as: 'Templates',
            where: { is_active: true },
            required: false,
            attributes: ['certificate_term']
        }],
        order: [['name', 'ASC']],
        distinct: true, // Need this because of the hasMany include
        useReplica: true
    };

    if (page !== undefined && page !== null && limit !== undefined && limit !== null) {
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(Math.max(1, parseInt(limit, 10) || 10), 100);
        queryOptions.limit = limitNum;
        queryOptions.offset = (pageNum - 1) * limitNum;

        const { count, rows } = await CertificateType.findAndCountAll(queryOptions);

        const activeCount = await CertificateType.count({
            where: { ...where, status: 'ACTIVE' },
            useReplica: true
        });

        const surveyLinkedCount = await CertificateType.count({
            where: { ...where, requires_survey: { [Op.ne]: false } },
            useReplica: true
        });

        return {
            total: count,
            activeCount,
            surveyLinkedCount,
            rows: rows.map(flatCertificateTypeListRow)
        };
    }

    const types = await CertificateType.findAll(queryOptions);
    return types.map(flatCertificateTypeListRow);
};

/** Get a single certificate type by ID with full detail including description and required documents. */
export const getCertificateTypeById = async (id) => {
    const type = await CertificateType.findByPk(id, {
        attributes: [
            'id',
            'name',
            'short_code',
            'issuing_authority',
            'validity_years',
            'status',
            'description',
            'requires_survey',
            'requires_survey_short_term',
            'requires_survey_full_term',
            'signature_url'
        ],
        include: [{
            model: db.CertificateRequiredDocument,
            attributes: ['id', 'document_name', 'is_mandatory'],
        }],
    });
    if (!type) throw { statusCode: 404, message: 'Certificate type not found' };
    const plain = type.get({ plain: true });
    plain.CertificateRequiredDocuments = (plain.CertificateRequiredDocuments || [])
        .sort((a, b) => (a.document_name || '').localeCompare(b.document_name || ''));
    return await fileAccessService.resolveEntity(shapeCertificateTypeDetail(plain));
};

const normalizeCertificateName = (name) => {
    return String(name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();
};

/** Create a new certificate type (ADMIN). */
export const createCertificateType = async (data) => {
    const allTypes = await CertificateType.findAll();
    const normalizedTargetName = normalizeCertificateName(data.name);
    const existing = allTypes.find(t => normalizeCertificateName(t.name) === normalizedTargetName);
    if (existing) throw { statusCode: 409, message: 'A certificate type with this name already exists' };

    const { required_documents, ...certData } = data;
    const txn = await db.sequelize.transaction();
    try {
        const requiresSurvey = certData.requires_survey ?? true;
        const requiresSurveyShortTerm = certData.requires_survey_short_term ?? (requiresSurvey ? false : false);
        const requiresSurveyFullTerm = certData.requires_survey_full_term ?? (requiresSurvey ? true : false);

        const type = await CertificateType.create({
            name: certData.name,
            short_code: certData.short_code ?? null,
            issuing_authority: certData.issuing_authority,
            validity_years: certData.validity_years,
            status: certData.status ?? 'ACTIVE',
            description: certData.description ?? null,
            requires_survey: requiresSurvey,
            requires_survey_short_term: requiresSurveyShortTerm,
            requires_survey_full_term: requiresSurveyFullTerm,
            signature_url: certData.signature_url ?? null,
        }, { transaction: txn });

        if (required_documents && required_documents.length > 0) {
            const docsToCreate = required_documents.map(doc => ({
                certificate_type_id: type.id,
                document_name: doc.document_name,
                is_mandatory: doc.is_mandatory ?? true,
                applies_to_term: doc.applies_to_term ?? 'FULL_TERM'
            }));
            await db.CertificateRequiredDocument.bulkCreate(docsToCreate, { transaction: txn });
        }

        await txn.commit();
        return await getCertificateTypeById(type.id);
    } catch (e) {
        await txn.rollback();
        throw e;
    }
};

/** Update certificate type and required documents (ADMIN/TM). */
export const updateCertificateType = async (id, data) => {
    const type = await CertificateType.findByPk(id, { useMaster: true });
    if (!type) throw { statusCode: 404, message: 'Certificate type not found' };

    if (data.name && data.name !== type.name) {
        const allTypes = await CertificateType.findAll();
        const normalizedTargetName = normalizeCertificateName(data.name);
        const existing = allTypes.find(t => t.id !== id && normalizeCertificateName(t.name) === normalizedTargetName);
        if (existing) throw { statusCode: 409, message: 'A certificate type with this name already exists' };
    }

    const { required_documents, ...certData } = data;
    const txn = await db.sequelize.transaction();
    try {
        const requiresSurvey = certData.requires_survey !== undefined ? certData.requires_survey : type.requires_survey;
        const requiresSurveyShortTerm = certData.requires_survey_short_term !== undefined ? certData.requires_survey_short_term : (certData.requires_survey === false ? false : type.requires_survey_short_term);
        const requiresSurveyFullTerm = certData.requires_survey_full_term !== undefined ? certData.requires_survey_full_term : (certData.requires_survey === false ? false : type.requires_survey_full_term);

        await type.update({
            ...certData,
            requires_survey_short_term: requiresSurveyShortTerm,
            requires_survey_full_term: requiresSurveyFullTerm
        }, { transaction: txn });

        if (required_documents) {
            // Re-create the required documents list for simplicity
            await db.CertificateRequiredDocument.destroy({ where: { certificate_type_id: id }, transaction: txn });
            if (required_documents.length > 0) {
                const docsToCreate = required_documents.map(doc => ({
                    certificate_type_id: id,
                    document_name: doc.document_name,
                    is_mandatory: doc.is_mandatory ?? true,
                    applies_to_term: doc.applies_to_term ?? 'FULL_TERM'
                }));
                await db.CertificateRequiredDocument.bulkCreate(docsToCreate, { transaction: txn });
            }
        }

        await txn.commit();
        return await getCertificateTypeById(id);
    } catch (e) {
        await txn.rollback();
        throw e;
    }
};

/** Deactivate (soft-delete) a certificate type. Sets status to INACTIVE.
 *  Cannot deactivate if there are active/valid certificates using this type. */
export const deactivateCertificateType = async (id) => {
    const type = await CertificateType.findByPk(id, { useMaster: true });
    if (!type) throw { statusCode: 404, message: 'Certificate type not found' };

    if (type.status === 'INACTIVE') {
        throw { statusCode: 409, message: 'Certificate type is already inactive.' };
    }

    // Guard: check for active/valid certificates using this type
    const activeCertCount = await db.Certificate.count({
        where: {
            certificate_type_id: id,
            status: { [Op.notIn]: ['REVOKED', 'EXPIRED'] }
        },
        useMaster: true
    });
    if (activeCertCount > 0) {
        throw {
            statusCode: 409,
            message: `Cannot deactivate: ${activeCertCount} active certificate${activeCertCount > 1 ? 's are' : ' is'} still using this type. Revoke or expire them first.`
        };
    }

    // Guard: check for pending/active jobs using this type
    const activeJobCount = await db.JobRequest.count({
        include: [{
            model: db.JobCertificate,
            as: 'certificates',
            where: { certificate_type_id: id },
            required: true
        }],
        where: {
            job_status: { [Op.notIn]: ['CERTIFIED', 'REJECTED', 'CANCELLED'] }
        },
        useMaster: true
    });
    if (activeJobCount > 0) {
        throw {
            statusCode: 409,
            message: `Cannot deactivate: ${activeJobCount} active job${activeJobCount > 1 ? 's are' : ' is'} still linked to this certificate type. Complete or cancel them first.`
        };
    }

    await type.update({ status: 'INACTIVE' });
    return { id: type.id, name: type.name, status: 'INACTIVE', message: 'Certificate type deactivated successfully.' };
};

/** Permanently delete a certificate type and all its associated templates, checklists, and certificates (ADMIN). */
export const deleteCertificateType = async (id) => {
    const type = await CertificateType.findByPk(id, { useMaster: true });
    if (!type) throw { statusCode: 404, message: 'Certificate type not found' };

    const transaction = await db.sequelize.transaction();
    try {
        // 1. Find and delete all Certificates of this type
        const certificates = await db.Certificate.findAll({
            where: { certificate_type_id: id },
            transaction
        });
        const certificateIds = certificates.map(c => c.id);

        if (certificateIds.length > 0) {
            // Delete CertificateHistory records
            await db.CertificateHistory.destroy({
                where: { certificate_id: { [Op.in]: certificateIds } },
                transaction
            });

            // Set generated_certificate_id to null in JobCertificates
            await db.JobCertificate.update(
                { generated_certificate_id: null },
                { where: { generated_certificate_id: { [Op.in]: certificateIds } }, transaction }
            );

            // Delete Certificate records
            await db.Certificate.destroy({
                where: { id: { [Op.in]: certificateIds } },
                transaction
            });
        }

        // 2. Find and delete all JobCertificates of this type
        const jobCertificates = await db.JobCertificate.findAll({
            where: { certificate_type_id: id },
            transaction
        });
        const jobCertificateIds = jobCertificates.map(jc => jc.id);

        if (jobCertificateIds.length > 0) {
            // Find related surveys
            const surveys = await db.Survey.findAll({
                where: { job_certificate_id: { [Op.in]: jobCertificateIds } },
                transaction
            });
            const surveyIds = surveys.map(s => s.id);

            if (surveyIds.length > 0) {
                // Delete survey status history
                await db.SurveyStatusHistory.destroy({
                    where: { survey_id: { [Op.in]: surveyIds } },
                    transaction
                });

                // Delete survey signed documents
                await db.SurveySignedDocument.destroy({
                    where: { survey_id: { [Op.in]: surveyIds } },
                    transaction
                });

                // Delete surveys
                await db.Survey.destroy({
                    where: { id: { [Op.in]: surveyIds } },
                    transaction
                });
            }

            // Delete JobDocuments
            await db.JobDocument.destroy({
                where: { job_certificate_id: { [Op.in]: jobCertificateIds } },
                transaction
            });

            // Delete ActivityPlanning (surveyor checklist answers)
            await db.ActivityPlanning.destroy({
                where: { job_certificate_id: { [Op.in]: jobCertificateIds } },
                transaction
            });

            // Delete GpsTracking
            await db.GpsTracking.destroy({
                where: { job_certificate_id: { [Op.in]: jobCertificateIds } },
                transaction
            });

            // Delete NonConformity
            await db.NonConformity.destroy({
                where: { job_certificate_id: { [Op.in]: jobCertificateIds } },
                transaction
            });

            // Delete JobCertificate records
            await db.JobCertificate.destroy({
                where: { id: { [Op.in]: jobCertificateIds } },
                transaction
            });
        }

        // 3. Delete Certificate Templates of this type
        await db.CertificateTemplate.destroy({
            where: { certificate_type_id: id },
            transaction
        });

        // 4. Find and delete Checklist Templates of this type
        const checklistTemplates = await db.ChecklistTemplate.findAll({
            where: { certificate_type_id: id },
            transaction
        });
        const checklistTemplateIds = checklistTemplates.map(ct => ct.id);

        if (checklistTemplateIds.length > 0) {
            // Delete ChecklistTemplateFiles
            await db.ChecklistTemplateFile.destroy({
                where: { checklist_template_id: { [Op.in]: checklistTemplateIds } },
                transaction
            });

            // Delete ChecklistTemplates
            await db.ChecklistTemplate.destroy({
                where: { id: { [Op.in]: checklistTemplateIds } },
                transaction
            });
        }

        // 5. Delete Certificate Required Documents
        await db.CertificateRequiredDocument.destroy({
            where: { certificate_type_id: id },
            transaction
        });

        // 6. Delete the Certificate Type itself
        await type.destroy({ transaction });

        await transaction.commit();
        return { id, name: type.name, message: 'Certificate type and all associated templates, certificates, and checklists deleted successfully.' };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};



/** List required documents for a certificate type. */
export const getCertificateTypeRequiredDocuments = async (certificateTypeId, query = {}) => {
    const term = query.term;
    const type = await CertificateType.findByPk(certificateTypeId, {
        attributes: ['id', 'name', 'status'],
    });
    if (!type) throw { statusCode: 404, message: 'Certificate type not found' };

    const where = { certificate_type_id: certificateTypeId };
    if (term) {
        where.applies_to_term = { [Op.in]: [term, 'BOTH'] };
    }

    return await db.CertificateRequiredDocument.findAll({
        where,
        attributes: ['id', 'certificate_type_id', 'document_name', 'is_mandatory', 'applies_to_term', 'createdAt', 'updatedAt'],
        order: [['document_name', 'ASC']],
        useReplica: true
    });
};

/** Add one required document for a certificate type. */
export const addCertificateTypeRequiredDocument = async (certificateTypeId, data) => {
    const type = await CertificateType.findByPk(certificateTypeId, { attributes: ['id'], useMaster: true });
    if (!type) throw { statusCode: 404, message: 'Certificate type not found' };

    const name = (data.document_name ?? '').trim();
    const existing = await db.CertificateRequiredDocument.findOne({
        where: { certificate_type_id: certificateTypeId, document_name: name },
        useMaster: true
    });
    if (existing) throw { statusCode: 409, message: 'Required document already exists for this certificate type' };

    return await db.CertificateRequiredDocument.create({
        certificate_type_id: certificateTypeId,
        document_name: name,
        is_mandatory: data.is_mandatory ?? true,
    });
};

/** Update one required document for a certificate type. */
export const updateCertificateTypeRequiredDocument = async (certificateTypeId, requiredDocumentId, data) => {
    const doc = await db.CertificateRequiredDocument.findByPk(requiredDocumentId, { useMaster: true });
    if (!doc) throw { statusCode: 404, message: 'Required document not found' };
    if (doc.certificate_type_id !== certificateTypeId) {
        throw { statusCode: 400, message: 'Required document does not belong to this certificate type' };
    }

    if (data.document_name) {
        const name = data.document_name.trim();
        const dup = await db.CertificateRequiredDocument.findOne({
            where: {
                certificate_type_id: certificateTypeId,
                document_name: name,
                id: { [Op.ne]: requiredDocumentId }
            },
            useMaster: true
        });
        if (dup) throw { statusCode: 409, message: 'Another required document with this name already exists' };
    }

    await doc.update({
        ...(data.document_name ? { document_name: data.document_name.trim() } : {}),
        ...(typeof data.is_mandatory === 'boolean' ? { is_mandatory: data.is_mandatory } : {}),
    });
    return doc;
};

/** Delete one required document for a certificate type. */
export const deleteCertificateTypeRequiredDocument = async (certificateTypeId, requiredDocumentId) => {
    const doc = await db.CertificateRequiredDocument.findByPk(requiredDocumentId, { useMaster: true });
    if (!doc) throw { statusCode: 404, message: 'Required document not found' };
    if (doc.certificate_type_id !== certificateTypeId) {
        throw { statusCode: 400, message: 'Required document does not belong to this certificate type' };
    }

    const usedCount = await db.JobDocument.count({ where: { required_document_id: requiredDocumentId }, useMaster: true });
    if (usedCount > 0) {
        throw { statusCode: 409, message: 'Cannot delete: required document is already used in jobs' };
    }

    await doc.destroy();
    return { deleted: true };
};

const generateUniqueCertificateNumber = async (typeCode = null) => {
    const year = new Date().getFullYear();
    let isUnique = false;
    let certNumber;

    while (!isUnique) {
        const randomStr = uuidv4().substring(0, 8).toUpperCase();
        // Format: GR/TYPE/YEAR/RANDOM or GR/YEAR/RANDOM
        if (typeCode) {
            certNumber = `GR/${typeCode}/${year}/${randomStr}`;
        } else {
            certNumber = `GR/${year}/${randomStr}`;
        }
        
        const existing = await Certificate.findOne({ where: { certificate_number: certNumber }, useMaster: true });
        if (!existing) {
            isUnique = true;
        }
    }
    return certNumber;
};

const _loadStampBase64 = async () => _readLocalPaymentsAssetBase64('Gr-class-stamp.png');

const _applySignatureAndStampToHtml = async (html, cert, transaction = null, { forPreview = false, user = null } = {}) => {
    if (!html) return html;
    let out = html;
    try {
        if (forPreview) {
            const [signatureSrc, stampBase64] = await Promise.all([
                resolveCertificateSignatureForPreview(cert, user, transaction),
                _loadStampBase64(),
            ]);
            if (signatureSrc) {
                out = out.replaceAll('{signature}', signatureSrc);
            }
            if (stampBase64) {
                out = out.replaceAll('{stamp}', stampBase64);
            }
        } else {
            const [signatureBase64, stampBase64] = await Promise.all([
                resolveCertificateSignatureBase64(cert, transaction),
                _loadStampBase64(),
            ]);
            if (signatureBase64) {
                out = out.replaceAll('{signature}', signatureBase64);
            }
            if (stampBase64) {
                out = out.replaceAll('{stamp}', stampBase64);
            }
        }
    } catch (err) {
        logger.error('Error applying signature/stamp to certificate HTML:', err);
    }
    return out;
};

/** Resolve S3 keys and non-absolute img src values to CDN or signed URLs for browser preview. */
const _resolveHtmlAssetUrls = async (html, user) => {
    if (!html || typeof html !== 'string') return html;

    const resolveSrc = async (src) => {
        const trimmed = (src || '').trim();
        if (
            !trimmed ||
            trimmed.startsWith('data:') ||
            trimmed.startsWith('http://') ||
            trimmed.startsWith('https://') ||
            trimmed.startsWith('//') ||
            trimmed.startsWith('{')
        ) {
            return trimmed;
        }
        try {
            const cdnUrl = fileAccessService.generatePublicCdnUrl(trimmed);
            if (cdnUrl) return cdnUrl;
            const resolved = await fileAccessService.resolveUrl(trimmed, user, true);
            return resolved || trimmed;
        } catch {
            return trimmed;
        }
    };

    let out = html;
    const imgTagRegex = /<img([^>]*?)src=["']([^"']+)["']([^>]*)>/gi;
    const matches = [...html.matchAll(imgTagRegex)];
    const replacements = await Promise.all(
        matches.map(async (match) => {
            const [fullTag, before, src, after] = match;
            const resolvedSrc = await resolveSrc(src);
            if (resolvedSrc && resolvedSrc !== src) {
                return { fullTag, replacement: `<img${before}src="${resolvedSrc}"${after}>` };
            }
            return null;
        }),
    );
    for (const item of replacements) {
        if (item) {
            out = out.replace(item.fullTag, item.replacement);
        }
    }
    return out;
};

const _assembleCertificateHtml = async (cert, user, transaction = null, { persistUpdates = true } = {}) => {
    const jobId = cert.job_id;
    const certificateNumber = cert.certificate_number;

    if (cert.custom_html) {
        let flagStateName = '';
        let flagLogo = null;
        if (cert.flag_administration_id || cert.FlagState) {
            const flag = cert.FlagState || await db.FlagAdministration.findByPk(cert.flag_administration_id, { transaction });
            if (flag) {
                flagStateName = flag.flag_state_name || '';
                if (flag.logo_url) {
                    flagLogo = await fileAccessService.resolveUrl(flag.logo_url, user, true);
                }
            }
        }
        let finalHtml = certificatePdfService.updateFieldsInHtml(cert.custom_html, {
            certificate_number: certificateNumber,
            issue_date: cert.issue_date,
            expiry_date: cert.expiry_date,
            flag_state: flagStateName,
            flag_logo: flagLogo,
        });
        finalHtml = certificatePdfService.updateRemarksInHtml(finalHtml, cert.remarks);
        finalHtml = cleanCustomHtml(finalHtml);
        if (persistUpdates && finalHtml !== cert.custom_html) {
            await cert.update({ custom_html: finalHtml }, { transaction });
        }
        return finalHtml;
    }

    const grClassLogo = 'https://grclass.com/grclass-logo.webp';
    let flagLogo = null;
    if (cert.flag_administration_id || cert.FlagState) {
        const flag = cert.FlagState || await db.FlagAdministration.findByPk(cert.flag_administration_id, { transaction });
        if (flag?.logo_url) {
            flagLogo = await fileAccessService.resolveUrl(flag.logo_url, user, true);
        }
    }
    const issuingAuthority = cert.CertificateType?.issuing_authority === 'FLAG'
        ? (cert.FlagState?.flag_state_name || 'Flag Administration')
        : 'GR CLASS';

    const dynamicTagsRaw = jobId ? await buildTagValuesForJob(jobId) : {};
    const { signature: _omitSig, stamp: _omitStamp, ...dynamicTags } = dynamicTagsRaw;

    const certType = cert.CertificateType;
    const term = cert.certificate_term || 'FULL_TERM';
    const isSurveyReq = certType
        ? (term === 'SHORT_TERM' ? certType.requires_survey_short_term : certType.requires_survey_full_term)
        : false;

    const formatDate = (v) => {
        if (!v) return '';
        try {
            const d = (v instanceof Date) ? v : new Date(v);
            if (Number.isNaN(d.getTime())) return String(v);
            return d.toISOString().slice(0, 10);
        } catch {
            return String(v);
        }
    };

    const allDataSources = {
        ...dynamicTags,
        vessel_name: cert.Vessel?.vessel_name || 'Company Wide',
        imo_number: cert.Vessel?.imo_number || 'N/A',
        call_sign: cert.Vessel?.call_sign || 'N/A',
        mmsi_number: cert.Vessel?.mmsi_number || 'N/A',
        port_of_registry: cert.Vessel?.port_of_registry || 'N/A',
        year_built: cert.Vessel?.year_built || 'N/A',
        ship_type: cert.Vessel?.ship_type || 'N/A',
        gross_tonnage: cert.Vessel?.gross_tonnage || 'N/A',
        net_tonnage: cert.Vessel?.net_tonnage || 'N/A',
        deadweight: cert.Vessel?.deadweight || 'N/A',
        ballast_water_capacity: cert.Vessel?.ballast_water_capacity || 'N/A',
        company_name: cert.Vessel?.Client?.company_name || cert.Client?.company_name || '',
        company_address: cert.Vessel?.Client?.address || cert.Client?.address || '',
        company_id_number: cert.Vessel?.Client?.company_id_number || cert.Client?.company_id_number || '',
        certificate_number: certificateNumber,
        certificate_type: cert.CertificateType?.name || '',
        issue_date: formatDate(cert.issue_date),
        expiry_date: formatDate(cert.expiry_date),
        remarks: certificatePdfService.formatRemarksHtml(cert.remarks),
        survey_completion_date: isSurveyReq
            ? (dynamicTags.survey_completed_date || formatDate(cert.issue_date))
            : 'Remotely Surveyed',
        certificate_term: cert.certificate_term || '',
        issuing_authority: issuingAuthority,
        flag_state: cert.FlagState?.flag_state_name || '',
        port: dynamicTags.place_of_survey || '',
        place: dynamicTags.place_of_survey || '',
        surveyor_name: dynamicTags.surveyor_name || '',
        gr_class_logo: grClassLogo,
        flag_logo: flagLogo,
    };

    let template = null;
    if (cert.certificate_term) {
        template = await db.CertificateTemplate.findOne({
            where: {
                certificate_type_id: cert.certificate_type_id,
                is_active: true,
                certificate_term: cert.certificate_term,
            },
            order: [['createdAt', 'DESC']],
            transaction,
        });
        if (!template) {
            throw { statusCode: 400, message: `No active certificate template found for term ${cert.certificate_term}` };
        }
    } else {
        template = await db.CertificateTemplate.findOne({
            where: {
                certificate_type_id: cert.certificate_type_id,
                is_active: true,
                certificate_term: null,
            },
            order: [['createdAt', 'DESC']],
            transaction,
        });
        if (!template) {
            throw { statusCode: 400, message: 'No active default certificate template found' };
        }
    }

    if (!template?.template_content) {
        throw { statusCode: 400, message: 'No valid template content found for this certificate.' };
    }

    const verificationUrl = env.certificateVerifyPublicUrl.replace('{number}', encodeURIComponent(certificateNumber));
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, { width: 120, margin: 1 });

    allDataSources.qr_code = `<img src="${qrDataUrl}" style="width:120px;height:120px;" alt="QR Code"/>`;
    allDataSources.qr_data_url = qrDataUrl;
    allDataSources.qr_code_url = qrDataUrl;

    const filledHtml = certificatePdfService.fillTemplate(template.template_content, allDataSources);
    let compiledHtml = filledHtml.includes('<html') ? filledHtml : certificatePdfService.wrapHtmlForPdf(filledHtml);
    compiledHtml = certificatePdfService.updateRemarksInHtml(compiledHtml, cert.remarks);
    const finalHtml = cleanCustomHtml(compiledHtml);

    if (persistUpdates) {
        await cert.update({ custom_html: finalHtml }, { transaction });
    }
    return finalHtml;
};

export const _generateCertificateFile = async (cert, user, transaction = null) => {
    try {
        const certificateNumber = cert.certificate_number;
        let finalHtml = await _assembleCertificateHtml(cert, user, transaction, { persistUpdates: true });
        finalHtml = await _applySignatureAndStampToHtml(finalHtml, cert, transaction);

        const pdfBuffer = await certificatePdfService.htmlToPdfBuffer(finalHtml);
        const fileUrl = await s3Service.uploadFile(
            pdfBuffer,
            `${certificateNumber}.pdf`,
            'application/pdf',
            s3Service.UPLOAD_FOLDERS.CERTIFICATES
        );

        await cert.update({ pdf_file_url: fileUrl, generated_pdf_url: fileUrl }, { transaction });
        return fileUrl;
    } catch (err) {
        logger.error('Error in _generateCertificateFile', { certId: cert.id, err: err.message });
        throw err;
    }
};

const PDF_GENERATION_INCLUDES = [
    {
        model: db.Vessel,
        include: [{ model: db.Client, as: 'Client', attributes: ['company_name', 'address', 'company_id_number'] }],
    },
    { model: db.Client, as: 'Client', attributes: ['id', 'company_name', 'address', 'company_id_number'] },
    { model: db.CertificateType },
    { model: db.FlagAdministration, as: 'FlagState' },
];

const PREVIEW_INCLUDES = [
    { model: db.CertificateType, attributes: ['id', 'signature_url', 'issuing_authority', 'name', 'requires_survey_short_term', 'requires_survey_full_term'] },
    { model: db.FlagAdministration, as: 'FlagState', attributes: ['flag_state_name', 'logo_url'] },
];

const loadCertificateForPdfGeneration = async (certificateId, transaction = null) =>
    Certificate.findByPk(certificateId, {
        useMaster: true,
        transaction,
        include: PDF_GENERATION_INCLUDES,
    });

const loadCertificateForPreview = async (certificateId, scopeWhere = {}, transaction = null) =>
    Certificate.findOne({
        where: { id: certificateId, ...scopeWhere },
        useMaster: true,
        transaction,
        include: PREVIEW_INCLUDES,
    });

const attachPdfSignedUrls = async (cert, user) => {
    if (cert?.pdf_file_url) {
        const key = fileAccessService.getKeyFromUrl(cert.pdf_file_url);
        let pdfUrl = fileAccessService.generatePublicCdnUrl(key);
        if (!pdfUrl) {
            pdfUrl = await fileAccessService.generateSignedUrl(key, 3600, user);
        }
        cert.setDataValue('pdf_url', pdfUrl);
    }
    if (cert?.generated_pdf_url) {
        const key2 = fileAccessService.getKeyFromUrl(cert.generated_pdf_url);
        let genPdfUrl = fileAccessService.generatePublicCdnUrl(key2);
        if (!genPdfUrl) {
            genPdfUrl = await fileAccessService.generateSignedUrl(key2, 3600, user);
        }
        cert.setDataValue('generated_pdf_signed_url', genPdfUrl);
    }
    return cert;
};

const needsPdfRegeneration = (cert) =>
    !cert?.pdf_file_url || cert.status === 'DRAFT';

/** Background / queue worker entry — generates PDF on EC2 when SQS is not used. */
export const generateCertificatePdfById = async (certificateId, userId) => {
    const cert = await loadCertificateForPdfGeneration(certificateId);
    if (!cert) {
        logger.warn('[pdf] Background generation skipped — certificate not found', { certificateId });
        return null;
    }
    let user = null;
    if (userId) {
        user = await db.User.findByPk(userId, { attributes: ['id', 'role', 'client_id', 'email'] });
    }
    if (!user) {
        user = { id: userId || null, role: 'ADMIN' };
    }
    await _generateCertificateFile(cert, user);
    return cert.id;
};

/**
 * Sync PDF generation for download — always runs on EC2 so the user gets the file immediately.
 */
export const prepareCertificateDownload = async (id, user) => {
    const scopeWhere = await getCertificateScopeFilter(user);
    const exists = await Certificate.findOne({ where: { id, ...scopeWhere }, attributes: ['id'] });
    if (!exists) {
        const any = await Certificate.findByPk(id, { attributes: ['id'] });
        if (any) {
            throw { statusCode: 403, message: 'You do not have access to this certificate' };
        }
        throw { statusCode: 404, message: 'Certificate not found' };
    }

    let cert = await loadCertificateForPdfGeneration(id);
    if (needsPdfRegeneration(cert)) {
        await _generateCertificateFile(cert, user);
        cert = await loadCertificateForPdfGeneration(id);
    }

    if (!cert?.pdf_file_url) {
        throw { statusCode: 500, message: 'Certificate PDF could not be generated' };
    }

    await attachPdfSignedUrls(cert, user);
    return cert;
};

/** Browser-ready HTML preview with resolved signature, stamp, and CDN/signed asset URLs. */
export const getCertificatePreviewHtml = async (id, user) => {
    const scopeWhere = await getCertificateScopeFilter(user);
    let cert = await loadCertificateForPreview(id, scopeWhere);
    if (!cert) {
        const any = await Certificate.findByPk(id, { attributes: ['id'] });
        if (any) {
            throw { statusCode: 403, message: 'You do not have access to this certificate' };
        }
        throw { statusCode: 404, message: 'Certificate not found' };
    }

    if (!cert.custom_html?.trim()) {
        cert = await loadCertificateForPdfGeneration(id);
    }

    let html = await _assembleCertificateHtml(cert, user, null, { persistUpdates: false });
    html = await _applySignatureAndStampToHtml(html, cert, null, { forPreview: true, user });
    html = await _resolveHtmlAssetUrls(html, user);
    return { html };
};

export const verifyTemplateExists = async (certificateTypeId, term, transaction = null) => {
    const template = await db.CertificateTemplate.findOne({
        where: {
            certificate_type_id: certificateTypeId,
            is_active: true,
            certificate_term: term || null,
        },
        transaction,
        useMaster: true
    });
    if (!template) {
        throw {
            statusCode: 400,
            message: `No active certificate template found for term ${term || 'default'}`
        };
    }
    return template;
};

export const generateCertificate = async (data, user) => {
    if (!isRoleAllowed(RBAC.GENERATE_CERTIFICATE, user.role)) {
        throw { statusCode: 403, message: 'Only Admins, General Managers, or Technical Managers have permission to generate certificates.' };
    }
    const userId = user.id;
    const { job_id, job_certificate_id, validity_years, issue_date, expiry_date, flag_administration_id, certificate_term } = data;

    // Support both job_certificate_id (new) and job_id (legacy)
    let resolvedJobId = job_id;
    let jobCert = null;
    if (job_certificate_id) {
        jobCert = await db.JobCertificate.findByPk(job_certificate_id, { useMaster: true });
        if (!jobCert) throw { statusCode: 404, message: 'Job certificate not found' };
        resolvedJobId = jobCert.job_request_id;
    }

    const transaction = await db.sequelize.transaction();
    try {
        // Lock Job row for the entire operation
        const job = await JobRequest.findByPk(resolvedJobId, {
            transaction,
            lock: transaction.LOCK.UPDATE,
            include: [
                { model: db.Vessel, attributes: ['id', 'vessel_name', 'imo_number'] },
            ],
        });
        if (!job) throw { statusCode: 404, message: 'Job not found' };

        if (!jobCert) {
            // For multi-cert jobs, always require job_certificate_id to avoid ambiguity
            const allJobCerts = await db.JobCertificate.findAll({
                where: { job_request_id: resolvedJobId },
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (allJobCerts.length > 1) {
                throw {
                    statusCode: 400,
                    message: 'This job has multiple certificates. Please specify job_certificate_id to generate a certificate for a specific one.'
                };
            }
            jobCert = allJobCerts[0] || null;
        }

        // ── Resolve certificate type from JobCertificate ──
        const certTypeId = jobCert?.certificate_type_id;
        if (!certTypeId) throw { statusCode: 400, message: 'Certificate type not found for this job/certificate' };

        const certType = await db.CertificateType.findByPk(certTypeId, { attributes: ['id', 'name', 'issuing_authority', 'short_code', 'requires_survey', 'requires_survey_short_term', 'requires_survey_full_term'], transaction });
        if (!certType) throw { statusCode: 404, message: 'Certificate type not found' };

        const term = certificate_term || jobCert?.certificate_term || 'FULL_TERM';
        if (!term || !['FULL_TERM', 'SHORT_TERM'].includes(term)) {
            throw { statusCode: 400, message: 'Certificate term is required and must be either FULL_TERM or SHORT_TERM.' };
        }

        await verifyTemplateExists(certTypeId, term, transaction);

        const isSurveyReq = term === 'SHORT_TERM' ? certType.requires_survey_short_term : certType.requires_survey_full_term;

        // ── Guard 1: Status Check ──
        const targetStatus = jobCert ? jobCert.status : job.job_status;
        let allowedStatuses = jobCert
            ? ['SURVEY_DONE', 'REWORK_REQUESTED']
            : ['FINALIZED', 'PAYMENT_DONE', 'REWORK_REQUESTED', 'SURVEY_DONE', 'REVIEWED'];

        if (jobCert && !isSurveyReq) {
            if (!job.approved_by_user_id) {
                throw {
                    statusCode: 400,
                    message: `Certificate can only be generated after the job request has been approved by a General Manager.`
                };
            }
            const requiredDocsCount = await db.CertificateRequiredDocument.count({
                where: {
                    certificate_type_id: certTypeId,
                    applies_to_term: { [Op.in]: [term, 'BOTH'] }
                },
                transaction
            });
            const needsVerification = requiredDocsCount > 0;
            allowedStatuses = needsVerification
                ? ['DOCUMENT_VERIFIED', 'SURVEY_DONE', 'REWORK_REQUESTED']
                : ['PENDING', 'DOCUMENT_VERIFIED', 'SURVEY_DONE', 'REWORK_REQUESTED'];
        }

        if (!allowedStatuses.includes(targetStatus)) {
            throw {
                statusCode: 400,
                message: `Certificate can only be generated when status is ${allowedStatuses.join(', ')}. Current: ${targetStatus}`,
            };
        }

        // ── Guard 2: Survey Compliance (if required) ──
        if (isSurveyReq) {
            let surveyQuery;
            if (jobCert) {
                surveyQuery = { job_certificate_id: jobCert.id };
            } else {
                const fallbackCerts = await db.JobCertificate.findAll({
                    where: { job_request_id: resolvedJobId },
                    transaction
                });
                surveyQuery = { job_certificate_id: { [Op.in]: fallbackCerts.map(jc => jc.id) } };
            }
            const survey = await db.Survey.findOne({ where: surveyQuery, transaction, lock: transaction.LOCK.UPDATE });
            if (!survey) throw { statusCode: 400, message: 'Cannot generate certificate: Survey not found.' };
            if (survey.survey_status !== 'FINALIZED') {
                throw { statusCode: 400, message: 'Cannot generate certificate: Survey must be FINALIZED first.' };
            }
            if (survey.survey_statement_status !== 'ISSUED') {
                throw { statusCode: 400, message: 'Certificate cannot be generated before Survey Statement is issued.' };
            }
        }

        // ── Guard 3: No certificate already linked to this job/cert ──
        if ((jobCert && jobCert.generated_certificate_id) || job.generated_certificate_id) {
            throw { statusCode: 409, message: 'A draft or certificate already exists for this job/certificate.' };
        }
        const existingCertWhere = { certificate_type_id: certTypeId, status: 'VALID' };
        if (job.vessel_id) {
            existingCertWhere.vessel_id = job.vessel_id;
        } else {
            existingCertWhere.client_id = job.client_id;
        }
        const existingCert = await Certificate.findOne({ where: existingCertWhere, transaction });
        if (existingCert) {
            logger?.warn('Possible duplicate certificate attempt', { job_id: resolvedJobId, existing_cert_id: existingCert.id });
        }

        // ── Guard 4: No open Non-Conformities ──
        if (db.NonConformity) {
            const ncWhere = {
                job_id: resolvedJobId,
                status: { [Op.notIn]: ['CLOSED', 'RESOLVED'] },
            };
            if (jobCert?.id) {
                ncWhere[Op.or] = [
                    { job_certificate_id: jobCert.id },
                    { job_certificate_id: null },
                ];
            }
            const openNCs = await db.NonConformity.count({ where: ncWhere, transaction });
            if (openNCs > 0) {
                throw { statusCode: 400, message: `Cannot generate certificate: ${openNCs} open non-conformit${openNCs > 1 ? 'ies' : 'y'} must be resolved first.` };
            }
        }

        const issueDate = issue_date ? new Date(issue_date) : new Date();
        let expiryDate;
        if (expiry_date) {
            expiryDate = new Date(expiry_date);
        } else {
            expiryDate = new Date(issueDate);
            expiryDate.setFullYear(issueDate.getFullYear() + (validity_years || 1));
            // In maritime, certificates usually expire the day before their anniversary
            expiryDate.setDate(expiryDate.getDate() - 1);
        }
        const certificateNumber = await generateUniqueCertificateNumber(certType?.short_code);

        const cert = await Certificate.create({
            vessel_id: job.vessel_id || null,
            client_id: job.client_id || null,
            job_id: job.id,
            certificate_type_id: certTypeId,
            certificate_number: certificateNumber,
            issue_date: issueDate,
            expiry_date: expiryDate,
            status: 'DRAFT',
            source_type: 'INTERNAL',
            version: 1,
            issued_by_user_id: userId,
            flag_administration_id: flag_administration_id || null,
            certificate_term: term,
        }, { transaction });

        // Add history for initial draft
        await db.CertificateHistory.create({
            certificate_id: cert.id,
            status: 'DRAFT',
            changed_by_user_id: userId,
            change_reason: 'Draft certificate generated from job',
            changed_at: new Date()
        }, { transaction });

        // Link draft certificate to JobCertificate; ISSUED status is set in issueCertificate via lifecycle sync
        if (jobCert) {
            await jobCert.update({ generated_certificate_id: cert.id }, { transaction });
        } else {
            await job.update({ generated_certificate_id: cert.id }, { transaction });
        }

        await AuditLog.create({
            user_id: userId, action: 'GENERATE_CERTIFICATE',
            entity_name: 'Certificate', entity_id: cert.id,
            old_values: null,
            new_values: { job_id: resolvedJobId, certificate_number: certificateNumber, certificate_type_id: certTypeId, vessel_id: cert.vessel_id }
        }, { transaction });

        await transaction.commit();

        const finalCert = await Certificate.findByPk(cert.id, {
            useMaster: true,
            include: [
                { model: db.Vessel, attributes: ['vessel_name', 'imo_number'] },
                { model: db.CertificateType, attributes: ['name'] },
            ],
        });

        // PDF is generated on download — not during draft creation (keeps API fast).
        (async () => {
            try {
                const vesselId = job.vessel_id;
                const vesselFull = await db.Vessel.findByPk(vesselId, { attributes: ['client_id'] });

                const commonData = {
                    certificateNumber,
                    vesselName: job.Vessel?.vessel_name,
                    certificateType: certType?.name,
                    expiryDate: expiryDate.toLocaleDateString(),
                    jobId: job.id,
                    status: 'ISSUED',
                };

                if (vesselFull?.client_id) {
                    const clientUsers = await db.User.findAll({
                        where: { client_id: vesselFull.client_id, role: 'CLIENT', status: 'ACTIVE' },
                        attributes: ['email'],
                    });
                    const clientEmails = clientUsers.map((u) => u.email);
                    if (clientEmails.length > 0) {
                        await emailService.sendTemplateEmail(clientEmails, 'CERTIFICATE_GENERATED', {
                            ...commonData,
                            isInternal: false,
                        });
                    }
                }

                const internalUsers = await db.User.findAll({
                    where: { role: { [Op.in]: ['GM', 'TM'] }, status: 'ACTIVE' },
                    attributes: ['email'],
                });
                const internalEmails = internalUsers.map((u) => u.email);

                if (job.assigned_surveyor_id) {
                    const surveyor = await db.User.findByPk(job.assigned_surveyor_id, { attributes: ['email'] });
                    if (surveyor?.email && !internalEmails.includes(surveyor.email)) {
                        internalEmails.push(surveyor.email);
                    }
                }

                if (internalEmails.length > 0) {
                    await emailService.sendTemplateEmail(internalEmails, 'CERTIFICATE_GENERATED', {
                        ...commonData,
                        isInternal: true,
                    });
                }
            } catch (err) {
                logger.error('Failed to dispatch certificate generation emails', {
                    certificateNumber,
                    err: err.message,
                });
            }
        })();

        return finalCert;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

export const getCertificates = async (query, user) => {
    const ALLOWED_CERT_LIST_FILTERS = ['vessel_id', 'client_id', 'certificate_type_id', 'status'];

    const scopeWhere = await getCertificateScopeFilter(user);
    const { page = 1, limit = 10, ...rest } = query;
    const where = { ...scopeWhere };
    ALLOWED_CERT_LIST_FILTERS.forEach((key) => {
        if (rest[key] != null && rest[key] !== '') {
            where[key] = rest[key];
        }
    });

    if (query.search && String(query.search).trim().length >= 3) {
        const term = String(query.search).trim();
        where[Op.or] = [
            { certificate_number: { [Op.like]: `%${term}%` } },
            { '$Vessel.vessel_name$': { [Op.like]: `%${term}%` } },
            { '$CertificateType.name$': { [Op.like]: `%${term}%` } }
        ];
    }

    if (rest.expiring_within_days != null && rest.expiring_within_days !== '') {
        const days = Math.max(1, parseInt(rest.expiring_within_days, 10) || 30);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(today);
        target.setDate(today.getDate() + days);
        target.setHours(23, 59, 59, 999);
        where.status = where.status || 'VALID';
        where.expiry_date = { [Op.between]: [today, target] };
    }

    const vesselInclude = {
        model: db.Vessel,
        attributes: ['id', 'vessel_name', 'imo_number', 'client_id'],
        include: [{ model: db.Client, as: 'Client', attributes: ['id', 'company_name'] }]
    };

    if (rest.client_id != null && rest.client_id !== '') {
        // Enforce either direct client_id on the certificate (for company certificates)
        // or through the associated vessel's client_id.
        where[Op.or] = [
            { client_id: rest.client_id },
            { '$Vessel.client_id$': rest.client_id }
        ];
        // Clean up direct client_id filter so it doesn't try to query { client_id: rest.client_id } as an AND condition
        delete where.client_id;
    }

    const { count, rows } = await Certificate.findAndCountAll({
        where,
        attributes: ['id', 'vessel_id', 'client_id', 'certificate_type_id', 'certificate_number', 'issue_date', 'expiry_date', 'status', 'createdAt', 'source_type', 'pdf_file_url', 'uploaded_file_url', 'generated_pdf_url', 'manually_overridden_file_url'],
        limit: Math.min(parseInt(limit, 10) || 10, 100),
        offset: (Math.max(1, parseInt(page, 10)) - 1) * (parseInt(limit, 10) || 10),
        include: [
            vesselInclude,
            { model: db.Client, as: 'Client', attributes: ['id', 'company_name'] },
            { model: db.CertificateType, attributes: ['id', 'name'] }
        ],
        order: [['createdAt', 'DESC']],
        subQuery: false,
        useReplica: true
    });

    // Calculate status counts
    const statusWhere = { ...where };
    delete statusWhere.status;
    
    const statusCounts = await Certificate.findAll({
        where: statusWhere,
        attributes: [
            [db.sequelize.col('Certificate.status'), 'status'],
            [db.sequelize.fn('COUNT', db.sequelize.col('Certificate.status')), 'count']
        ],
        include: [vesselInclude],
        group: [db.sequelize.col('Certificate.status')],
        raw: true,
        useReplica: true
    });

    const resolvedRows = await fileAccessService.resolveEntity(rows, user);

    const todayVal = new Date();
    todayVal.setHours(0, 0, 0, 0);
    const targetVal = new Date(todayVal);
    targetVal.setDate(todayVal.getDate() + 30);
    targetVal.setHours(23, 59, 59, 999);
    
    const expiringCount = await Certificate.count({
        where: {
            ...statusWhere,
            status: 'VALID',
            expiry_date: { [Op.between]: [todayVal, targetVal] }
        },
        include: [vesselInclude],
        useReplica: true
    });

    const pageLimit = parseInt(limit, 10) || 10;
    return {
        total: count,
        page: parseInt(page),
        limit: pageLimit,
        totalPages: Math.ceil(count / pageLimit),
        status_counts: buildFullStatusCounts(statusCounts, CERTIFICATE_STATUSES),
        expiring_count: expiringCount,
        rows: resolvedRows.map(flatCertificateListRow),
    };
};

export const getCertificatesByVessel = async (vesselId, user) => {
    const scopeWhere = await getCertificateScopeFilter(user);
    // Security check: ensure user can access this vessel based on scope
    // The scopeWhere usually restricts by vessel_id list. We combine it.
    const where = { ...scopeWhere, vessel_id: vesselId };

    // Explicitly check if scopeWhere allows this vesselId if it has restrictions
    if (scopeWhere.vessel_id && scopeWhere.vessel_id[Op.in]) {
        if (!scopeWhere.vessel_id[Op.in].includes(vesselId) && !scopeWhere.vessel_id[Op.in].includes(null)) { // Handle [null] case for no access
            // In some cases Op.in might be complex, but for our simple scope builder:
            // If user scope restricts vessels, we must ensure requested vesselId is allowed.
            // Ideally simply querying with { ...scopeWhere, vessel_id: vesselId } handles it implicitly.
            // If scopeWhere says vessel_id IN [A, B] and we ask for C, result is empty. Correct.
        }
    }

    const certs = await Certificate.findAll({
        where,
        attributes: ['id', 'vessel_id', 'certificate_type_id', 'certificate_number', 'issue_date', 'expiry_date', 'status', 'createdAt', 'source_type', 'pdf_file_url', 'uploaded_file_url', 'generated_pdf_url', 'manually_overridden_file_url'],
        include: [{ model: db.CertificateType, attributes: ['name'] }],
        order: [['expiry_date', 'ASC']],
        useReplica: true
    });
    const resolvedCerts = await fileAccessService.resolveEntity(certs, user);
    return resolvedCerts.map(flatCertificateListRow);
};

/** Get certificate generated for a specific job. */
export const getCertificateByJobId = async (jobId, user) => {
    const jobCert = await db.JobCertificate.findOne({
        where: { job_request_id: jobId, generated_certificate_id: { [Op.ne]: null } },
        attributes: ['generated_certificate_id']
    });

    if (!jobCert) {
        throw { statusCode: 404, message: 'Certificate not yet generated for this job' };
    }

    return await getCertificateById(jobCert.generated_certificate_id, user);
};

/** Returns certificate by id. Throws 403 if certificate exists but user has no access (ownership scope). */
export const getCertificateById = async (id, user) => {
    const scopeWhere = await getCertificateScopeFilter(user);
    const cert = await Certificate.findOne({
        where: { id, ...scopeWhere },
        include: [
            { model: db.Vessel, attributes: ['vessel_name', 'imo_number'] }, 
            { model: db.Client, as: 'Client', attributes: ['id', 'company_name', 'address', 'company_id_number'] },
            { model: db.CertificateType, attributes: ['name', 'signature_url'] },
            { model: db.JobRequest, attributes: ['id', 'job_request_number'] },
            { model: db.FlagAdministration, as: 'FlagState', attributes: ['id', 'flag_state_name', 'logo_url'] }
        ],
    });
    if (cert) {
        await attachPdfSignedUrls(cert, user);

        return await fileAccessService.resolveEntity(cert, user);
    }
    const exists = await Certificate.findByPk(id);
    if (exists) {
        logger.warn('Certificate access denied', { userId: user?.id, role: user?.role, certificateId: id });
        throw { statusCode: 403, message: 'You do not have access to this certificate' };
    }
    throw { statusCode: 404, message: 'Certificate not found' };
};

const CERT_TRANSITIONS = {
    ISSUED: ['SUSPENDED', 'REVOKED', 'EXPIRED'],
    VALID: ['SUSPENDED', 'REVOKED', 'EXPIRED'], // legacy/external
    SUSPENDED: ['ISSUED', 'VALID', 'REVOKED'],
    REVOKED: [],
    EXPIRED: ['ISSUED', 'VALID'],
    DOWNGRADED: ['REVOKED'],
    TRANSFERRED: ['REVOKED']
};

export const updateStatus = async (id, status, reason, userId) => {
    const cert = await Certificate.findByPk(id, { useMaster: true });
    if (!cert) throw { statusCode: 404, message: 'Certificate not found' };

    if (!CERT_TRANSITIONS[cert.status]?.includes(status)) {
        throw { statusCode: 400, message: `Invalid certificate status transition: ${cert.status} → ${status}` };
    }
    if (cert.status === 'REVOKED') throw { statusCode: 400, message: 'Revoked certificates cannot be modified.' };

    await cert.update({ status });

    await db.CertificateHistory.create({
        certificate_id: cert.id,
        status: status,
        changed_by_user_id: userId,
        change_reason: reason,
        changed_at: new Date()
    });

    return cert;
};

export const renewCertificate = async (id, validityYears, reason, userId) => {
    const oldCert = await Certificate.findByPk(id, { include: [db.CertificateType], useMaster: true });
    if (!oldCert) throw { statusCode: 404, message: 'Certificate not found' };

    await oldCert.update({ status: 'EXPIRED' });

    const issueDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(issueDate.getFullYear() + validityYears);

    const newCert = await Certificate.create({
        vessel_id: oldCert.vessel_id,
        certificate_type_id: oldCert.certificate_type_id,
        certificate_number: await generateUniqueCertificateNumber(oldCert.CertificateType?.short_code),
        issue_date: issueDate,
        expiry_date: expiryDate,
        status: 'DRAFT', // Using DRAFT instead of VALID so admins can generate a new PDF
        certificate_term: oldCert.certificate_term,
        flag_administration_id: oldCert.flag_administration_id,
        issued_by_user_id: userId
    });

    await db.CertificateHistory.create({
        certificate_id: oldCert.id,
        status: 'RENEWED',
        changed_by_user_id: userId,
        change_reason: `Renewed. New Cert: ${newCert.certificate_number}`,
        changed_at: new Date()
    });

    return newCert;
};

export const updateDraft = async (id, data, user) => {
    const cert = await Certificate.findByPk(id, { useMaster: true });
    if (!cert) throw { statusCode: 404, message: 'Certificate not found' };
    if (cert.status !== 'DRAFT') throw { statusCode: 400, message: 'Only draft certificates can be updated' };

    const { flag_administration_id, certificate_term, remarks, issue_date, expiry_date, signature_url } = data;
    
    if (certificate_term !== undefined) {
        await verifyTemplateExists(cert.certificate_type_id, certificate_term);
    }
    
    let updatedHtml = cert.custom_html;
    if (updatedHtml) {
        const updates = {};
        if (issue_date !== undefined) updates.issue_date = issue_date;
        if (expiry_date !== undefined) updates.expiry_date = expiry_date;
        if (flag_administration_id !== undefined) {
            let flagStateName = '';
            let flagLogo = null;
            if (flag_administration_id) {
                const flag = await db.FlagAdministration.findByPk(flag_administration_id);
                if (flag) {
                    flagStateName = flag.flag_state_name || '';
                    if (flag.logo_url) {
                        flagLogo = await fileAccessService.resolveUrl(flag.logo_url, user, true);
                    }
                }
            }
            updates.flag_state = flagStateName;
            updates.flag_logo = flagLogo;
        }
        updatedHtml = certificatePdfService.updateFieldsInHtml(updatedHtml, updates);
        if (remarks !== undefined) {
            updatedHtml = certificatePdfService.updateRemarksInHtml(updatedHtml, remarks);
        }
    }

    await cert.update({
        flag_administration_id,
        certificate_term,
        remarks,
        issue_date,
        expiry_date,
        signature_url: fileAccessService.getKeyFromUrl(signature_url),
        custom_html: cleanCustomHtml(updatedHtml),
        ...(certificate_term && certificate_term !== cert.certificate_term ? { custom_html: null } : {}),
        pdf_file_url: null,
        generated_pdf_url: null,
    });

    await db.CertificateHistory.create({
        certificate_id: cert.id,
        status: cert.status,
        changed_by_user_id: user.id,
        change_reason: 'Draft updated with manual data/remarks',
        changed_at: new Date()
    });

    // No PDF regeneration here – {signature}, {stamp} etc. are resolved at runtime
    // when the certificate is actually issued or PDF is explicitly generated.
    // This keeps draft updates instant (just a DB write).

    const finalCert = await Certificate.findByPk(cert.id, {
        useMaster: true,
        include: [
            { model: db.Vessel, attributes: ['vessel_name', 'imo_number'] },
            { model: db.CertificateType, attributes: ['name', 'signature_url'] },
            { model: db.FlagAdministration, as: 'FlagState', attributes: ['id', 'flag_state_name', 'logo_url'] },
        ],
    });
    await attachPdfSignedUrls(finalCert, user);

    return await fileAccessService.resolveEntity(finalCert, user);
};

export const updateDraftLayout = async (id, data, user) => {
    const cert = await Certificate.findByPk(id, { useMaster: true });
    if (!cert) throw { statusCode: 404, message: 'Certificate not found' };
    if (cert.status !== 'DRAFT') throw { statusCode: 400, message: 'Only draft certificates can be updated' };

    const { custom_html } = data;
    
    const extractedData = certificatePdfService.extractFieldsFromHtml(custom_html);
    const updates = {
        custom_html: cleanCustomHtml(custom_html),
        pdf_file_url: null,
        generated_pdf_url: null,
    };
    
    if (extractedData.certificate_number !== undefined) {
        updates.certificate_number = extractedData.certificate_number;
    }
    if (extractedData.issue_date !== undefined) {
        const parsedDate = new Date(extractedData.issue_date);
        if (!Number.isNaN(parsedDate.getTime())) {
            updates.issue_date = parsedDate;
        }
    }
    if (extractedData.expiry_date !== undefined) {
        const parsedDate = new Date(extractedData.expiry_date);
        if (!Number.isNaN(parsedDate.getTime())) {
            updates.expiry_date = parsedDate;
        }
    }
    
    if (extractedData.flag_state !== undefined) {
        const flag = await db.FlagAdministration.findOne({
            where: { flag_state_name: extractedData.flag_state }
        });
        if (flag) {
            updates.flag_administration_id = flag.id;
        }
    }
    
    await cert.update(updates);

    await db.CertificateHistory.create({
        certificate_id: cert.id,
        status: cert.status,
        changed_by_user_id: user.id,
        change_reason: 'Draft layout visually edited',
        changed_at: new Date(),
    });

    // No PDF regeneration on layout save — PDF is generated on download only.

    const finalCert = await Certificate.findByPk(cert.id, {
        useMaster: true,
        include: [
            { model: db.Vessel, attributes: ['vessel_name', 'imo_number'] },
            { model: db.CertificateType, attributes: ['name'] },
        ],
    });
    await attachPdfSignedUrls(finalCert, user);

    return finalCert;
};

export const issueCertificate = async (id, user) => {
    const transaction = await db.sequelize.transaction();
    try {
        const cert = await Certificate.findByPk(id, {
            transaction,
            lock: transaction.LOCK.UPDATE,
            include: [
                { model: db.Vessel, include: [{ model: db.Client, as: 'Client', attributes: ['company_name', 'address', 'company_id_number'] }] },
                { model: db.CertificateType },
                { model: db.FlagAdministration, as: 'FlagState' }
            ]
        });

        if (!cert) throw { statusCode: 404, message: 'Certificate not found' };
        if (cert.status !== 'DRAFT') throw { statusCode: 400, message: 'Only draft certificates can be issued' };

        await verifyTemplateExists(cert.certificate_type_id, cert.certificate_term, transaction);

        const issuedAt = new Date();
        await cert.update({
            status: 'VALID',
            issued_at: issuedAt,
            issued_by_user_id: user.id,
            pdf_file_url: null,
            generated_pdf_url: null,
        }, { transaction });

        // Update JobCertificate status to ISSUED, which will auto-sync parent JobRequest status
        if (cert.job_id) {
            let jc = await db.JobCertificate.findOne({
                where: { generated_certificate_id: cert.id },
                transaction,
            });
            if (!jc) {
                const matching = await db.JobCertificate.findAll({
                    where: { job_request_id: cert.job_id, certificate_type_id: cert.certificate_type_id },
                    transaction,
                });
                if (matching.length === 1) jc = matching[0];
            }
            if (jc) {
                await lifecycleService.updateJobCertificateStatus(jc.id, 'ISSUED', user.id,
                    `Certificate ${cert.certificate_number} officially issued.`, { transaction });
            }
        }

        await db.CertificateHistory.create({
            certificate_id: cert.id,
            status: 'ISSUED',
            changed_by_user_id: user.id,
            change_reason: 'Certificate officially issued (PDF available on download)',
            changed_at: issuedAt,
        }, { transaction });

        await transaction.commit();

        const issuedCert = await Certificate.findByPk(id, {
            useMaster: true,
            include: [
                { model: db.Vessel, attributes: ['vessel_name', 'imo_number'] },
                { model: db.CertificateType, attributes: ['name'] },
            ],
        });
        return issuedCert;
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

export const overrideCertificate = async (id, data, user) => {
    const transaction = await db.sequelize.transaction();
    try {
        const cert = await Certificate.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
        if (!cert) throw { statusCode: 404, message: 'Certificate not found' };

        if (!['VALID', 'ISSUED'].includes(cert.status)) {
            throw { statusCode: 400, message: 'Only issued or valid certificates can be manually overridden.' };
        }

        const { s3_key, reason } = data;

        await cert.update({
            is_manually_overridden: true,
            manually_overridden_file_url: s3_key,
            pdf_file_url: s3_key
        }, { transaction });

        await db.CertificateHistory.create({
            certificate_id: cert.id,
            status: cert.status,
            changed_by_user_id: user.id,
            change_reason: reason || 'Certificate manually overridden with an uploaded file',
            changed_at: new Date()
        }, { transaction });

        await transaction.commit();
        return cert;
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

export const reissueCertificate = async (id, reason, userId) => {
    const transaction = await db.sequelize.transaction();
    try {
        const oldCert = await Certificate.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
        if (!oldCert) throw { statusCode: 404, message: 'Original certificate not found' };

        // Revoke old certificate
        await oldCert.update({ status: 'REVOKED' }, { transaction });

        // Create new version as DRAFT
        const newCertData = {
            ...oldCert.toJSON(),
            id: undefined,
            status: 'DRAFT',
            version: oldCert.version + 1,
            certificate_number: await generateUniqueCertificateNumber(),
            issued_at: null,
            pdf_file_url: null,
            generated_pdf_url: null,
            qr_code_url: null,
            issued_by_user_id: userId
        };

        const newCert = await Certificate.create(newCertData, { transaction });

        await db.CertificateHistory.create({
            certificate_id: oldCert.id,
            status: 'REVOKED',
            changed_by_user_id: userId,
            change_reason: `Re-issued as Version ${newCert.version}. Reason: ${reason}`,
            changed_at: new Date()
        }, { transaction });

        await transaction.commit();
        return newCert;
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

export const getCertificateUploadUrl = async (fileName, contentType) => {
    const key = s3Service.generateKey(fileName, 'certificates/external');
    const uploadUrl = await s3Service.getUploadSignedUrl(key, contentType);
    return { uploadUrl, key };
};

export const uploadExternalCertificate = async (vesselId, dataArray, userId) => {
    const certsData = Array.isArray(dataArray) ? dataArray : [dataArray];
    const createdCerts = [];
    const transaction = await db.sequelize.transaction();
    
    try {
        for (const data of certsData) {
            const { certificate_type_id, certificate_number, issue_date, expiry_date, s3_key } = data;

            const cert = await Certificate.create({
                vessel_id: vesselId,
                certificate_type_id,
                certificate_number,
                issue_date,
                expiry_date,
                source_type: 'EXTERNAL',
                status: 'VALID', // External certs are valid by default
                uploaded_file_url: s3_key,
                pdf_file_url: s3_key,
                issued_by_user_id: userId,
                version: 1
            }, { transaction });

            await db.CertificateHistory.create({
                certificate_id: cert.id,
                status: 'VALID',
                changed_by_user_id: userId,
                change_reason: 'External certificate uploaded manually',
                changed_at: new Date()
            }, { transaction });
            
            createdCerts.push(cert);
        }
        
        await transaction.commit();
        return createdCerts;
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

export const previewCertificate = async (id, user) => {
    return await getCertificateById(id, user);
};

export const getHistory = async (id, user) => {
    await getCertificateById(id, user);
    return await db.CertificateHistory.findAll({
        where: { certificate_id: id },
        attributes: ['id', 'certificate_id', 'status', 'change_reason', 'changed_by_user_id', 'changed_at'],
        order: [['changed_at', 'DESC']]
    });
};

export const transferCertificate = async (id, newOwnerId, reason, userId) => {
    const cert = await Certificate.findByPk(id, { include: [db.CertificateType], useMaster: true });
    if (!cert) throw { statusCode: 404, message: 'Certificate not found' };

    await cert.update({ status: 'TRANSFERRED' });

    const newCert = await Certificate.create({
        vessel_id: cert.vessel_id,
        certificate_type_id: cert.certificate_type_id,
        certificate_number: await generateUniqueCertificateNumber(cert.CertificateType?.short_code),
        issue_date: new Date(),
        expiry_date: cert.expiry_date,
        status: 'VALID',
        issued_by_user_id: userId
    });

    await db.CertificateHistory.create({
        certificate_id: cert.id,
        status: 'TRANSFERRED',
        changed_by_user_id: userId,
        change_reason: `Transferred ownership. New Cert: ${newCert.certificate_number}. Reason: ${reason}`,
        changed_at: new Date()
    });

    return newCert;
};

export const extendCertificate = async (id, extensionMonths, reason, userId) => {
    const cert = await Certificate.findByPk(id, { useMaster: true });
    if (!cert) throw { statusCode: 404, message: 'Certificate not found' };

    const newExpiry = new Date(cert.expiry_date);
    newExpiry.setMonth(newExpiry.getMonth() + extensionMonths);

    await cert.update({ expiry_date: newExpiry });

    await db.CertificateHistory.create({
        certificate_id: cert.id,
        status: cert.status,
        changed_by_user_id: userId,
        change_reason: `Extended by ${extensionMonths} months: ${reason}`,
        changed_at: new Date()
    });

    return cert;
};

export const downgradeCertificate = async (id, newTypeId, reason, userId) => {
    const cert = await Certificate.findByPk(id, { useMaster: true });
    const newType = await db.CertificateType.findByPk(newTypeId, { useMaster: true });
    if (!cert) throw { statusCode: 404, message: 'Certificate not found' };

    await cert.update({ status: 'DOWNGRADED' });

    const newCert = await Certificate.create({
        vessel_id: cert.vessel_id,
        certificate_type_id: newTypeId,
        certificate_number: await generateUniqueCertificateNumber(newType?.short_code),
        issue_date: new Date(),
        expiry_date: cert.expiry_date,
        status: 'VALID',
        issued_by_user_id: userId
    });

    await db.CertificateHistory.create({
        certificate_id: cert.id,
        status: 'DOWNGRADED',
        changed_by_user_id: userId,
        change_reason: `Downgraded to type ${newTypeId}. New Cert: ${newCert.certificate_number}. Reason: ${reason}`,
        changed_at: new Date()
    });

    return newCert;
};

export const bulkRenew = async (ids, validityYears, reason, userId) => {
    const renewalPromises = ids.map(async (id) => {
        try {
            const cert = await renewCertificate(id, validityYears, reason, userId);
            return { id, status: 'SUCCESS', cert };
        } catch (e) {
            return { id, status: 'FAILED', error: e.message };
        }
    });

    const results = await Promise.all(renewalPromises);
    return results;
};
export const verifyCertificate = async (certificateNumber) => {
    const cert = await Certificate.findOne({
        where: { certificate_number: certificateNumber },
        include: [
            { model: db.Vessel, attributes: ['vessel_name', 'imo_number'] }, 
            { model: db.CertificateType, attributes: ['name', 'signature_url'] },
            { model: db.FlagAdministration, as: 'FlagState', attributes: ['flag_state_name'] },
            { model: db.User, as: 'issuer', attributes: ['name'] }
        ]
    });
    if (!cert) throw { statusCode: 404, message: 'Certificate not found' };

    let pdfUrl = null;
    if (cert.pdf_file_url) {
        const key = fileAccessService.getKeyFromUrl(cert.pdf_file_url);
        pdfUrl = fileAccessService.generatePublicCdnUrl(key);
        if (!pdfUrl) {
            pdfUrl = await fileAccessService.generateSignedUrl(key, 900);
        }
    }

    return {
        valid: ['VALID', 'ISSUED'].includes(cert.status) && new Date(cert.expiry_date) >= new Date().setHours(0, 0, 0, 0),
        certificate: {
            certificate_number: cert.certificate_number,
            status: cert.status,
            issue_date: cert.issue_date,
            expiry_date: cert.expiry_date,
            vessel_name: cert.Vessel?.vessel_name,
            imo_number: cert.Vessel?.imo_number,
            certificate_type: cert.CertificateType?.name,
            flag_state: cert.FlagState?.flag_state_name,
            issued_by: cert.issuer ? cert.issuer.name : 'GR CLASS'
        },
        pdf_url: pdfUrl
    };
};
