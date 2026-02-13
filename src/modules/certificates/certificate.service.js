import db from '../../models/index.js';
import { v4 as uuidv4 } from 'uuid';
import * as certificatePdfService from '../../services/certificate-pdf.service.js';
import logger from '../../utils/logger.js';
import { buildCertificateScopeWhere } from './certificate-scope.js';

const Certificate = db.Certificate;
const CertificateType = db.CertificateType;
const CertificateTemplate = db.CertificateTemplate;
const JobRequest = db.JobRequest;
const Vessel = db.Vessel;
const { Op } = db.Sequelize;

/** Reusable scope filter for certificate list/get by role. Used in getCertificates, getCertificateById, getExpiringCertificates, preview, getHistory, download. */
export const getCertificateScopeFilter = async (user) => {
    return buildCertificateScopeWhere(user, { JobRequest, Vessel });
};

/** List certificate types (active only by default; pass all for admin). */
export const getCertificateTypes = async (includeInactive = false) => {
    const where = includeInactive ? {} : { status: 'ACTIVE' };
    return await CertificateType.findAll({
        where,
        attributes: ['id', 'name', 'issuing_authority', 'validity_years', 'status', 'description'],
        order: [['name', 'ASC']],
    });
};

/** Create a new certificate type (ADMIN). */
export const createCertificateType = async (data) => {
    const existing = await CertificateType.findOne({ where: { name: data.name } });
    if (existing) throw { statusCode: 409, message: 'A certificate type with this name already exists' };
    return await CertificateType.create({
        name: data.name,
        issuing_authority: data.issuing_authority,
        validity_years: data.validity_years,
        status: data.status ?? 'ACTIVE',
        description: data.description ?? null,
    });
};

export const generateCertificate = async (data, userId) => {
    const { job_id, validity_years } = data;
    const job = await JobRequest.findByPk(job_id, {
        include: [
            { model: db.Vessel, attributes: ['id', 'vessel_name', 'imo_number'] },
            { model: db.CertificateType, attributes: ['id', 'name'] },
        ],
    });
    if (!job) throw { statusCode: 404, message: 'Job not found' };

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
    });

    // Fetch template for this certificate type and generate + upload PDF
    const template = await CertificateTemplate.findOne({
        where: { certificate_type_id: job.certificate_type_id, is_active: true },
        order: [['createdAt', 'DESC']],
    });

    if (template?.template_content) {
        const vessel = job.Vessel;
        const variables = {
            vessel_name: vessel?.vessel_name ?? '',
            imo_number: vessel?.imo_number ?? '',
            issue_date: issueDate,
            expiry_date: expiryDate,
            certificate_number: certificateNumber,
            certificate_type: job.CertificateType?.name ?? '',
        };
        const filledHtml = certificatePdfService.fillTemplate(template.template_content, variables);
        const fullHtml = certificatePdfService.wrapHtmlForPdf(filledHtml);
        try {
            const pdfBuffer = await certificatePdfService.htmlToPdfBuffer(fullHtml);
            const pdfUrl = await certificatePdfService.uploadCertificatePdf(pdfBuffer, certificateNumber);
            await cert.update({ pdf_file_url: pdfUrl });
        } catch (err) {
            // Cert already created; PDF generation/upload failed — keep cert, log and surface in response if needed
            console.warn('Certificate PDF generation failed for', cert.id, err?.message || err);
        }
    }

    await job.update({ job_status: 'CERTIFIED' });

    return await Certificate.findByPk(cert.id, {
        include: [
            { model: db.Vessel, attributes: ['vessel_name', 'imo_number'] },
            { model: db.CertificateType, attributes: ['name'] },
        ],
    });
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

/** Returns certificate by id. Throws 403 if certificate exists but user has no access (ownership scope). */
export const getCertificateById = async (id, user) => {
    const scopeWhere = await getCertificateScopeFilter(user);
    const cert = await Certificate.findOne({
        where: { id, ...scopeWhere },
        include: [{ model: db.Vessel, attributes: ['vessel_name', 'imo_number'] }, { model: db.CertificateType, attributes: ['name'] }],
    });
    if (cert) return cert;
    const exists = await Certificate.findByPk(id);
    if (exists) {
        logger.warn('Certificate access denied', { userId: user?.id, role: user?.role, certificateId: id });
        throw { statusCode: 403, message: 'You do not have access to this certificate' };
    }
    throw { statusCode: 404, message: 'Certificate not found' };
};

export const updateStatus = async (id, status, reason, userId) => {
    const cert = await Certificate.findByPk(id);
    if (!cert) throw { statusCode: 404, message: 'Certificate not found' };

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
    return {
        valid: cert.status === 'VALID' && new Date(cert.expiry_date) > new Date(),
        certificate: cert
    };
};
