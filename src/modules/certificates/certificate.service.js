import db from '../../models/index.js';
import { v4 as uuidv4 } from 'uuid';

const Certificate = db.Certificate;
const JobRequest = db.JobRequest;

export const generateCertificate = async (data, user) => {
    const { job_id, validity_years } = data;
    const job = await JobRequest.findByPk(job_id);
    if (!job) throw { statusCode: 404, message: 'Job not found' };

    if (job.job_status !== 'PAYMENT_DONE' && job.job_status !== 'TO_APPROVED' && job.job_status !== 'TM_FINAL') {
        // Validation: stricter?
        // throw { statusCode: 400, message: 'Job not ready for certification' };
    }

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

    // Lock Evidence
    // Find relevant documents (Survey Reports, etc)
    const reports = await db.SurveyReport.findAll({ where: { job_id: job.id } });
    for (const report of reports) {
        // If report has a document ID link or just URL... 
        // For now, assume we lock based on context. 
        // We'll create a mock EvidenceLock entry since we might not have 'document_id' mapping perfectly.
        // Ideally we fetch from 'Documents' table where entity_type='JOB' and entity_id=job.id
        const docs = await db.Document.findAll({ where: { entity_id: job.id, entity_type: 'JOB' } });
        for (const doc of docs) {
            await db.EvidenceLock.create({
                document_id: doc.id,
                locked_by: user.id,
                locked_at: new Date(),
                reason: `Certificate Issued: ${cert.certificate_number}`
            });
        }
    }

    // Update Job
    await job.update({ job_status: 'CERTIFIED' });

    return cert;
};

export const getCertificates = async (query) => {
    return await Certificate.findAll({ limit: 10 });
}

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
    // Logic: Create NEW certificate linked to old one? Or update existing expiry?
    // Usually Renewal = New Certificate Record, linked to old.
    // For simplicity here: Extend expiry on same record OR ideally return new object.
    // Let's create a NEW certificate to keep history clean.

    const oldCert = await Certificate.findByPk(id);
    if (!oldCert) throw { statusCode: 404, message: 'Certificate not found' };

    // Invalidate old
    await oldCert.update({ status: 'EXPIRED' }); // or RENEWED

    // Create new
    const issueDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(issueDate.getFullYear() + validityYears);

    const newCert = await Certificate.create({
        vessel_id: oldCert.vessel_id,
        certificate_type_id: oldCert.certificate_type_id,
        certificate_number: `CERT-${uuidv4().substring(0, 8).toUpperCase()}`, // New number
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
    // Reissue usually means SAME number but new print date/version?
    // Or just generating PDF again?
    // Let's assume it logs re-issuance.
    const cert = await Certificate.findByPk(id);
    // Log history
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
    // mock PDF generation preview
    return { preview_url: `https://mock-pdf.com/preview/${id}`, data: cert };
};


export const getHistory = async (id) => {
    return await db.CertificateHistory.findAll({ where: { certificate_id: id }, order: [['change_date', 'DESC']] });
};

// --- Advanced Management ---

export const transferCertificate = async (id, newOwnerId, reason, user) => {
    const cert = await Certificate.findByPk(id);
    if (!cert) throw { statusCode: 404, message: 'Certificate not found' };

    // Invalidate old for current owner context (Mock logic as Ownership usually on Vessel, not ID here)
    // Assuming transfer implies updating vessel owner link or just issuing new cert for same vessel under new ownership

    // 1. Archive current
    await cert.update({ status: 'TRANSFERRED' });

    // 2. Create new certificate with linked history
    const newCert = await Certificate.create({
        vessel_id: cert.vessel_id,
        certificate_type_id: cert.certificate_type_id,
        certificate_number: `CERT-${uuidv4().substring(0, 8).toUpperCase()}`,
        issue_date: new Date(),
        expiry_date: cert.expiry_date, // Remainder
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

    // Interim Extension
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

    // Downgrade usually implies revoking high-class and issuing low-class
    await cert.update({ status: 'DOWNGRADED' });

    const newCert = await Certificate.create({
        vessel_id: cert.vessel_id,
        certificate_type_id: newTypeId, // Lower class
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

    // Find certs expired or expiring before target AND are VALID
    // Using Op.between? Or updated query
    // Let's use generic Op
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


