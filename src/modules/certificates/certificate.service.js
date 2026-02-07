
import db from '../../models/index.js';
import { v4 as uuidv4 } from 'uuid';

const Certificate = db.Certificate;
const CertificateType = db.CertificateType;
const JobRequest = db.JobRequest;

/** List certificate types (for dropdowns / Create Job). All authenticated users including CLIENT. */
export const getCertificateTypes = async () => {
    return await CertificateType.findAll({
        where: { status: 'ACTIVE' },
        attributes: ['id', 'name', 'issuing_authority', 'validity_years', 'description'],
        order: [['name', 'ASC']],
    });
};

export const generateCertificate = async (data, user) => {
    const { job_id, validity_years } = data;
    const job = await JobRequest.findByPk(job_id);
    if (!job) throw { statusCode: 404, message: 'Job not found' };

    const issueDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(issueDate.getFullYear() + (validity_years || 1));

    const cert = await Certificate.create({
        vessel_id: job.vessel_id,
        certificate_type_id: job.certificate_type_id,
        certificate_number: `CERT-${uuidv4().substring(0, 8).toUpperCase()}`,
        issue_date: issueDate,
        expiry_date: expiryDate,
        status: 'VALID',
        issued_by_user_id: user.id
    });

    // Update Job
    await job.update({ job_status: 'CERTIFIED' });

    return cert;
};

export const getCertificates = async (query, user) => {
    const { page = 1, limit = 10, ...filters } = query;
    const where = { ...filters };

    // Multi-tenancy
    if (user.role === 'CLIENT') {
        const vessels = await db.Vessel.findAll({ where: { client_id: user.client_id }, attributes: ['id'] });
        const vesselIds = vessels.map(v => v.id);
        where.vessel_id = vesselIds;
    }

    return await Certificate.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        include: [{ model: db.Vessel, attributes: ['vessel_name', 'imo_number'] }, { model: db.CertificateType, attributes: ['name'] }]
    });
};

export const updateStatus = async (id, status, reason, user) => {
    const cert = await Certificate.findByPk(id);
    if (!cert) throw { statusCode: 404, message: 'Certificate not found' };

    await cert.update({ status });

    await db.CertificateHistory.create({
        certificate_id: cert.id,
        status: status,
        changed_by: user.id,
        change_reason: reason,
        change_date: new Date()
    });

    return cert;
};

export const renewCertificate = async (id, validityYears, reason, user) => {
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
        issued_by_user_id: user.id
    });

    await db.CertificateHistory.create({
        certificate_id: oldCert.id,
        status: 'RENEWED',
        changed_by: user.id,
        change_reason: `Renewed. New Cert: ${newCert.certificate_number}`,
        change_date: new Date()
    });

    return newCert;
};

export const reissueCertificate = async (id, reason, user) => {
    const cert = await Certificate.findByPk(id);
    await db.CertificateHistory.create({
        certificate_id: cert.id,
        status: cert.status,
        changed_by: user.id,
        change_reason: `Re-issued: ${reason}`,
        change_date: new Date()
    });
    return { message: 'Certificate Re-issued', certificate: cert };
};

export const previewCertificate = async (id) => {
    const cert = await Certificate.findByPk(id, { include: ['Vessel'] });
    return { preview_url: `https://mock-pdf.com/preview/${id}`, data: cert };
};

export const getHistory = async (id) => {
    return await db.CertificateHistory.findAll({ where: { certificate_id: id }, order: [['change_date', 'DESC']] });
};

export const transferCertificate = async (id, newOwnerId, reason, user) => {
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
        issued_by_user_id: user.id
    });

    await db.CertificateHistory.create({
        certificate_id: cert.id,
        status: 'TRANSFERRED',
        changed_by: user.id,
        change_reason: `Transferred ownership. New Cert: ${newCert.certificate_number}. Reason: ${reason}`,
        change_date: new Date()
    });

    return newCert;
};

export const extendCertificate = async (id, extensionMonths, reason, user) => {
    const cert = await Certificate.findByPk(id);
    if (!cert) throw { statusCode: 404, message: 'Certificate not found' };

    const newExpiry = new Date(cert.expiry_date);
    newExpiry.setMonth(newExpiry.getMonth() + extensionMonths);

    await cert.update({ expiry_date: newExpiry });

    await db.CertificateHistory.create({
        certificate_id: cert.id,
        status: cert.status,
        changed_by: user.id,
        change_reason: `Extended by ${extensionMonths} months: ${reason}`,
        change_date: new Date()
    });

    return cert;
};

export const downgradeCertificate = async (id, newTypeId, reason, user) => {
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
        issued_by_user_id: user.id
    });

    await db.CertificateHistory.create({
        certificate_id: cert.id,
        status: 'DOWNGRADED',
        changed_by: user.id,
        change_reason: `Downgraded to type ${newTypeId}. New Cert: ${newCert.certificate_number}. Reason: ${reason}`,
        change_date: new Date()
    });

    return newCert;
};

export const getExpiringCertificates = async (days) => {
    const today = new Date();
    const target = new Date();
    target.setDate(today.getDate() + days);

    const { Op } = db.Sequelize;

    return await Certificate.findAll({
        where: {
            status: 'VALID',
            expiry_date: {
                [Op.between]: [today, target]
            }
        },
        include: ['Vessel']
    });
};
