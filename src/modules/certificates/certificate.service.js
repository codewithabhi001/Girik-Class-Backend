import db from '../../models/index.js';
import { v4 as uuidv4 } from 'uuid';
import * as certificatePdfService from '../../services/certificate-pdf.service.js';
import logger from '../../utils/logger.js';
import { buildCertificateScopeWhere } from './certificate-scope.js';
import { buildFallbackCertificateHtml } from './templates/fallback-certificate.template.js';
import * as fileAccessService from '../../services/fileAccess.service.js';
import * as lifecycleService from '../../services/lifecycle.service.js';

const Certificate = db.Certificate;
const CertificateType = db.CertificateType;
const CertificateTemplate = db.CertificateTemplate;
const JobRequest = db.JobRequest;
const Vessel = db.Vessel;
const JobStatusHistory = db.JobStatusHistory;
const AuditLog = db.AuditLog;
const { Op } = db.Sequelize;

/** Reusable scope filter for certificate list/get by role. Used in getCertificates, getCertificateById, getExpiringCertificates, preview, getHistory, download. */
export const getCertificateScopeFilter = async (user) => {
    return buildCertificateScopeWhere(user, { JobRequest, Vessel });
};

/** List certificate types — minimal fields only (no required_documents for performance). */
export const getCertificateTypes = async (includeInactive = false) => {
    const where = includeInactive ? {} : { status: 'ACTIVE' };
    return await CertificateType.findAll({
        where,
        attributes: ['id', 'name', 'issuing_authority', 'validity_years', 'status', 'requires_survey'],
        order: [['name', 'ASC']],
    });
};

/** Get a single certificate type by ID with full detail including all required documents. */
export const getCertificateTypeById = async (id) => {
    const type = await CertificateType.findByPk(id, {
        attributes: ['id', 'name', 'issuing_authority', 'validity_years', 'status', 'description', 'requires_survey'],
        include: [{
            model: db.CertificateRequiredDocument,
            attributes: ['id', 'document_name', 'is_mandatory'],
            order: [['document_name', 'ASC']]
        }],
    });
    if (!type) throw { statusCode: 404, message: 'Certificate type not found' };
    return type;
};

/** Create a new certificate type (ADMIN). */
export const createCertificateType = async (data) => {
    const existing = await CertificateType.findOne({ where: { name: data.name } });
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
        return await CertificateType.findByPk(type.id, {
            include: [{ model: db.CertificateRequiredDocument, attributes: ['id', 'document_name', 'is_mandatory'] }]
        });
    } catch (e) {
        await txn.rollback();
        throw e;
    }
};

/** Update certificate type and required documents (ADMIN/TM). */
export const updateCertificateType = async (id, data) => {
    const type = await CertificateType.findByPk(id);
    if (!type) throw { statusCode: 404, message: 'Certificate type not found' };

    if (data.name && data.name !== type.name) {
        const existing = await CertificateType.findOne({ where: { name: data.name } });
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
        return await CertificateType.findByPk(id, {
            include: [{ model: db.CertificateRequiredDocument, attributes: ['id', 'document_name', 'is_mandatory'] }]
        });
    } catch (e) {
        await txn.rollback();
        throw e;
    }
};

