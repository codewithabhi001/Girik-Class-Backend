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
        where.name = { [Op.like]: `%${search}%` };
    }

    const queryOptions = {
        where,
        attributes: ['id', 'name', 'issuing_authority', 'validity_years', 'status', 'requires_survey'],
        order: [['name', 'ASC']],
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
        attributes: ['id', 'name', 'issuing_authority', 'validity_years', 'status', 'description', 'requires_survey'],
        include: [{
            model: db.CertificateRequiredDocument,
            attributes: ['id', 'document_name', 'is_mandatory'],
        }],
    });
    if (!type) throw { statusCode: 404, message: 'Certificate type not found' };
    const plain = type.get({ plain: true });
    plain.CertificateRequiredDocuments = (plain.CertificateRequiredDocuments || [])
        .sort((a, b) => (a.document_name || '').localeCompare(b.document_name || ''));
    return shapeCertificateTypeDetail(plain);
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
        const type = await CertificateType.create({
            name: certData.name,
            issuing_authority: certData.issuing_authority,
            validity_years: certData.validity_years,
            status: certData.status ?? 'ACTIVE',
            description: certData.description ?? null,
            requires_survey: certData.requires_survey ?? true,
        }, { transaction: txn });

        if (required_documents && required_documents.length > 0) {
            const docsToCreate = required_documents.map(doc => ({
                certificate_type_id: type.id,
                document_name: doc.document_name,
                is_mandatory: doc.is_mandatory ?? true
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
        await type.update(certData, { transaction: txn });

        if (required_documents) {
            // Re-create the required documents list for simplicity
            await db.CertificateRequiredDocument.destroy({ where: { certificate_type_id: id }, transaction: txn });
            if (required_documents.length > 0) {
                const docsToCreate = required_documents.map(doc => ({
                    certificate_type_id: id,
                    document_name: doc.document_name,
                    is_mandatory: doc.is_mandatory ?? true
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


/** List required documents for a certificate type. */
export const getCertificateTypeRequiredDocuments = async (certificateTypeId) => {
    const type = await CertificateType.findByPk(certificateTypeId, {
        attributes: ['id', 'name', 'status'],
    });
    if (!type) throw { statusCode: 404, message: 'Certificate type not found' };

    return await db.CertificateRequiredDocument.findAll({
        where: { certificate_type_id: certificateTypeId },
        attributes: ['id', 'certificate_type_id', 'document_name', 'is_mandatory', 'createdAt', 'updatedAt'],
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

export const _generateCertificateFile = async (cert, user, transaction = null) => {
    let template = null;
    try {
        const jobId = cert.job_id;
        const certificateNumber = cert.certificate_number;
        
        // 1. Resolve logos and basic info
        const grClassLogo = 'https://grclass.com/grclass-logo.webp';
        let flagLogo = null;
        if (cert.flag_administration_id || cert.FlagState) {
            const flag = cert.FlagState || await db.FlagAdministration.findByPk(cert.flag_administration_id, { transaction });
            if (flag?.logo_url) {
                flagLogo = await fileAccessService.resolveUrl(flag.logo_url, user, true);
            }
        }
        const issuingAuthority = cert.CertificateType?.issuing_authority === 'FLAG' ? (cert.FlagState?.flag_state_name || 'Flag Administration') : 'GR CLASS';
        
        // 2. Build dynamic tags
        const dynamicTags = jobId ? await buildTagValuesForJob(jobId) : {};

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
            vessel_name: cert.Vessel?.vessel_name || '',
            imo_number: cert.Vessel?.imo_number || '',
            call_sign: cert.Vessel?.call_sign || '',
            mmsi_number: cert.Vessel?.mmsi_number || '',
            port_of_registry: cert.Vessel?.port_of_registry || '',
            year_built: cert.Vessel?.year_built || '',
            ship_type: cert.Vessel?.ship_type || '',
            gross_tonnage: cert.Vessel?.gross_tonnage || '',
            net_tonnage: cert.Vessel?.net_tonnage || '',
            deadweight: cert.Vessel?.deadweight || '',
            certificate_number: certificateNumber,
            certificate_type: cert.CertificateType?.name || '',
            issue_date: formatDate(cert.issue_date),
            expiry_date: formatDate(cert.expiry_date),
            survey_completion_date: dynamicTags.survey_completed_date || formatDate(cert.issue_date),
            certificate_term: cert.certificate_term || '',
            issuing_authority: issuingAuthority,
            flag_state: cert.FlagState?.flag_state_name || '',
            port: dynamicTags.place_of_survey || '',
            place: dynamicTags.place_of_survey || '',
            surveyor_name: dynamicTags.surveyor_name || '',
            gr_class_logo: grClassLogo,
            flag_logo: flagLogo
        };

        // 3. Fetch Template
        if (cert.certificate_term) {
            // Attempt to find a template matching the specified term
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
            // No term specified; attempt to find a template without a term (default template)
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
            logger.warn('No valid template content found for certificate', { certId: cert.id });
            throw { statusCode: 400, message: 'No valid template content found for this certificate.' };
        }

        const verificationUrl = `${env.publicApiBaseUrl}/api/v1/public/certificate/verify/${certificateNumber}`;
        const qrDataUrl = await QRCode.toDataURL(verificationUrl, { width: 120, margin: 1 });
        
        allDataSources.qr_code = `<img src="${qrDataUrl}" style="width:120px;height:120px;" alt="QR Code"/>`;
        allDataSources.qr_data_url = qrDataUrl;
        allDataSources.qr_code_url = qrDataUrl;

        const filledHtml = certificatePdfService.fillTemplate(template.template_content, allDataSources);
        const finalHtml = filledHtml.includes('<html') ? filledHtml : certificatePdfService.wrapHtmlForPdf(filledHtml);

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

        const certType = await db.CertificateType.findByPk(certTypeId, { attributes: ['id', 'name', 'issuing_authority', 'short_code', 'requires_survey'], transaction });
        if (!certType) throw { statusCode: 404, message: 'Certificate type not found' };

        if (!certificate_term || !['FULL_TERM', 'SHORT_TERM'].includes(certificate_term)) {
            throw { statusCode: 400, message: 'Certificate term is required and must be either FULL_TERM or SHORT_TERM.' };
        }

        await verifyTemplateExists(certTypeId, certificate_term, transaction);

        // ── Guard 1: Status Check ──
        const targetStatus = jobCert ? jobCert.status : job.job_status;
        let allowedStatuses = jobCert
            ? ['SURVEY_DONE', 'REWORK_REQUESTED']
            : ['FINALIZED', 'PAYMENT_DONE', 'REWORK_REQUESTED', 'SURVEY_DONE', 'REVIEWED'];

        if (jobCert && certType.requires_survey === false) {
            if (!job.approved_by_user_id) {
                throw {
                    statusCode: 400,
                    message: `Certificate can only be generated after the job request has been approved by a General Manager.`
                };
            }
            allowedStatuses = ['DOCUMENT_VERIFIED', 'SURVEY_DONE', 'REWORK_REQUESTED'];
        }

        if (!allowedStatuses.includes(targetStatus)) {
            throw {
                statusCode: 400,
                message: `Certificate can only be generated when status is ${allowedStatuses.join(', ')}. Current: ${targetStatus}`,
            };
        }

        // ── Guard 2: Survey Compliance (if required) ──
        if (certType.requires_survey) {
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
        const existingCert = await Certificate.findOne({ where: { vessel_id: job.vessel_id, certificate_type_id: certTypeId, status: 'VALID' }, transaction });
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
            vessel_id: job.vessel_id,
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
            certificate_term: certificate_term,
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

        try {
            // Generate PDF outside transaction (non-critical, best-effort)
            const freshCert = await Certificate.findByPk(cert.id, {
                useMaster: true,
                include: [
                    { model: db.Vessel },
                    { model: db.CertificateType },
                    { model: db.FlagAdministration, as: 'FlagState' }
                ]
            });
            await _generateCertificateFile(freshCert, user);
            
            const finalCert = await Certificate.findByPk(cert.id, {
                useMaster: true,
                include: [
                    { model: db.Vessel, attributes: ['vessel_name', 'imo_number'] },
                    { model: db.CertificateType, attributes: ['name'] }
                ]
            });
            if (finalCert && finalCert.pdf_file_url) {
                const key = fileAccessService.getKeyFromUrl(finalCert.pdf_file_url);
                const signedUrl = await fileAccessService.generateSignedUrl(key, 3600, user);
                finalCert.setDataValue('pdf_url', signedUrl);
            }

            // ── Non-blocking Notification Dispatch ──
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
                        status: 'ISSUED'
                    };

                    // 1. Notify Client Users
                    if (vesselFull?.client_id) {
                        const clientUsers = await db.User.findAll({
                            where: { client_id: vesselFull.client_id, role: 'CLIENT', status: 'ACTIVE' },
                            attributes: ['email']
                        });
                        const clientEmails = clientUsers.map(u => u.email);
                        if (clientEmails.length > 0) {
                            await emailService.sendTemplateEmail(clientEmails, 'CERTIFICATE_GENERATED', { 
                                ...commonData, 
                                isInternal: false 
                            });
                        }
                    }

                    // 2. Notify Internal Managers (GM & TM)
                    const internalUsers = await db.User.findAll({
                        where: { role: { [Op.in]: ['GM', 'TM'] }, status: 'ACTIVE' },
                        attributes: ['email']
                    });
                    const internalEmails = internalUsers.map(u => u.email);
                    
                    // 3. Notify Assigned Surveyor
                    if (job.assigned_surveyor_id) {
                        const surveyor = await db.User.findByPk(job.assigned_surveyor_id, { attributes: ['email'] });
                        if (surveyor?.email && !internalEmails.includes(surveyor.email)) {
                            internalEmails.push(surveyor.email);
                        }
                    }

                    if (internalEmails.length > 0) {
                        await emailService.sendTemplateEmail(internalEmails, 'CERTIFICATE_GENERATED', { 
                            ...commonData, 
                            isInternal: true 
                        });
                    }
                } catch (err) {
                    logger.error('Failed to dispatch certificate generation emails', { certificateNumber, err: err.message });
                }
            })();

            return finalCert;
        } catch (postCommitErr) {
            logger.error('Error in post-commit certificate generation logic', { jobId: job_id, err: postCommitErr.message });
            // Return what we have
            return await Certificate.findByPk(cert.id, { include: [db.Vessel, db.CertificateType], useMaster: true });
        }
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const ALLOWED_CERT_LIST_FILTERS = ['vessel_id', 'certificate_type_id', 'status'];

export const getCertificates = async (query, user) => {
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
        vesselInclude.where = { client_id: rest.client_id };
    }

    const { count, rows } = await Certificate.findAndCountAll({
        where,
        attributes: ['id', 'vessel_id', 'certificate_type_id', 'certificate_number', 'issue_date', 'expiry_date', 'status', 'createdAt', 'source_type', 'pdf_file_url', 'uploaded_file_url', 'generated_pdf_url', 'manually_overridden_file_url'],
        limit: Math.min(parseInt(limit, 10) || 10, 100),
        offset: (Math.max(1, parseInt(page, 10)) - 1) * (parseInt(limit, 10) || 10),
        include: [vesselInclude, { model: db.CertificateType, attributes: ['id', 'name'] }],
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
        include: [{ model: db.Vessel, attributes: ['vessel_name', 'imo_number'] }, { model: db.CertificateType, attributes: ['name'] }],
    });
    if (cert) {
        if (cert.pdf_file_url) {
            const key = fileAccessService.getKeyFromUrl(cert.pdf_file_url);
            let pdfUrl = fileAccessService.generatePublicCdnUrl(key);
            if (!pdfUrl) {
                // Generate signed URL (1 hour access for internal/authorized users)
                pdfUrl = await fileAccessService.generateSignedUrl(key, 3600, user);
            }
            cert.setDataValue('pdf_url', pdfUrl);
        }
        
        if (cert.generated_pdf_url) {
            const key2 = fileAccessService.getKeyFromUrl(cert.generated_pdf_url);
            let genPdfUrl = fileAccessService.generatePublicCdnUrl(key2);
            if (!genPdfUrl) {
                genPdfUrl = await fileAccessService.generateSignedUrl(key2, 3600, user);
            }
            cert.setDataValue('generated_pdf_signed_url', genPdfUrl);
        }

        return cert;
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

    const { flag_administration_id, certificate_term, remarks, issue_date, expiry_date } = data;
    
    if (certificate_term !== undefined) {
        await verifyTemplateExists(cert.certificate_type_id, certificate_term);
    }
    
    await cert.update({
        flag_administration_id,
        certificate_term,
        remarks,
        issue_date,
        expiry_date
    });

    await db.CertificateHistory.create({
        certificate_id: cert.id,
        status: cert.status,
        changed_by_user_id: user.id,
        change_reason: 'Draft updated with manual data/remarks',
        changed_at: new Date()
    });

    // Regenerate PDF file on draft update
    const freshCert = await Certificate.findByPk(cert.id, {
        useMaster: true,
        include: [
            { model: db.Vessel },
            { model: db.CertificateType },
            { model: db.FlagAdministration, as: 'FlagState' }
        ]
    });
    await _generateCertificateFile(freshCert, user);

    const finalCert = await Certificate.findByPk(cert.id, {
        useMaster: true,
        include: [
            { model: db.Vessel, attributes: ['vessel_name', 'imo_number'] },
            { model: db.CertificateType, attributes: ['name'] }
        ]
    });
    if (finalCert && finalCert.pdf_file_url) {
        const key = fileAccessService.getKeyFromUrl(finalCert.pdf_file_url);
        const signedUrl = await fileAccessService.generateSignedUrl(key, 3600, user);
        finalCert.setDataValue('pdf_url', signedUrl);
    }

    return finalCert;
};

export const issueCertificate = async (id, user) => {
    const transaction = await db.sequelize.transaction();
    try {
        const cert = await Certificate.findByPk(id, {
            transaction,
            lock: transaction.LOCK.UPDATE,
            include: [
                { model: db.Vessel },
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
            issued_by_user_id: user.id
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

        await _generateCertificateFile(cert, user, transaction);

        await db.CertificateHistory.create({
            certificate_id: cert.id,
            status: 'ISSUED',
            changed_by_user_id: user.id,
            change_reason: 'Certificate officially issued and PDF generated',
            changed_at: issuedAt
        }, { transaction });

        await transaction.commit();
        return cert;
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
            { model: db.CertificateType, attributes: ['name'] },
            { model: db.FlagAdministration, as: 'FlagState', attributes: ['flag_state_name'] },
            { model: db.User, as: 'issuer', attributes: ['first_name', 'last_name'] }
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
            issued_by: cert.issuer ? `${cert.issuer.first_name} ${cert.issuer.last_name}` : 'GR CLASS'
        },
        pdf_url: pdfUrl
    };
};