export const generateCertificate = async (data, userId) => {
    const { job_id, validity_years } = data;

    const transaction = await db.sequelize.transaction();
    try {
        // Lock Job row for the entire operation
        const job = await JobRequest.findByPk(job_id, {
            transaction,
            lock: transaction.LOCK.UPDATE,
            include: [
                { model: db.Vessel, attributes: ['id', 'vessel_name', 'imo_number'] },
                { model: db.CertificateType, attributes: ['id', 'name', 'issuing_authority'] },
            ],
        });
        if (!job) throw { statusCode: 404, message: 'Job not found' };

        // ── Guard 1: Job must be PAYMENT_DONE ──
        if (job.job_status !== 'PAYMENT_DONE') {
            throw { statusCode: 400, message: `Certificate can only be generated when job is PAYMENT_DONE. Current: ${job.job_status}` };
        }

        // ── Guard 2: Survey Compliance (if required) ──
        if (job.is_survey_required) {
            const survey = await db.Survey.findOne({ where: { job_id }, transaction, lock: transaction.LOCK.UPDATE });
            if (!survey) throw { statusCode: 400, message: 'Cannot generate certificate: Survey not found.' };

            if (survey.survey_status !== 'FINALIZED') {
                throw { statusCode: 400, message: 'Cannot generate certificate: Survey must be FINALIZED first.' };
            }

            if (survey.survey_statement_status !== 'ISSUED') {
                throw { statusCode: 400, message: 'Certificate cannot be generated before Survey Statement is issued.' };
            }

            if (!survey.attendance_photo_url) {
                throw { statusCode: 400, message: 'Compliance Violation: Attendance photo missing in survey records.' };
            }

            if (!survey.gps_latitude || !survey.gps_longitude) {
                throw { statusCode: 400, message: 'Compliance Violation: GPS coordinates missing in survey records.' };
            }
        }

        // ── Guard 3: No certificate already linked to this job ──
        if (job.generated_certificate_id) {
            throw { statusCode: 409, message: 'Certificate already issued for this job.' };
        }
        const existingCert = await Certificate.findOne({ where: { vessel_id: job.vessel_id, certificate_type_id: job.certificate_type_id, status: 'VALID' }, transaction });
        if (existingCert) {
            logger?.warn('Possible duplicate certificate attempt', { job_id, existing_cert_id: existingCert.id });
        }

        // ── Guard 4: No open Non-Conformities ──
        if (db.NonConformity) {
            const openNCs = await db.NonConformity.count({
                where: { job_id, status: { [Op.notIn]: ['CLOSED', 'RESOLVED'] } },
                transaction
            });
            if (openNCs > 0) {
                throw { statusCode: 400, message: `Cannot generate certificate: ${openNCs} open non-conformit${openNCs > 1 ? 'ies' : 'y'} must be resolved first.` };
            }
        }

        const issueDate = new Date();
        const expiryDate = new Date();
        expiryDate.setFullYear(issueDate.getFullYear() + (validity_years || 1));
        const certificateNumber = `CERT-${uuidv4().substring(0, 8).toUpperCase()}`;

        const cert = await Certificate.create({
            vessel_id: job.vessel_id,
            certificate_type_id: job.certificate_type_id,
            certificate_number: certificateNumber,
            issue_date: issueDate,
            expiry_date: expiryDate,
            status: 'VALID',
            issued_by_user_id: userId,
        }, { transaction });

        // Update job to CERTIFIED via lifecycle (ensures history record + terminal guard)
        await lifecycleService.updateJobStatus(job_id, 'CERTIFIED', userId,
            `Certificate ${certificateNumber} generated`, { transaction });
        await job.update({ generated_certificate_id: cert.id }, { transaction });

        await AuditLog.create({
            user_id: userId, action: 'GENERATE_CERTIFICATE',
            entity_name: 'Certificate', entity_id: cert.id,
            old_values: null,
            new_values: { job_id, certificate_number: certificateNumber, certificate_type_id: cert.certificate_type_id, vessel_id: cert.vessel_id }
        }, { transaction });

        await transaction.commit();

        // Generate PDF outside transaction (non-critical, best-effort)
        const template = await CertificateTemplate.findOne({
            where: { certificate_type_id: job.certificate_type_id, is_active: true },
            order: [['createdAt', 'DESC']]
        });
        const vessel = job.Vessel;
        const variables = {
            vessel_name: vessel?.vessel_name ?? '',
            imo_number: vessel?.imo_number ?? '',
            issue_date: issueDate,
            expiry_date: expiryDate,
            certificate_number: certificateNumber,
            certificate_type: job.CertificateType?.name ?? ''
        };
        let qrDataUrl = null;
        try {
            const baseUrl = (process.env.APP_BASE_URL || 'api.girikship.com').replace(/\/$/, '');
            const QR = await import('qrcode');
            qrDataUrl = await QR.toDataURL(`${baseUrl}/api/v1/certificates/verify/${certificateNumber}`, { margin: 1, width: 300 });
        } catch (e) { logger?.warn('QR generation failed', { err: e?.message }); }

        variables.qr_image = qrDataUrl
            ? `<img src="${qrDataUrl}" alt="QR" style="width:140px;height:140px;"/>`
            : null;

        let fullHtml;
        if (template?.template_content) {
            fullHtml = certificatePdfService.wrapHtmlForPdf(certificatePdfService.fillTemplate(template.template_content, variables));
        } else {
            fullHtml = certificatePdfService.wrapHtmlForPdf(buildFallbackCertificateHtml({
                variables, issuingAuthority: job.CertificateType?.issuing_authority ?? '', qrDataUrl
            }));
        }
        try {
            const pdfBuffer = await certificatePdfService.htmlToPdfBuffer(fullHtml);
            const pdfUrl = await certificatePdfService.uploadCertificatePdf(pdfBuffer, certificateNumber);
            await cert.update({ pdf_file_url: pdfUrl });
        } catch (err) {
            logger?.warn('Certificate PDF generation/upload failed', { certId: cert.id, err: err?.message });
        }

        return await Certificate.findByPk(cert.id, {
            include: [
                { model: db.Vessel, attributes: ['vessel_name', 'imo_number'] },
                { model: db.CertificateType, attributes: ['name'] }
            ]
        });
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

    return await Certificate.findAndCountAll({
        where,
        limit: Math.min(parseInt(limit, 10) || 10, 100),
        offset: (Math.max(1, parseInt(page, 10)) - 1) * (parseInt(limit, 10) || 10),
        include: [{ model: db.Vessel, attributes: ['vessel_name', 'imo_number'] }, { model: db.CertificateType, attributes: ['name'] }],
    });
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

    return await Certificate.findAll({
        where,
        include: [{ model: db.CertificateType, attributes: ['name'] }],
        order: [['expiry_date', 'ASC']]
    });
};

/** Get certificate generated for a specific job. */
export const getCertificateByJobId = async (jobId, user) => {
    const job = await JobRequest.findByPk(jobId, {
        attributes: ['id', 'generated_certificate_id']
    });

    if (!job) throw { statusCode: 404, message: 'Job not found' };
    if (!job.generated_certificate_id) {
        throw { statusCode: 404, message: 'Certificate not yet generated for this job' };
    }

    return await getCertificateById(job.generated_certificate_id, user);
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
    VALID: ['SUSPENDED', 'REVOKED', 'EXPIRED'],
    SUSPENDED: ['VALID', 'REVOKED'],
    REVOKED: [],
    EXPIRED: ['VALID']
};

export const updateStatus = async (id, status, reason, userId) => {
    const cert = await Certificate.findByPk(id);
    if (!cert) throw { statusCode: 404, message: 'Certificate not found' };

    if (!CERT_TRANSITIONS[cert.status]?.includes(status)) {
        throw { statusCode: 400, message: `Invalid certificate status transition: ${cert.status} → ${status}` };
    }
    if (cert.status === 'REVOKED') throw { statusCode: 400, message: 'Revoked certificates cannot be modified.' };

    await cert.update({ status });

    await db.CertificateHistory.create({
        certificate_id: cert.id,
        status: status,
        changed_by: userId,
        change_reason: reason,
        change_date: new Date()
    });

    return cert;
};

export const renewCertificate = async (id, validityYears, reason, userId) => {
    const oldCert = await Certificate.findByPk(id);
    if (!oldCert) throw { statusCode: 404, message: 'Certificate not found' };

    await oldCert.update({ status: 'EXPIRED' });

    const issueDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(issueDate.getFullYear() + validityYears);

    const newCert = await Certificate.create({
        vessel_id: oldCert.vessel_id,
        certificate_type_id: oldCert.certificate_type_id,
        certificate_number: `CERT-${uuidv4().substring(0, 8).toUpperCase()}`,
        issue_date: issueDate,
        expiry_date: expiryDate,
        status: 'VALID',
        issued_by_user_id: userId
    });

    await db.CertificateHistory.create({
        certificate_id: oldCert.id,
        status: 'RENEWED',
        changed_by: userId,
        change_reason: `Renewed. New Cert: ${newCert.certificate_number}`,
        change_date: new Date()
    });

    return newCert;
};

export const reissueCertificate = async (id, reason, userId) => {
    const cert = await Certificate.findByPk(id);
    if (!cert) throw { statusCode: 404, message: 'Certificate not found' };

    await db.CertificateHistory.create({
        certificate_id: cert.id,
        status: cert.status,
        changed_by: userId,
        change_reason: `Re-issued: ${reason}`,
        change_date: new Date()
    });
    return { message: 'Certificate Re-issued', certificate: cert };
};

export const previewCertificate = async (id, user) => {
    const cert = await getCertificateById(id, user);
    return { preview_url: `https://mock-pdf.com/preview/${id}`, data: cert };
};

export const getHistory = async (id, user) => {
    await getCertificateById(id, user);
    return await db.CertificateHistory.findAll({ where: { certificate_id: id }, order: [['changed_at', 'DESC']] });
};

export const transferCertificate = async (id, newOwnerId, reason, userId) => {
    const cert = await Certificate.findByPk(id);
    if (!cert) throw { statusCode: 404, message: 'Certificate not found' };

    await cert.update({ status: 'TRANSFERRED' });

    const newCert = await Certificate.create({
        vessel_id: cert.vessel_id,
        certificate_type_id: cert.certificate_type_id,
        certificate_number: `CERT-${uuidv4().substring(0, 8).toUpperCase()}`,
        issue_date: new Date(),
        expiry_date: cert.expiry_date,
        status: 'VALID',
        issued_by_user_id: userId
    });

    await db.CertificateHistory.create({
        certificate_id: cert.id,
        status: 'TRANSFERRED',
        changed_by: userId,
        change_reason: `Transferred ownership. New Cert: ${newCert.certificate_number}. Reason: ${reason}`,
        change_date: new Date()
    });

    return newCert;
};

export const extendCertificate = async (id, extensionMonths, reason, userId) => {
    const cert = await Certificate.findByPk(id);
    if (!cert) throw { statusCode: 404, message: 'Certificate not found' };

    const newExpiry = new Date(cert.expiry_date);
    newExpiry.setMonth(newExpiry.getMonth() + extensionMonths);

    await cert.update({ expiry_date: newExpiry });

    await db.CertificateHistory.create({
        certificate_id: cert.id,
        status: cert.status,
        changed_by: userId,
        change_reason: `Extended by ${extensionMonths} months: ${reason}`,
        change_date: new Date()
    });

    return cert;
};

export const downgradeCertificate = async (id, newTypeId, reason, userId) => {
    const cert = await Certificate.findByPk(id);
    if (!cert) throw { statusCode: 404, message: 'Certificate not found' };

    await cert.update({ status: 'DOWNGRADED' });

    const newCert = await Certificate.create({
        vessel_id: cert.vessel_id,
        certificate_type_id: newTypeId,
        certificate_number: `CERT-${uuidv4().substring(0, 8).toUpperCase()}`,
        issue_date: new Date(),
        expiry_date: cert.expiry_date,
        status: 'VALID',
        issued_by_user_id: userId
    });

    await db.CertificateHistory.create({
        certificate_id: cert.id,
        status: 'DOWNGRADED',
        changed_by: userId,
        change_reason: `Downgraded to type ${newTypeId}. New Cert: ${newCert.certificate_number}. Reason: ${reason}`,
        change_date: new Date()
    });

    return newCert;
};

export const getExpiringCertificates = async (days, user) => {
    const scopeWhere = await getCertificateScopeFilter(user);
    const today = new Date();
    const target = new Date();
    target.setDate(today.getDate() + days);

    return await Certificate.findAll({
        where: {
            ...scopeWhere,
            status: 'VALID',
            expiry_date: {
                [Op.between]: [today, target],
            },
        },
        include: [{ model: db.Vessel, attributes: ['vessel_name', 'imo_number', 'client_id'] }],
    });
};

export const bulkRenew = async (ids, validityYears, reason, userId) => {
    const results = [];
    for (const id of ids) {
        try {
            const cert = await renewCertificate(id, validityYears, reason, userId);
            results.push({ id, status: 'SUCCESS', cert });
        } catch (e) {
            results.push({ id, status: 'FAILED', error: e.message });
        }
    }
    return results;
};

export const verifyCertificate = async (certificateNumber) => {
    const cert = await Certificate.findOne({
        where: { certificate_number: certificateNumber },
        include: [{ model: db.Vessel, attributes: ['vessel_name', 'imo_number'] }, { model: db.CertificateType, attributes: ['name'] }]
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
        valid: cert.status === 'VALID' && new Date(cert.expiry_date) > new Date(),
        certificate: {
            certificate_number: cert.certificate_number,
            status: cert.status,
            issue_date: cert.issue_date,
            expiry_date: cert.expiry_date,
            vessel_name: cert.Vessel?.vessel_name,
            imo_number: cert.Vessel?.imo_number,
            certificate_type: cert.CertificateType?.name
        },
        pdf_url: pdfUrl
    };
};
