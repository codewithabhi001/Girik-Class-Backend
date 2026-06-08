import db from '../../models/index.js';
import { v4 as uuidv4 } from 'uuid';
import { RBAC, isRoleAllowed } from '../../config/rbac.config.js';
import * as notificationService from '../../services/notification.service.js';
import * as fileAccessService from '../../services/fileAccess.service.js';
import { JOB_STATUSES } from '../../constants/statuses.js';
import { buildFullStatusCounts } from '../../utils/statusCount.util.js';
import * as lifecycleService from '../../services/lifecycle.service.js';
import { Op } from 'sequelize';
import { finalizeSurvey } from '../surveys/survey.service.js';

const JobRequest = db.JobRequest;
const JobStatusHistory = db.JobStatusHistory;
const User = db.User;
const CertificateType = db.CertificateType;
const Vessel = db.Vessel;
const Certificate = db.Certificate;
const AuditLog = db.AuditLog;
const CertificateRequiredDocument = db.CertificateRequiredDocument;
const JobDocument = db.JobDocument;
const JobReschedule = db.JobReschedule;
const Survey = db.Survey;
const SurveyorProfile = db.SurveyorProfile;
const Payment = db.Payment;
const JobCertificate = db.JobCertificate;

/**
 * Map job_documents rows to client-facing uploaded_documents (signed URLs, no raw S3 keys).
 */
const enrichUploadedDocuments = async (jobId, user = null) => {
    const docs = await JobDocument.findAll({
        where: { job_id: jobId },
        include: [{
            model: CertificateRequiredDocument,
            attributes: ['id', 'document_name', 'is_mandatory']
        }],
        order: [['createdAt', 'ASC']]
    });

    return Promise.all(docs.map(async (doc) => {
        const plain = doc.get({ plain: true });
        const { fileName, signedUrl } = await fileAccessService.processFileAccess(plain, user);
        const documentType = plain.CertificateRequiredDocument?.document_name
            || plain.custom_document_name
            || null;

        return {
            id: plain.id,
            document_type: documentType,
            description: null,
            createdAt: plain.createdAt,
            filename: fileName,
            signedUrl
        };
    }));
};

// ─────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────

/**
 * Assert a job exists, is not terminal, and optionally that the job belongs
 * to the caller's client scope. Returns the job.
 * @param {string} id
 * @param {{ includeVessel?: boolean }} options
 */
const requireJob = async (id, { includeVessel = false, useMaster = false } = {}) => {
    const include = includeVessel ? ['Vessel'] : [];
    const job = await JobRequest.findByPk(id, { include, ...(useMaster ? { useMaster: true } : {}) });
    if (!job) throw { statusCode: 404, message: 'The requested job could not be found.' };
    return job;
};

/**
 * Validate that the assigned surveyor has the required authorizations
 * for the vessel type and all certificate types of the job.
 */
const validateSurveyorAuthority = async (job, surveyorId) => {
    const profile = await SurveyorProfile.findOne({ where: { user_id: surveyorId }, useMaster: true });
    if (!profile) {
        throw { statusCode: 400, message: 'Surveyor profile not found. Cannot verify authorizations.' };
    }

    // ── Availability Guard ──
    if (profile.status !== 'ACTIVE') {
        throw { statusCode: 400, message: `This surveyor is currently ${profile.status}. Only ACTIVE surveyors can be assigned to jobs.` };
    }

    if (!profile.is_available) {
        throw { statusCode: 400, message: 'This surveyor is currently OFFLINE or UNAVAILABLE. Please select an online surveyor.' };
    }

    let vesselType = null;
    if (job.vessel_id) {
        const vessel = await Vessel.findByPk(job.vessel_id, { useMaster: true });
        vesselType = vessel?.ship_type;
    }

    if (vesselType) {
        let authorizedShips = profile.authorized_ship_types;
        if (typeof authorizedShips === 'string') {
            try { authorizedShips = JSON.parse(authorizedShips); } catch (e) { authorizedShips = []; }
        }
        if (!Array.isArray(authorizedShips)) authorizedShips = [];

        if (!authorizedShips.includes(vesselType)) {
            throw { statusCode: 400, message: `Surveyor is not authorized for vessel type: ${vesselType}` };
        }
    }

    // Check all certificate types for this job
    const jobCerts = await JobCertificate.findAll({ where: { job_request_id: job.id }, useMaster: true });
    for (const jc of jobCerts) {
        const certType = await CertificateType.findByPk(jc.certificate_type_id, { useMaster: true });
        if (certType) {
            let authorizedCerts = profile.authorized_certificates;
            if (typeof authorizedCerts === 'string') {
                try { authorizedCerts = JSON.parse(authorizedCerts); } catch (e) { authorizedCerts = []; }
            }
            if (!Array.isArray(authorizedCerts)) authorizedCerts = [];

            if (!authorizedCerts.includes(certType.name)) {
                throw { statusCode: 400, message: `Surveyor is not authorized for certificate: ${certType.name}` };
            }
        }
    }
};

// ─────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────

export const createJob = async (data, userId, options = {}) => {
    const {
        transaction: externalTxn,
        requestedByUserId,
        statusHistoryReason = 'Initial creation',
        skipNotifications = false,
        skipMandatoryDocumentCheck = false,
    } = options;
    
    // Expecting data.certificates to be an array: [{ certificate_type_id: 'uuid', uploaded_documents: [...] }]
    const certificates = data.certificates || [];
    if (certificates.length === 0 && data.certificate_type_id) {
        certificates.push({
            certificate_type_id: data.certificate_type_id,
            uploaded_documents: data.uploaded_documents || []
        });
    }
    if (certificates.length === 0) {
        throw { statusCode: 400, message: 'At least one certificate is required to create a job.' };
    }

    const vessel = data.vessel_id ? await Vessel.findByPk(data.vessel_id, { include: [{ model: db.Client, as: 'Client' }], useMaster: true }) : null;

    if (data.vessel_id) {
        if (!vessel) throw { statusCode: 400, message: 'The selected vessel is invalid.' };

        if (vessel.class_status !== 'ACTIVE') {
            throw {
                statusCode: 400,
                message: `Cannot create job: Vessel status is '${vessel.class_status}'. Only ACTIVE vessels are eligible for survey.`
            };
        }

        if (vessel.Client && vessel.Client.status !== 'ACTIVE') {
            throw {
                statusCode: 400,
                message: 'Cannot create job: The associated client company is currently INACTIVE.'
            };
        }
    }

    // Validate all certificates before starting transaction
    let anySurveyRequired = false;
    for (const cert of certificates) {
        const certType = await CertificateType.findByPk(cert.certificate_type_id, { useMaster: true });
        if (!certType) throw { statusCode: 400, message: `The selected certificate type ${cert.certificate_type_id} is invalid.` };
        
        // ── Template Validations ──
        const certTemplate = await db.CertificateTemplate.findOne({
            where: { certificate_type_id: cert.certificate_type_id, is_active: true },
            useMaster: true
        });
        if (!certTemplate) {
            throw { statusCode: 400, message: `Cannot create job. No active Certificate Template found for ${certType.name}.` };
        }

        if (certType.requires_survey) {
            anySurveyRequired = true;
            const checklistTemplate = await db.ChecklistTemplate.findOne({
                where: { certificate_type_id: cert.certificate_type_id, status: 'ACTIVE' },
                useMaster: true
            });
            if (!checklistTemplate) {
                throw { statusCode: 400, message: `Cannot create job. Survey is required but no active Checklist Template found for ${certType.name}.` };
            }
        }

        if (!skipMandatoryDocumentCheck) {
            const requiredDocs = await CertificateRequiredDocument.findAll({
                where: { certificate_type_id: cert.certificate_type_id, is_mandatory: true },
                useMaster: true
            });
            const uploadedDocIds = cert.uploaded_documents?.map(d => d.required_document_id) || [];
            const missingDocs = requiredDocs.filter(rd => !uploadedDocIds.includes(rd.id));

            if (missingDocs.length > 0) {
                throw {
                    statusCode: 400,
                    message: `Please upload all mandatory documents for certificate ${certType.name}.`,
                    missing_documents: missingDocs.map(md => ({ id: md.id, name: md.document_name }))
                };
            }
        }
    }

    const { job_status: _omit, uploaded_documents: _u, certificates: _c, requested_by_user_id: _rbu, payment: paymentData, ...safeData } = data;
    const requestedBy = requestedByUserId || userId;

    const txn = externalTxn || await db.sequelize.transaction();
    const ownsTransaction = !externalTxn;
    try {
        const job = await JobRequest.create({
            ...safeData,
            requested_by_user_id: requestedBy,
            job_status: 'CREATED',
            is_survey_required: anySurveyRequired
        }, { transaction: txn });

        // Loop through certificates array to create JobCertificates and JobDocuments
        for (const cert of certificates) {
            const jobCert = await db.JobCertificate.create({
                job_request_id: job.id,
                certificate_type_id: cert.certificate_type_id,
                status: 'PENDING'
            }, { transaction: txn });

            if (cert.uploaded_documents && cert.uploaded_documents.length > 0) {
                const docsToCreate = cert.uploaded_documents.map(doc => ({
                    job_id: job.id,
                    job_certificate_id: jobCert.id,
                    required_document_id: doc.required_document_id || null,
                    custom_document_name: doc.custom_document_name || null,
                    file_url: doc.file_url,
                    uploaded_by: userId,
                    verification_status: 'PENDING'
                }));
                await JobDocument.bulkCreate(docsToCreate, { transaction: txn });
            }
        }

        // Handle global uploaded documents (if any)
        if (data.uploaded_documents && data.uploaded_documents.length > 0) {
            const globalDocsToCreate = data.uploaded_documents.map(doc => ({
                job_id: job.id,
                job_certificate_id: null,
                required_document_id: null,
                custom_document_name: doc.custom_document_name || null,
                file_url: doc.file_url,
                uploaded_by: userId,
                verification_status: 'PENDING'
            }));
            await JobDocument.bulkCreate(globalDocsToCreate, { transaction: txn });
        }

        await JobStatusHistory.create({
            job_id: job.id,
            previous_status: null,
            new_status: 'CREATED',
            changed_by: userId,
            reason: statusHistoryReason
        }, { transaction: txn });

        if (paymentData) {
            const payment = await db.Payment.create({
                job_id: job.id,
                invoice_number: `INV-${uuidv4().substring(0, 8).toUpperCase()}`,
                amount: paymentData.amount,
                currency: paymentData.currency || 'USD',
                payment_status: 'UNPAID'
            }, { transaction: txn });

            await db.AuditLog.create({
                user_id: userId, action: 'CREATE_INVOICE',
                entity_name: 'Payment', entity_id: payment.id,
                old_values: null,
                new_values: { job_id: job.id, amount: paymentData.amount, currency: payment.currency, payment_status: 'UNPAID' }
            }, { transaction: txn });
        }

        if (ownsTransaction) {
            await txn.commit();

            if (!skipNotifications) {
                const jobWithVessel = await JobRequest.findByPk(job.id, { include: ['Vessel'], useMaster: true });
                notificationService.notifyRoles(['ADMIN', 'GM', 'TM'], 'JOB_CREATED', {
                    vesselName: jobWithVessel.Vessel.vessel_name,
                    port: jobWithVessel.target_port
                });

                const clientUser = await User.findOne({ where: { client_id: jobWithVessel.Vessel.client_id, role: 'CLIENT' } });
                if (clientUser) {
                    notificationService.sendNotification(clientUser.id, 'JOB_CREATED', {
                        vesselName: jobWithVessel.Vessel.vessel_name, port: jobWithVessel.target_port
                    });
                }
            }
        }

        return job;
    } catch (error) {
        if (ownsTransaction) await txn.rollback();
        throw error;
    }
};

export const createJobForClient = async (data, clientId, userId) => {
    if (!data.vessel_id) throw { statusCode: 400, message: 'Vessel ID is required' };
    const vessel = await Vessel.findOne({ where: { id: data.vessel_id, client_id: clientId } });
    if (!vessel) throw { statusCode: 403, message: 'Access denied: you do not have permission to select this vessel.' };
    return createJob(data, userId);
};

// ─────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────

const ALLOWED_JOB_FILTERS = ['id', 'vessel_id', 'certificate_type_id', 'requested_by_user_id',
    'assigned_surveyor_id', 'assigned_by_user_id', 'target_port', 'target_date'];
const INTERNAL_RECENT_ROLES = new Set(['ADMIN', 'GM', 'TM', 'TO']);
const RECENT_JOBS_DEFAULT_DAYS = 30;

const parseCsvOrSingle = (value) => {
    if (value == null || value === '') return [];
    return String(value).split(',').map(i => i.trim()).filter(Boolean);
};

const hasAnyUserFilter = (rest) =>
    [...ALLOWED_JOB_FILTERS, 'status', 'created_from', 'created_to']
        .some(k => rest[k] != null && String(rest[k]).trim() !== '');

const applySurveyorScope = async (whereClause, user) => {
    if (!user || user.role !== 'SURVEYOR') return;
    const certRows = await JobCertificate.findAll({
        where: { assigned_surveyor_id: user.id },
        attributes: ['job_request_id'],
        raw: true,
        useReplica: true
    });
    const certJobIds = [...new Set(certRows.map((r) => r.job_request_id).filter(Boolean))];
    whereClause[Op.or] = [
        { assigned_surveyor_id: user.id },
        ...(certJobIds.length ? [{ id: { [Op.in]: certJobIds } }] : []),
    ];
};

export const surveyorCanAccessJob = async (jobId, userId) => {
    const job = await JobRequest.findByPk(jobId, {
        attributes: ['id', 'assigned_surveyor_id'],
        useReplica: true,
    });
    if (!job) return false;
    if (job.assigned_surveyor_id === userId) return true;
    const certMatch = await JobCertificate.count({
        where: { job_request_id: jobId, assigned_surveyor_id: userId },
        useReplica: true,
    });
    return certMatch > 0;
};

export const getJobs = async (query, scopeFilters = {}, userRole = null, user = null) => {
    const { page = 1, limit = 10, status, created_from, created_to, recent_days, search, ...rest } = query;

    const whereClause = {};
    Object.entries(scopeFilters || {}).forEach(([k, v]) => {
        whereClause[k] = Array.isArray(v) ? { [Op.in]: v } : v;
    });
    await applySurveyorScope(whereClause, user);

    const statuses = parseCsvOrSingle(status);
    if (statuses.length === 1) whereClause.job_status = statuses[0];
    else if (statuses.length > 1) whereClause.job_status = { [Op.in]: statuses };

    ALLOWED_JOB_FILTERS.forEach(k => {
        if (rest[k] == null || String(rest[k]).trim() === '') return;
        const values = parseCsvOrSingle(rest[k]);
        if (k === 'certificate_type_id') {
            if (values.length === 1) whereClause['$certificates.certificate_type_id$'] = values[0];
            else if (values.length > 1) whereClause['$certificates.certificate_type_id$'] = { [Op.in]: values };
        } else {
            if (values.length === 1) whereClause[k] = values[0];
            else if (values.length > 1) whereClause[k] = { [Op.in]: values };
        }
    });

    if (created_from || created_to) {
        whereClause.createdAt = {};
        if (created_from) whereClause.createdAt[Op.gte] = new Date(created_from);
        if (created_to) whereClause.createdAt[Op.lte] = new Date(created_to);
    } else if (INTERNAL_RECENT_ROLES.has(userRole) && !hasAnyUserFilter({ status, created_from, created_to, ...rest })) {
        const days = Math.max(1, parseInt(recent_days || RECENT_JOBS_DEFAULT_DAYS, 10));
        const since = new Date();
        since.setDate(since.getDate() - days);
        whereClause.createdAt = { [Op.gte]: since };
    }

    if (search && String(search).trim().length >= 3) {
        const term = String(search).trim();
        whereClause[Op.or] = [
            { job_request_number: { [Op.like]: `%${term}%` } },
            { target_port: { [Op.like]: `%${term}%` } }
        ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageLimit = Math.max(1, parseInt(limit, 10));

    const jobAttributes = ['id', 'job_request_number', 'vessel_id', 'target_port', 'target_date', 'job_status', 'priority', 'is_survey_required', 'createdAt', 'updatedAt'];

    const include = [
        { model: Vessel, attributes: ['id', 'vessel_name', 'imo_number'] },
        {
            model: JobCertificate,
            as: 'certificates',
            attributes: ['id', 'certificate_type_id', 'status'],
            include: [{ model: CertificateType, attributes: ['id', 'name', 'issuing_authority'] }]
        }
    ];

    const { count, rows } = await JobRequest.findAndCountAll({
        where: whereClause, attributes: jobAttributes,
        limit: pageLimit, offset: (pageNum - 1) * pageLimit,
        order: [['updatedAt', 'DESC']], include,
        distinct: true,
        useReplica: true
    });

    // Calculate status counts
    const statusWhere = { ...whereClause };
    delete statusWhere.job_status;
    const statusInclude = [];
    if (statusWhere['$certificates.certificate_type_id$']) {
        statusInclude.push({
            model: JobCertificate,
            as: 'certificates',
            attributes: []
        });
    }
    const statusCounts = await JobRequest.findAll({
        where: statusWhere,
        attributes: [
            ['job_status', 'status'],
            [db.sequelize.fn('COUNT', db.sequelize.col('job_status')), 'count']
        ],
        include: statusInclude,
        group: ['job_status'],
        raw: true,
        useReplica: true
    });

    const jobs = (await fileAccessService.resolveEntity(rows)).map(j => {
        const vessel_name = j.Vessel?.vessel_name || 'N/A';
        const imo_number = j.Vessel?.imo_number || 'N/A';
        // Summarise all certificate names for list view
        const certificate_names = (j.certificates || []).map(c => c.CertificateType?.name).filter(Boolean).join(', ') || 'N/A';

        return {
            id: j.id || 'N/A',
            job_request_number: j.job_request_number || 'N/A',
            job_status: j.job_status || 'N/A',
            priority: j.priority || 'N/A',
            target_port: j.target_port || 'N/A',
            target_date: j.target_date || 'N/A',
            createdAt: j.createdAt || 'N/A',
            updatedAt: j.updatedAt || 'N/A',
            vessel_name,
            imo_number,
            certificate_names,
            certificate_count: (j.certificates || []).length
        };
    });
    return {
        total: count, page: parseInt(page), limit: parseInt(limit),
        totalPages: Math.ceil(count / pageLimit),
        status_counts: buildFullStatusCounts(statusCounts, JOB_STATUSES),
        jobs
    };
};

export const getJobById = async (id, scopeFilters = {}, user = null) => {
    let accessWhere = { id, ...scopeFilters };
    if (user?.role === 'SURVEYOR') {
        const allowed = await surveyorCanAccessJob(id, user.id);
        if (!allowed) throw { statusCode: 403, message: 'You do not have access to this job.' };
        accessWhere = { id };
    }

    const job = await JobRequest.findOne({
        where: accessWhere,
        include: [
            {
                model: Vessel,
                include: [
                    { model: db.FlagAdministration, as: 'FlagAdministration', attributes: ['id', 'flag_state_name'] },
                    { model: db.Client, as: 'Client', attributes: ['id', 'company_name'] }
                ]
            },
            {
                model: db.JobCertificate,
                as: 'certificates',
                where: user?.role === 'SURVEYOR' ? { assigned_surveyor_id: user.id } : undefined,
                required: false,
                include: [
                    'CertificateType',
                    { model: Survey, as: 'survey' },
                    { model: Certificate, as: 'Certificate', attributes: ['id', 'certificate_number', 'status', 'source_type', 'issue_date', 'expiry_date', 'uploaded_file_url', 'generated_pdf_url', 'pdf_file_url'] }
                ]
            },
            {
                model: db.ActivityRequest,
                as: 'SourceActivityRequest',
                attributes: ['id', 'request_number', 'status', 'activity_type', 'requested_service'],
            },
            { model: User, as: 'approver', attributes: ['id', 'name', 'role'] },
            { model: User, as: 'requester', attributes: ['id', 'name', 'email', 'role'] },
            { model: User, as: 'surveyor', attributes: ['id', 'name', 'email'] },
            { model: Payment, attributes: ['id', 'payment_status', 'amount', 'currency', 'invoice_number', 'payment_date'] }
        ]
    });
    if (!job) throw { statusCode: 404, message: 'The requested job could not be found.' };

    const jobPlain = job.get({ plain: true });

    // ── Vessel Details (flat, N/A for nulls) ──
    const v = jobPlain.Vessel || {};
    jobPlain.vessel_details = {
        vessel_name:  v.vessel_name   || 'N/A',
        imo_number:   v.imo_number    || 'N/A',
        ship_type:    v.ship_type     || 'N/A',
        flag_state:   v.FlagAdministration?.flag_state_name || 'N/A',
        company_name: v.Client?.company_name               || 'N/A',
        class_status: v.class_status  || 'N/A',
    };

    // Expose payment status at top level
    jobPlain.payment_status = jobPlain.Payments?.[0]?.payment_status || 'N/A';

    if (job.Certificate) {
        const cert = job.Certificate;
        const fileKey = cert.source_type === 'EXTERNAL'
            ? (cert.uploaded_file_url || cert.pdf_file_url)
            : (cert.generated_pdf_url || cert.pdf_file_url);
        if (fileKey) {
            const key = fileAccessService.getKeyFromUrl(fileKey);
            jobPlain.certificate_url = key?.startsWith('public/certificates/')
                ? fileAccessService.generatePublicCdnUrl(key)
                : await fileAccessService.generateSignedUrl(key, 3600);
        }
        jobPlain.certificate_number = cert.certificate_number;
        jobPlain.certificate_id = cert.id;
        jobPlain.Certificate = { id: cert.id, certificate_number: cert.certificate_number, source_type: cert.source_type };
    }

    // jobPlain.uploaded_documents = await enrichUploadedDocuments(id, user);

    if (jobPlain.SourceActivityRequest) {
        jobPlain.source_activity_request = {
            id: jobPlain.SourceActivityRequest.id,
            request_number: jobPlain.SourceActivityRequest.request_number,
            status: jobPlain.SourceActivityRequest.status,
            activity_type: jobPlain.SourceActivityRequest.activity_type,
            requested_service: jobPlain.SourceActivityRequest.requested_service,
        };
        delete jobPlain.SourceActivityRequest;
    }

    return await fileAccessService.resolveEntity(jobPlain, user);
};

export const getEligibleSurveyors = async (jobId, queryParams = {}) => {
    const job = await requireJob(jobId);

    let vesselType = null;
    const certNames = [];

    if (job.vessel_id) {
        const vessel = await Vessel.findByPk(job.vessel_id);
        vesselType = vessel?.ship_type;
    }

    const { search, job_certificate_id: jobCertificateId } = queryParams;

    let jobCerts = await JobCertificate.findAll({ where: { job_request_id: jobId } });
    if (jobCertificateId) {
        jobCerts = jobCerts.filter((jc) => jc.id === jobCertificateId);
        if (!jobCerts.length) {
            throw { statusCode: 404, message: 'Job certificate not found for this job.' };
        }
    }
    for (const jc of jobCerts) {
        const certType = await CertificateType.findByPk(jc.certificate_type_id);
        if (certType?.name) certNames.push(certType.name);
    }

    const profileWhere = { status: 'ACTIVE' };
    const userWhere = { status: 'ACTIVE', role: 'SURVEYOR' };

    if (search) {
        profileWhere[Op.or] = [
            { license_number: { [Op.like]: `%${search}%` } },
            db.sequelize.where(db.sequelize.col('User.name'), { [Op.like]: `%${search}%` })
        ];
    }

    const allSurveyors = await SurveyorProfile.findAll({
        where: profileWhere,
        include: [{
            model: User,
            where: userWhere,
            attributes: ['id', 'name', 'email', 'phone', 'profile_pic_url']
        }],
        useReplica: true
    });

    const surveyors = [];

    for (const profile of allSurveyors) {
        let isEligible = true;
        const missing_reasons = [];

        if (vesselType) {
            let authorizedShips = profile.authorized_ship_types;
            if (typeof authorizedShips === 'string') {
                try { authorizedShips = JSON.parse(authorizedShips); } catch (e) { authorizedShips = []; }
            }
            if (!Array.isArray(authorizedShips)) authorizedShips = [];

            if (!authorizedShips.includes(vesselType)) {
                isEligible = false;
                missing_reasons.push(`Missing Vessel Authority (${vesselType})`);
            }
        }

        // Check ALL certificate types
        for (const certName of certNames) {
            let authorizedCerts = profile.authorized_certificates;
            if (typeof authorizedCerts === 'string') {
                try { authorizedCerts = JSON.parse(authorizedCerts); } catch (e) { authorizedCerts = []; }
            }
            if (!Array.isArray(authorizedCerts)) authorizedCerts = [];

            if (!authorizedCerts.includes(certName)) {
                isEligible = false;
                missing_reasons.push(`Missing Certificate Authority (${certName})`);
            }
        }

        if (!profile.is_available) {
            isEligible = false;
            missing_reasons.push('Surveyor is currently UNAVAILABLE/OFFLINE');
        }

        surveyors.push({
            id: profile.User.id,
            name: profile.User.name,
            email: profile.User.email,
            phone: profile.User.phone,
            profile_pic_url: profile.User.profile_pic_url,
            is_available: profile.is_available,
            status: profile.status,
            license_number: profile.license_number,
            years_of_experience: profile.years_of_experience,
            is_eligible: isEligible,
            missing_reasons
        });
    }

    return {
        surveyors,
        eligible: surveyors.filter(s => s.is_eligible),
        not_eligible: surveyors.filter(s => !s.is_eligible)
    };
};

// ─────────────────────────────────────────────
// WORKFLOW TRANSITIONS — one function per transition
// All transitions delegate to lifecycle.service to maintain single source of truth.
// ─────────────────────────────────────────────

/**
 * CREATED → DOCUMENT_VERIFIED
 * Roles: TO
 */
/**
 * CREATED → DOCUMENT_VERIFIED (per JobCertificate)
 * Roles: TO
 */
export const verifyJobCertificateDocuments = async (jobCertificateId, body, user) => {
    let actualBody = body;
    let actualUser = user;
    if (body && body.role && !user) {
        actualUser = body;
        actualBody = {};
    }
    if (!['TO', 'GM', 'ADMIN'].includes(actualUser?.role)) {
        throw { statusCode: 403, message: 'Only Technical Officers (TO), General Managers (GM) or Admins have permission to verify documents.' };
    }
    const userId = actualUser.id;
    const jc = await JobCertificate.findByPk(jobCertificateId, { useMaster: true });
    if (!jc) throw { statusCode: 404, message: 'Job Certificate not found' };

    const jobId = jc.job_request_id;
    const job = await requireJob(jobId, { includeVessel: true, useMaster: true });

    if (!['PENDING', 'REWORK_REQUESTED'].includes(jc.status)) {
        throw { statusCode: 400, message: `Documents can only be verified when the certificate is in PENDING status.` };
    }

    // verifyJobCertificateDocuments: check mandatory docs for this specific certificate
    const requiredDocs = await CertificateRequiredDocument.findAll({
        where: { certificate_type_id: jc.certificate_type_id, is_mandatory: true },
        useMaster: true
    });

    let hasMissingDocs = false;
    const missing = [];
    if (requiredDocs.length > 0) {
        const uploadedDocs = await JobDocument.findAll({
            where: { job_certificate_id: jc.id },
            useMaster: true
        });
        
        for (const rd of requiredDocs) {
            const docsForReq = uploadedDocs.filter(d => d.required_document_id === rd.id);
            if (docsForReq.length === 0) {
                hasMissingDocs = true;
                missing.push({ id: rd.id, name: rd.document_name });
            } else {
                docsForReq.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                if (docsForReq[0].verification_status === 'REJECTED') {
                    hasMissingDocs = true;
                    missing.push({ id: rd.id, name: rd.document_name });
                }
            }
        }
    }

    if (hasMissingDocs && actualBody?.approved !== false) {
        throw { statusCode: 400, message: 'Mandatory documents are missing or rejected and not resubmitted for this certificate.', missing_documents: missing };
    }

    const approved = actualBody?.approved !== false; // default true

    if (!approved) {
        const rejectedDocs = actualBody.rejected_documents;
        if (!rejectedDocs || !Array.isArray(rejectedDocs) || rejectedDocs.length === 0) {
            throw { statusCode: 400, message: 'Please specify which documents are invalid (rejected_documents array required).' };
        }

        // Mark each rejected document (only if they are currently PENDING)
        for (const rd of rejectedDocs) {
            if (!rd.document_id) continue;
            await JobDocument.update(
                {
                    verification_status: 'REJECTED',
                    rejection_reason: rd.reason || 'Document is invalid or not acceptable.',
                    verified_by: userId
                },
                { where: { id: rd.document_id, job_certificate_id: jobCertificateId, verification_status: 'PENDING' } }
            );
        }

        // NOTE: We intentionally do NOT auto-approve remaining docs here.
        // Remaining PENDING docs stay PENDING — the TO must explicitly verify them
        // after the client re-uploads the rejected ones. This prevents partially
        // reviewed documents from being silently approved.

        // Audit trail
        const certType = await CertificateType.findByPk(jc.certificate_type_id);
        const certName = certType ? certType.name : 'Unknown Certificate';

        await JobStatusHistory.create({
            job_id: jobId,
            previous_status: `CERT_${jc.status}`,
            new_status: `CERT_${jc.status}`,
            changed_by: userId,
            reason: `Documents rejected for certificate (${certName}) by ${user.role}`
        });

        // Notify client to re-upload
        const clientUser = await User.findOne({ where: { client_id: job.Vessel.client_id, role: 'CLIENT' }, useMaster: true });
        if (clientUser) {
            notificationService.sendNotification(clientUser.id, 'JOB_DOCUMENTS_REJECTED', {
                jobId: jobId,
                vesselName: job.Vessel.vessel_name,
                rejectedCount: rejectedDocs.length,
                reasons: rejectedDocs.map(rd => rd.reason).filter(Boolean)
            }).catch(() => { });
        }

        const updatedDocs = await JobDocument.findAll({
            where: { job_certificate_id: jobCertificateId },
            include: [{ model: CertificateRequiredDocument }]
        });

        return {
            message: `${rejectedDocs.length} document(s) rejected. Client has been notified to re-upload.`,
            data: {
                job_id: jobId,
                job_certificate_id: jobCertificateId,
                job_status: job.job_status,
                rejected_documents: updatedDocs.filter(d => d.verification_status === 'REJECTED'),
                approved_documents: updatedDocs.filter(d => d.verification_status === 'APPROVED')
            }
        };
    }

    // ── Document Approval Flow ──
    const allDocs = await JobDocument.findAll({
        where: { job_certificate_id: jobCertificateId }
    });

    const pendingDocs = allDocs.filter(d => d.verification_status === 'PENDING');
    if (pendingDocs.length > 0) {
        await JobDocument.update(
            { verification_status: 'APPROVED', verified_by: userId },
            { where: { id: { [Op.in]: pendingDocs.map(d => d.id) } } }
        );
    }

    const successRemarks = actualBody?.remarks || actualBody?.reason || 'Technical Officer verified all documents';
    const updatedJc = await lifecycleService.updateJobCertificateStatus(jobCertificateId, 'DOCUMENT_VERIFIED', userId, successRemarks);

    const allCerts = await db.JobCertificate.findAll({ where: { job_request_id: jobId } });
    const allVerified = allCerts.every(c => c.status === 'DOCUMENT_VERIFIED' || ['ISSUED', 'REJECTED'].includes(c.status));
    if (allVerified) {
        await lifecycleService.updateJobStatus(jobId, 'DOCUMENT_VERIFIED', userId, successRemarks || 'All certificate documents verified');
    }

    // Notify ADMIN/GM/TM
    notificationService.notifyRoles(['ADMIN', 'GM', 'TM'], 'JOB_DOCUMENT_VERIFIED', {
        jobId: jobId, vesselName: job.Vessel.vessel_name
    }).catch(() => { });

    return { message: 'All documents verified successfully for this certificate.', data: updatedJc };
};

/**
 * Verify ALL documents for ALL PENDING certificates of a Job
 * Roles: TO, GM, ADMIN
 */
export const verifyAllJobDocuments = async (jobId, body, user) => {
    let actualUser = user;
    let actualBody = body;
    if (body && body.role && !user) {
        actualUser = body;
        actualBody = {};
    }
    
    if (!['TO', 'GM', 'ADMIN'].includes(actualUser.role)) {
        throw { statusCode: 403, message: 'Only Technical Officers (TO), General Managers (GM) or Admins have permission to verify documents.' };
    }

    const userId = actualUser.id;

    const job = await requireJob(jobId, { includeVessel: true, useMaster: true });
    
    // Get all certificates in PENDING or REWORK_REQUESTED status
    const pendingCerts = await JobCertificate.findAll({ 
        where: { 
            job_request_id: jobId,
            status: { [Op.in]: ['PENDING', 'REWORK_REQUESTED'] }
        },
        include: [{ model: CertificateType, attributes: ['name'] }],
        useMaster: true 
    });

    if (pendingCerts.length === 0) {
        throw { statusCode: 400, message: 'No pending certificates found for this job to verify.' };
    }

    const verifiedCerts = [];
    
    for (const jc of pendingCerts) {
        // Check mandatory docs
        const requiredDocs = await CertificateRequiredDocument.findAll({
            where: { certificate_type_id: jc.certificate_type_id, is_mandatory: true },
            useMaster: true
        });

        if (requiredDocs.length > 0) {
            const uploadedDocs = await JobDocument.findAll({
                where: { job_certificate_id: jc.id },
                useMaster: true
            });
            const missingDocs = [];
            for (const rd of requiredDocs) {
                const docsForReq = uploadedDocs.filter(d => d.required_document_id === rd.id);
                if (docsForReq.length === 0) {
                    missingDocs.push(rd);
                } else {
                    docsForReq.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    if (docsForReq[0].verification_status === 'REJECTED') {
                        missingDocs.push(rd);
                    }
                }
            }
            if (missingDocs.length > 0) {
                const certName = jc.CertificateType?.name || jc.id;
                throw { 
                    statusCode: 400, 
                    message: `Mandatory documents are missing or rejected and not resubmitted for certificate ${certName}. Cannot bulk approve.`,
                    missing_documents: missingDocs.map(m => ({ id: m.id, name: m.document_name }))
                };
            }
        }

        // Approve all pending documents for this certificate
        await JobDocument.update(
            { verification_status: 'APPROVED', verified_by: user.id },
            { where: { job_certificate_id: jc.id, verification_status: 'PENDING' } }
        );

        // Update the certificate status
        const successRemarks = actualBody?.remarks || actualBody?.reason || `${user.role} bulk verified all documents`;
        const updatedJc = await lifecycleService.updateJobCertificateStatus(jc.id, 'DOCUMENT_VERIFIED', user.id, successRemarks);
        verifiedCerts.push(updatedJc);
    }

    const allCerts = await db.JobCertificate.findAll({ where: { job_request_id: jobId } });
    const allVerified = allCerts.every(c => c.status === 'DOCUMENT_VERIFIED' || ['ISSUED', 'REJECTED'].includes(c.status));
    if (allVerified) {
        const successRemarks = actualBody?.remarks || actualBody?.reason || 'All certificate documents verified';
        await lifecycleService.updateJobStatus(jobId, 'DOCUMENT_VERIFIED', user.id, successRemarks);
    }

    // Notify ADMIN/GM/TM
    notificationService.notifyRoles(['ADMIN', 'GM', 'TM'], 'JOB_DOCUMENT_VERIFIED', {
        jobId: jobId, vesselName: job.Vessel.vessel_name
    }).catch(() => { });

    return { 
        message: `Successfully verified all documents for ${verifiedCerts.length} certificate(s).`, 
        data: verifiedCerts 
    };
};

/**
 * DOCUMENT_VERIFIED → APPROVED
 * Roles: ADMIN, GM
 */
export const approveRequest = async (id, remarks, user) => {
    if (!['GM', 'ADMIN'].includes(user.role)) {
        throw { statusCode: 403, message: 'Only General Managers (GM) or Admins have permission to approve job requests.' };
    }
    const job = await requireJob(id, { includeVessel: true, useMaster: true });
    const jobCerts = await JobCertificate.findAll({ where: { job_request_id: id }, useMaster: true });
    const allCertsVerified =
        jobCerts.length > 0 && jobCerts.every((c) => c.status === 'DOCUMENT_VERIFIED');
    const legacyVerified = job.job_status === 'DOCUMENT_VERIFIED';
    const inProgressAllVerified = job.job_status === 'IN_PROGRESS' && allCertsVerified;

    if (!legacyVerified && !inProgressAllVerified) {
        throw {
            statusCode: 400,
            message: 'Jobs can only be approved after all certificate documents have been verified.',
        };
    }

    let updated;
    if (inProgressAllVerified && job.job_status === 'IN_PROGRESS') {
        // Certificate-centric jobs stay IN_PROGRESS while certs move independently; record GM approval.
        await job.update({ approved_by_user_id: user.id });
        await JobStatusHistory.create({
            job_id: id,
            previous_status: job.job_status,
            new_status: job.job_status,
            changed_by: user.id,
            reason: remarks || `${user.role} approved request (all certificates document-verified)`,
        });
        updated = await JobRequest.findByPk(id, { include: ['Vessel'], useMaster: true });
    } else {
        updated = await lifecycleService.updateJobStatus(id, 'APPROVED', user.id, remarks || `${user.role} approved request`);
        await updated.update({ approved_by_user_id: user.id });
    }

    // Notify Client (vessel already loaded)
    const clientUser = await User.findOne({ where: { client_id: job.Vessel.client_id, role: 'CLIENT' }, useMaster: true });
    if (clientUser) {
        notificationService.sendNotification(clientUser.id, 'JOB_APPROVED', {
            jobId: id, vesselName: job.Vessel.vessel_name
        }).catch(() => { });
    }

    return updated;
};

/**
 * APPROVED → FINALIZED (for non-survey jobs)
 * Roles: ADMIN, GM, TM
 */
export const finalizeJob = async (id, remarks, user, options = {}) => {
    const job = await requireJob(id, { useMaster: true });
    if (job.is_survey_required) {
        if (!['REVIEWED', 'SURVEY_DONE'].includes(job.job_status)) {
            throw { statusCode: 400, message: 'This job requires a survey report. It must be Reviewed before finalization.' };
        }
        // Redirect to survey finalization logic
        return await finalizeSurvey(id, user, options);
    }
    if (job.job_status !== 'APPROVED') {
        throw { statusCode: 400, message: `Only approved jobs can be finalized.` };
    }
    return await lifecycleService.updateJobStatus(id, 'FINALIZED', user.id, remarks || `${user.role} finalized non-survey job`);
};

/**
 * Bulk assign surveyor to all certificates of a Job Request
 * Roles: ADMIN, GM
 */
export const assignSurveyor = async (jobId, surveyorId, user) => {
    if (!isRoleAllowed(RBAC.ASSIGN_JOB, user.role)) {
        throw { statusCode: 403, message: 'Only General Managers (GM) or Admins have permission to assign surveyors.' };
    }
    const userId = user.id;
    const job = await requireJob(jobId, { includeVessel: true, useMaster: true });
    const surveyor = await User.findByPk(surveyorId, { useMaster: true });
    if (!surveyor || surveyor.role !== 'SURVEYOR') {
        throw { statusCode: 400, message: 'Invalid surveyor selection. Please select a user with the Surveyor role.' };
    }

    // Validate surveyor authority
    await validateSurveyorAuthority(job, surveyorId);

    if (job.job_status !== 'APPROVED') {
        throw { statusCode: 400, message: 'Cannot assign surveyor. Job request must be approved first.' };
    }

    if (job.assigned_surveyor_id) {
        if (job.assigned_surveyor_id === surveyorId) {
            throw { statusCode: 400, message: 'This surveyor is already assigned to this job.' };
        }
        throw { statusCode: 400, message: 'A surveyor is already assigned to this job. Please use the Reassign feature.' };
    }

    const activeCerts = await db.JobCertificate.findAll({ where: { job_request_id: jobId } });
    const hasUnverifiedCerts = activeCerts.some(cert => ['PENDING', 'REWORK_REQUESTED'].includes(cert.status));
    if (hasUnverifiedCerts) {
        throw { statusCode: 400, message: 'Cannot bulk assign surveyor. Some certificates do not have verified documents yet.' };
    }

    const txn = await db.sequelize.transaction();
    try {
        await job.update({ assigned_surveyor_id: surveyorId, assigned_by_user_id: userId }, { transaction: txn });

        // Sync or create active surveys for these certificates
        if (activeCerts.length > 0) {
            for (const cert of activeCerts) {
                const certType = await db.CertificateType.findByPk(cert.certificate_type_id, { transaction: txn });
                if (certType && certType.requires_survey === false) {
                    continue; // Skip survey assignment for non-survey certificates
                }
                
                // Update surveyor on the specific certificate
                await cert.update({ assigned_surveyor_id: surveyorId }, { transaction: txn });

                const [survey, created] = await db.Survey.findOrCreate({
                    where: { job_certificate_id: cert.id },
                    defaults: {
                        surveyor_id: surveyorId,
                        survey_status: 'NOT_STARTED'
                    },
                    transaction: txn
                });
                if (!created && survey.surveyor_id !== surveyorId) {
                    await survey.update({ surveyor_id: surveyorId }, { transaction: txn });
                }
            }
        }

        // Update Job Status through Lifecycle
        await lifecycleService.updateJobStatus(
            jobId, 'ASSIGNED', userId,
            `Bulk assigned Surveyor ${surveyor.name || surveyorId} to all certificates`,
            { transaction: txn }
        );

        await txn.commit();
    } catch (error) {
        await txn.rollback();
        throw error;
    }

    // Vessel already loaded
    notificationService.sendNotification(surveyorId, 'JOB_ASSIGNED', {
        jobId, vesselName: job.Vessel.vessel_name, port: job.target_port
    });
    return job;
};

/**
 * Assign surveyor to a specific certificate (split assignment)
 * Roles: ADMIN, GM
 */
export const assignSurveyorToCertificate = async (jobCertificateId, surveyorId, user) => {
    if (!isRoleAllowed(RBAC.ASSIGN_JOB, user.role)) {
        throw { statusCode: 403, message: 'You do not have permission to assign surveyors.' };
    }
    const userId = user.id;
    const txn = await db.sequelize.transaction();
    try {
        const jc = await db.JobCertificate.findByPk(jobCertificateId, { transaction: txn, lock: txn.LOCK.UPDATE });
        if (!jc) throw { statusCode: 404, message: 'Job Certificate not found' };

        const job = await JobRequest.findByPk(jc.job_request_id, { include: ['Vessel'], transaction: txn, lock: txn.LOCK.UPDATE });
        if (!job) throw { statusCode: 404, message: 'The requested job could not be found.' };

        const surveyor = await User.findByPk(surveyorId, { transaction: txn, useMaster: true });
        if (!surveyor || surveyor.role !== 'SURVEYOR') {
            throw { statusCode: 400, message: 'Invalid surveyor selection. Please select a user with the Surveyor role.' };
        }

        // Validate surveyor authority for this specific certificate type
        const certType = await db.CertificateType.findByPk(jc.certificate_type_id, { transaction: txn });
        const profile = await db.SurveyorProfile.findOne({ where: { user_id: surveyorId, status: 'ACTIVE' }, transaction: txn });
        if (!profile) {
            throw { statusCode: 400, message: 'Surveyor profile not found or inactive.' };
        }
        let authorizedCerts = profile.authorized_certificates;
        if (typeof authorizedCerts === 'string') {
            try { authorizedCerts = JSON.parse(authorizedCerts); } catch (e) { authorizedCerts = []; }
        }
        if (!Array.isArray(authorizedCerts)) authorizedCerts = [];
        if (certType && !authorizedCerts.includes(certType.name)) {
            throw { statusCode: 400, message: `Surveyor is not authorized to inspect ${certType.name}` };
        }

        if (jc.assigned_surveyor_id) {
            if (jc.assigned_surveyor_id === surveyorId) {
                throw { statusCode: 400, message: 'This surveyor is already assigned to this certificate.' };
            }
            throw { statusCode: 400, message: 'A surveyor is already assigned to this certificate. Please use the Reassign feature.' };
        }

        if (['PENDING', 'REWORK_REQUESTED'].includes(jc.status)) {
            throw { statusCode: 400, message: 'Cannot assign surveyor. Documents for this certificate are not yet verified.' };
        }

        await jc.update({ assigned_surveyor_id: surveyorId }, { transaction: txn });

        if (certType && certType.requires_survey !== false) {
            // Sync or create active survey
            const [survey, created] = await db.Survey.findOrCreate({
                where: { job_certificate_id: jobCertificateId },
                defaults: {
                    surveyor_id: surveyorId,
                    survey_status: 'NOT_STARTED'
                },
                transaction: txn
            });
            if (!created && survey.surveyor_id !== surveyorId) {
                await survey.update({ surveyor_id: surveyorId }, { transaction: txn });
            }
        }

        const surveyorName = surveyor ? surveyor.name : surveyorId;
        const certName = certType ? certType.name : 'Unknown Certificate';

        await db.JobStatusHistory.create({
            job_id: job.id,
            previous_status: job.job_status,
            new_status: job.job_status,
            changed_by: userId,
            reason: `Assigned Surveyor ${surveyorName} to certificate (${certName})`
        }, { transaction: txn });

        // If parent job is APPROVED, transition to ASSIGNED
        if (job.job_status === 'APPROVED') {
            await lifecycleService.updateJobStatus(
                job.id,
                'ASSIGNED',
                userId,
                `Assigned Surveyor ${surveyorName} to certificate (${certName})`,
                { transaction: txn }
            );
        }

        await txn.commit();

        notificationService.sendNotification(surveyorId, 'JOB_ASSIGNED', {
            jobId: job.id, vesselName: job.Vessel?.vessel_name, port: job.target_port
        });

        return jc;
    } catch (error) {
        await txn.rollback();
        throw error;
    }
};

/**
 * Surveyor update without status change (ASSIGNED or later)
 * Roles: GM, TM
 */
export const reassignSurveyor = async (jobId, surveyorId, reason, user) => {
    if (!isRoleAllowed(RBAC.REASSIGN_JOB, user.role)) {
        throw { statusCode: 403, message: 'You do not have permission to reassign surveyors.' };
    }
    const userId = user.id;
    const job = await requireJob(jobId, { includeVessel: true, useMaster: true });

    // Block reassignment for closed jobs
    if (lifecycleService.JOB_TERMINAL_STATES.includes(job.job_status) || lifecycleService.JOB_POST_FINALIZATION_STATES.includes(job.job_status)) {
        throw { statusCode: 400, message: `Cannot reassign surveyor when job is ${job.job_status}.` };
    }

    // Whole-job reassignment is unsafe after any certificate is closed/completed.
    const jobCerts = await JobCertificate.findAll({ where: { job_request_id: jobId }, useMaster: true });
    const hasTerminalCert = jobCerts.some((c) => ['ISSUED', 'REJECTED'].includes(c.status));
    if (hasTerminalCert) {
        throw {
            statusCode: 400,
            message: 'Cannot reassign entire job once any certificate is ISSUED/REJECTED. Use certificate-level reassign instead.',
        };
    }

    const surveys = await Survey.findAll({ where: { job_certificate_id: jobCerts.map((jc) => jc.id) }, useMaster: true });
    const hasFinalizedSurvey = surveys.some((s) => s.survey_status === 'FINALIZED');
    if (hasFinalizedSurvey) {
        throw {
            statusCode: 400,
            message: 'Cannot reassign entire job once any certificate survey is FINALIZED. Use certificate-level reassign for remaining certificates only.',
        };
    }

    // Validate new surveyor authority
    await validateSurveyorAuthority(job, surveyorId);

    if (!job.assigned_surveyor_id) {
        throw { statusCode: 400, message: 'No surveyor is currently assigned to this job. Please use the Assign feature instead.' };
    }
    if (job.assigned_surveyor_id === surveyorId) {
        throw { statusCode: 400, message: 'This surveyor is already assigned to this job. Reassignment requires a different surveyor.' };
    }

    const oldSurveyor = job.assigned_surveyor_id;
    await job.update({ assigned_surveyor_id: surveyorId, assigned_by_user_id: userId });

    await JobCertificate.update(
        { assigned_surveyor_id: surveyorId },
        { where: { job_request_id: jobId } }
    );

    // Status sync is now handled by lifecycle.updateJobStatus
    // We just need to trigger a status update to current status if we want to force a refresh (or rely on next transition)
    // Actually, for reassignment specifically, we update the job and add history. The lifecycle will see the new surveyor on next transition.
    // If we want immediate survey sync, we'd trigger a dummy 'updateJobStatus' but better to just call it reassignment history.

    const oldSurveyorUser = await User.findByPk(oldSurveyor);
    const newSurveyorUser = await User.findByPk(surveyorId);
    const oldName = oldSurveyorUser ? oldSurveyorUser.name : oldSurveyor;
    const newName = newSurveyorUser ? newSurveyorUser.name : surveyorId;

    await JobStatusHistory.create({
        job_id: jobId, previous_status: job.job_status, new_status: job.job_status,
        changed_by: userId, reason: `Reassigned from Surveyor ${oldName} to Surveyor ${newName}: ${reason}`
    });

    // Explicitly sync survey in reassignment case since it doesn't change job status
    if (job.is_survey_required) {
        // For reassignment: update or create all surveys for this job
        const jobCerts = await JobCertificate.findAll({ where: { job_request_id: jobId }, useMaster: true });
        for (const cert of jobCerts) {
            const certType = await db.CertificateType.findByPk(cert.certificate_type_id);
            if (certType && certType.requires_survey === false) continue;

            const [survey, created] = await db.Survey.findOrCreate({
                where: { job_certificate_id: cert.id },
                defaults: {
                    surveyor_id: surveyorId,
                    survey_status: 'NOT_STARTED'
                }
            });
            if (!created && survey.surveyor_id !== surveyorId) {
                await survey.update({ surveyor_id: surveyorId });
            }
        }
    }
    return job;
};

/**
 * Reassign surveyor on a single JobCertificate row
 * Roles: GM, TM, ADMIN
 */
export const reassignSurveyorToCertificate = async (jobCertificateId, surveyorId, reason, user) => {
    if (!isRoleAllowed(RBAC.REASSIGN_JOB, user.role)) {
        throw { statusCode: 403, message: 'You do not have permission to reassign surveyors.' };
    }
    const userId = user.id;
    const jc = await JobCertificate.findByPk(jobCertificateId, { useMaster: true });
    if (!jc) throw { statusCode: 404, message: 'Job Certificate not found' };

    const job = await requireJob(jc.job_request_id, { includeVessel: true, useMaster: true });

    // Block reassignment for closed jobs/certificates
    if (lifecycleService.JOB_TERMINAL_STATES.includes(job.job_status) || lifecycleService.JOB_POST_FINALIZATION_STATES.includes(job.job_status)) {
        throw { statusCode: 400, message: `Cannot reassign surveyor when job is ${job.job_status}.` };
    }
    if (['ISSUED', 'REJECTED'].includes(jc.status)) {
        throw { statusCode: 400, message: `Cannot reassign surveyor for a ${jc.status} certificate.` };
    }
    if (!jc.assigned_surveyor_id) {
        throw { statusCode: 400, message: 'No surveyor is currently assigned to this certificate. Please use the Assign feature instead.' };
    }
    if (jc.assigned_surveyor_id === surveyorId) {
        throw { statusCode: 400, message: 'This surveyor is already assigned to this certificate. Reassignment requires a different surveyor.' };
    }

    await validateSurveyorAuthority(job, surveyorId);

    const oldSurveyor = jc.assigned_surveyor_id;
    await jc.update({ assigned_surveyor_id: surveyorId });

    const [survey, created] = await Survey.findOrCreate({
        where: { job_certificate_id: jobCertificateId },
        defaults: {
            surveyor_id: surveyorId,
            survey_status: 'NOT_STARTED'
        }
    });

    if (!created) {
        if (survey.survey_status === 'FINALIZED') {
            throw { statusCode: 400, message: 'Cannot reassign surveyor after survey is FINALIZED for this certificate.' };
        }
        if (survey.surveyor_id !== surveyorId) {
            await survey.update({ surveyor_id: surveyorId });
        }
    }

    const certType = await CertificateType.findByPk(jc.certificate_type_id);
    const certName = certType ? certType.name : 'Unknown Certificate';
    const oldSurveyorUser = await User.findByPk(oldSurveyor);
    const newSurveyorUser = await User.findByPk(surveyorId);
    const oldName = oldSurveyorUser ? oldSurveyorUser.name : oldSurveyor;
    const newName = newSurveyorUser ? newSurveyorUser.name : surveyorId;

    await JobStatusHistory.create({
        job_id: job.id,
        previous_status: job.job_status,
        new_status: job.job_status,
        changed_by: userId,
        reason: `Certificate (${certName}): reassigned from Surveyor ${oldName} to Surveyor ${newName}: ${reason}`,
    });

    notificationService.sendNotification(surveyorId, 'JOB_ASSIGNED', {
        jobId: job.id,
        vesselName: job.Vessel.vessel_name,
        port: job.target_port,
    });

    return jc;
};

/**
 * ASSIGNED → SURVEY_AUTHORIZED
 * Roles: ADMIN, TM
 */
/**
 * Scoped survey authorization per JobCertificate
 * Roles: ADMIN, TM
 */
export const authorizeSurveyForCertificate = async (jobCertificateId, remarks, user) => {
    if (!isRoleAllowed(RBAC.AUTHORIZE_SURVEY, user.role)) {
        throw { statusCode: 403, message: 'Only Technical Managers (TM) or Admins have permission to authorize surveys.' };
    }
    const jc = await JobCertificate.findByPk(jobCertificateId, { useMaster: true });
    if (!jc) throw { statusCode: 404, message: 'Job Certificate not found' };
    if (!jc.assigned_surveyor_id) {
        throw { statusCode: 400, message: 'Cannot authorize survey: please assign a surveyor first.' };
    }

    if (!['DOCUMENT_VERIFIED'].includes(jc.status)) {
        throw { statusCode: 400, message: `Cannot authorize survey. The certificate must be verified first. Current status: ${jc.status}` };
    }

    const job = await requireJob(jc.job_request_id, { includeVessel: true, useMaster: true });

    const txn = await db.sequelize.transaction();
    try {
        const updatedJc = await lifecycleService.updateJobCertificateStatus(
            jobCertificateId, 'SURVEY_AUTHORIZED', user.id,
            remarks || `${user.role} authorized survey`, { transaction: txn }
        );

        const certType = await db.CertificateType.findByPk(jc.certificate_type_id, { transaction: txn });
        if (certType && certType.requires_survey !== false) {
            // Pre-create Survey record for this JobCertificate
            await db.Survey.findOrCreate({
                where: { job_certificate_id: jobCertificateId },
                defaults: {
                    surveyor_id: jc.assigned_surveyor_id,
                    survey_status: 'NOT_STARTED'
                },
                transaction: txn
            });
        }

        // ── BUG FIX: also update parent job status to SURVEY_AUTHORIZED ──
        // authorizeSurveyForCertificate was only updating the cert, leaving the
        // job in APPROVED state — causing startSurvey to fail with a misleading error.
        const allCerts = await db.JobCertificate.findAll({
            where: { job_request_id: jc.job_request_id },
            transaction: txn
        });
        const allAuthorized = allCerts.every(c =>
            c.id === jobCertificateId
                ? true  // this cert just got authorized
                : ['SURVEY_AUTHORIZED', 'ISSUED', 'REJECTED', 'DOCUMENT_VERIFIED'].includes(c.status)
        );
        if (allAuthorized) {
            await lifecycleService.updateJobStatus(
                jc.job_request_id, 'SURVEY_AUTHORIZED', user.id,
                remarks || `Survey authorized by ${user.role}`, { transaction: txn }
            );
        }

        await txn.commit();

        // Notifications
        notificationService.sendNotification(jc.assigned_surveyor_id, 'JOB_APPROVED', {
            jobId: job.id, status: 'SURVEY_AUTHORIZED', vesselName: job.Vessel?.vessel_name
        });

        return updatedJc;
    } catch (error) {
        await txn.rollback();
        throw error;
    }
};

/**
 * Bulk survey authorization for all valid certificates of a Job
 * Roles: ADMIN, TM
 */
export const authorizeAllSurveysForJob = async (jobId, remarks, user) => {
    if (!isRoleAllowed(RBAC.AUTHORIZE_SURVEY, user.role)) {
        throw { statusCode: 403, message: 'Only Technical Managers (TM) or Admins have permission to authorize surveys.' };
    }
    
    const job = await requireJob(jobId, { includeVessel: true, useMaster: true });
    
    // Find all certificates that are ready to be authorized (verified and assigned)
    const pendingCerts = await JobCertificate.findAll({ 
        where: { 
            job_request_id: jobId,
            status: { [Op.in]: ['DOCUMENT_VERIFIED'] }
        }, 
        useMaster: true 
    });

    if (pendingCerts.length === 0) {
        throw { statusCode: 400, message: 'No certificates found ready for authorization. Ensure they are verified and not already authorized.' };
    }

    const assignedCerts = pendingCerts.filter(jc => jc.assigned_surveyor_id);
    if (assignedCerts.length === 0) {
        throw { statusCode: 400, message: 'No certificates with an assigned surveyor found to authorize.' };
    }

    const authorizedCerts = [];
    const txn = await db.sequelize.transaction();
    try {
        for (const jc of assignedCerts) {
            const certType = await db.CertificateType.findByPk(jc.certificate_type_id, { transaction: txn });
            if (certType && certType.requires_survey === false) {
                continue; // Do not authorize survey for non-survey certificates
            }

            const updatedJc = await lifecycleService.updateJobCertificateStatus(
                jc.id, 'SURVEY_AUTHORIZED', user.id,
                remarks || `${user.role} bulk authorized survey`, { transaction: txn }
            );

            // Pre-create Survey record for this JobCertificate
            await db.Survey.findOrCreate({
                where: { job_certificate_id: jc.id },
                defaults: {
                    surveyor_id: jc.assigned_surveyor_id,
                    survey_status: 'NOT_STARTED'
                },
                transaction: txn
            });
            
            authorizedCerts.push(updatedJc);
            
            // Notifications per surveyor
            notificationService.sendNotification(jc.assigned_surveyor_id, 'JOB_APPROVED', {
                jobId: job.id, status: 'SURVEY_AUTHORIZED', vesselName: job.Vessel?.vessel_name
            });
        }

        await job.update({ job_status: 'SURVEY_AUTHORIZED' }, { transaction: txn });
        await db.JobStatusHistory.create({
            job_id: job.id,
            previous_status: job.job_status,
            new_status: 'SURVEY_AUTHORIZED',
            changed_by: user.id,
            reason: remarks || `${user.role} bulk authorized surveys`
        }, { transaction: txn });

        await txn.commit();
        return { message: `Successfully authorized surveys for ${authorizedCerts.length} certificate(s).`, data: authorizedCerts };
    } catch (error) {
        await txn.rollback();
        throw error;
    }
};

/**
 * Scoped technical review per JobCertificate
 * Roles: TO
 */
export const reviewJobCertificate = async (jobCertificateId, remarks, user) => {
    if (!['TO', 'TM', 'ADMIN'].includes(user.role)) {
        throw { statusCode: 403, message: 'Only Technical Managers (TM), Technical Officers (TO) and Admins have permission to mark a job as reviewed.' };
    }
    const jc = await JobCertificate.findByPk(jobCertificateId, { useMaster: true });
    if (!jc) throw { statusCode: 404, message: 'Job Certificate not found' };
    if (jc.status !== 'SURVEY_DONE') {
        throw { statusCode: 400, message: `Certificates can only be reviewed after the survey has been completed.` };
    }

    const jobId = jc.job_request_id;
    const job = await requireJob(jobId, { includeVessel: true, useMaster: true });

    const txn = await db.sequelize.transaction();
    try {
        // Automatically approve all checklist items scoped to this certificate
        await db.ActivityPlanning.update(
            { status: 'APPROVED' },
            { where: { job_certificate_id: jobCertificateId }, transaction: txn }
        );

        const survey = await db.Survey.findOne({
            where: { job_certificate_id: jobCertificateId },
            transaction: txn,
            lock: txn.LOCK.UPDATE
        });
        if (!survey) {
            throw { statusCode: 400, message: 'Cannot review job certificate: survey report is missing.' };
        }

        let signedFiles = survey.signed_checklist_files;
        if (Array.isArray(signedFiles) && signedFiles.length > 0) {
            const updatedFiles = signedFiles.map(file => {
                if (typeof file === 'object' && file !== null) {
                    return { ...file, status: 'APPROVED' };
                }
                return file;
            });
            await survey.update({ signed_checklist_files: updatedFiles }, { transaction: txn });
        }

        // Audit log TO review approval
        await db.JobStatusHistory.create({
            job_id: jobId,
            previous_status: `CERT_${jc.status}`,
            new_status: `CERT_${jc.status}`,
            changed_by: user.id,
            reason: `TO marked survey checklist and files as APPROVED: ${remarks || 'N/A'}`
        }, { transaction: txn });

        await txn.commit();
    } catch (error) {
        await txn.rollback();
        throw error;
    }

    // Notify ADMIN/TM
    notificationService.notifyRoles(['ADMIN', 'TM'], 'JOB_REVIEWED', {
        jobId: jobId, vesselName: job.Vessel?.vessel_name
    }).catch(() => { });

    return jc;
};

/**
 * Technical review for all SURVEY_DONE certificates of a Job
 * Roles: TO, ADMIN
 */
export const reviewAllJobCertificates = async (jobId, remarks, user) => {
    if (!['TO', 'TM', 'ADMIN'].includes(user.role)) {
        throw { statusCode: 403, message: 'Only Technical Managers (TM), Technical Officers (TO) and Admins have permission to mark surveys as reviewed.' };
    }

    const job = await requireJob(jobId, { includeVessel: true, useMaster: true });
    
    // Find all certificates that are in SURVEY_DONE status
    const certs = await JobCertificate.findAll({
        where: { job_request_id: jobId },
        useMaster: true
    });

    if (certs.length === 0) {
        throw { statusCode: 404, message: 'No certificates found for this job.' };
    }

    const surveyDoneCerts = certs.filter(c => c.status === 'SURVEY_DONE');
    if (surveyDoneCerts.length === 0) {
        throw { statusCode: 400, message: 'No certificates are in SURVEY_DONE status to review.' };
    }

    const txn = await db.sequelize.transaction();
    try {
        for (const jc of surveyDoneCerts) {
            // Automatically approve all checklist items scoped to this certificate or parent job
            await db.ActivityPlanning.update(
                { status: 'APPROVED' },
                { 
                    where: { 
                        [Op.or]: [
                            { job_certificate_id: jc.id },
                            { job_id: jobId }
                        ]
                    }, 
                    transaction: txn 
                }
            );

            const survey = await db.Survey.findOne({
                where: { job_certificate_id: jc.id },
                transaction: txn,
                lock: txn.LOCK.UPDATE
            });

            if (survey) {
                let signedFiles = survey.signed_checklist_files;
                if (Array.isArray(signedFiles) && signedFiles.length > 0) {
                    const updatedFiles = signedFiles.map(file => {
                        if (typeof file === 'object' && file !== null) {
                            return { ...file, status: 'APPROVED' };
                        }
                        return file;
                    });
                    await survey.update({ signed_checklist_files: updatedFiles }, { transaction: txn });
                }
            }

            // Audit log TO review approval
            await db.JobStatusHistory.create({
                job_id: jobId,
                previous_status: `CERT_${jc.status}`,
                new_status: `CERT_${jc.status}`,
                changed_by: user.id,
                reason: `TO marked survey checklist and files as APPROVED for cert ${jc.id}: ${remarks || 'N/A'}`
            }, { transaction: txn });
        }

        // If parent job is in SURVEY_DONE status, transition it to REVIEWED
        if (job.job_status === 'SURVEY_DONE') {
            await lifecycleService.updateJobStatus(jobId, 'REVIEWED', user.id, remarks || 'Bulk reviewed all certificates', { transaction: txn });
        }

        await txn.commit();
    } catch (error) {
        await txn.rollback();
        throw error;
    }

    // Notify ADMIN/TM
    notificationService.notifyRoles(['ADMIN', 'TM'], 'JOB_REVIEWED', {
        jobId: jobId, vesselName: job.Vessel?.vessel_name
    }).catch(() => { });

    return { message: `Successfully reviewed ${surveyDoneCerts.length} certificate(s).` };
};

export const reviewJob = reviewAllJobCertificates;



/**
 * Job status for rescheduling
 */
const RESCHEDULE_ALLOWED_STATUSES = ['CREATED', 'DOCUMENT_VERIFIED', 'APPROVED', 'ASSIGNED', 'SURVEY_AUTHORIZED'];
const RESCHEDULE_BLOCKED_STATUSES = ['IN_PROGRESS', 'SURVEY_DONE', 'REVIEWED', 'FINALIZED', 'PAYMENT_DONE', 'CERTIFIED', 'REJECTED'];

/**
 * Reschedule Job
 * Roles: ADMIN, GM
 */
export const rescheduleJob = async (id, data, userId) => {
    const { new_target_date, new_target_port, reason } = data;
    if (!reason) throw { statusCode: 400, message: 'Reschedule requires a specific reason.' };

    const txn = await db.sequelize.transaction();
    try {
        const job = await JobRequest.findByPk(id, { transaction: txn, lock: txn.LOCK.UPDATE });
        if (!job) throw { statusCode: 404, message: 'The requested job could not be found.' };

        if (!RESCHEDULE_ALLOWED_STATUSES.includes(job.job_status)) {
            throw { statusCode: 400, message: `Rescheduling is not possible while the job is in ${job.job_status} status.` };
        }

        if (RESCHEDULE_BLOCKED_STATUSES.includes(job.job_status)) {
            throw { statusCode: 400, message: `Rescheduling is blocked as the survey has already started or the job is closed.` };
        }

        const old_target_date = job.target_date;
        const old_target_port = job.target_port;

        // Insert into job_reschedules
        await JobReschedule.create({
            job_id: id,
            old_target_date,
            new_target_date,
            old_target_port,
            new_target_port,
            reason,
            requested_by: userId
        }, { transaction: txn });

        // Update job
        await job.update({
            target_date: new_target_date,
            target_port: new_target_port,
            reschedule_count: (job.reschedule_count || 0) + 1
        }, { transaction: txn });

        // Audit Log
        await JobStatusHistory.create({
            job_id: id,
            previous_status: job.job_status,
            new_status: job.job_status,
            changed_by: userId,
            reason: `Rescheduled: ${reason} (Port: ${old_target_port} -> ${new_target_port}, Date: ${old_target_date} -> ${new_target_date})`
        }, { transaction: txn });

        await txn.commit();

        // Notify surveyor if assigned
        if (job.assigned_surveyor_id) {
            const jobWithVessel = await JobRequest.findByPk(id, { include: ['Vessel'], useMaster: true });
            notificationService.sendNotification(job.assigned_surveyor_id, 'JOB_RESCHEDULED', {
                jobId: id,
                vesselName: jobWithVessel.Vessel.vessel_name,
                newDate: new_target_date,
                newPort: new_target_port,
                reason
            });
        }

        return job;
    } catch (error) {
        await txn.rollback();
        throw error;
    }
};



/**
 * → REJECTED (terminal)
 * ADMIN: any non-terminal | GM: CREATED only | TM: ASSIGNED, SURVEY_DONE, REVIEWED
 */
export const rejectJob = async (id, remarks, user) => {
    const job = await requireJob(id, { useMaster: true });
    const { role } = user;
    const current = job.job_status;

    // Terminal guard
    if (lifecycleService.JOB_TERMINAL_STATES.includes(current)) {
        throw { statusCode: 400, message: `This job is already closed (${current}) and cannot be rejected.` };
    }

    if (['ADMIN', 'GM'].includes(role)) {
        // Can reject any status BEFORE Finalized or Certified
        if (lifecycleService.JOB_POST_FINALIZATION_STATES.includes(current)) {
            throw { statusCode: 400, message: `Jobs that are already ${current} cannot be rejected.` };
        }
    } else if (role === 'TM') {
        // Technical Managers restricted to their specific oversight states
        if (!['ASSIGNED', 'SURVEY_DONE', 'REVIEWED'].includes(current)) {
            throw { statusCode: 403, message: 'Technical Managers can only reject jobs that are in ASSIGNED, SURVEY_DONE, or REVIEWED status.' };
        }
    } else {
        throw { statusCode: 403, message: `Role ${role} does not have permission to reject jobs.` };
    }

    return await lifecycleService.updateJobStatus(id, 'REJECTED', user.id, remarks || `${role} rejected job`);
};

/**
 * → REJECTED (cancel path — ADMIN / GM can cancel any non-terminal job)
 */
export const cancelJob = async (id, reason, userId) => {
    const job = await requireJob(id, { useMaster: true });
    const current = job.job_status;

    if (lifecycleService.JOB_TERMINAL_STATES.includes(current)) {
        throw { statusCode: 400, message: `This job is already closed (${current}) and cannot be cancelled.` };
    }

    // Block cancellation of finalized/certified jobs
    if (lifecycleService.JOB_POST_FINALIZATION_STATES.includes(current)) {
        throw { statusCode: 400, message: `Jobs that are already ${current} cannot be cancelled.` };
    }

    return await lifecycleService.updateJobStatus(id, 'REJECTED', userId, reason || 'Job cancelled');
};

/**
 * → REJECTED (CLIENT cancel path — allowed ONLY when job is in CREATED status)
 * Once the job progresses beyond CREATED (e.g. DOCUMENT_VERIFIED), only ADMIN/GM can cancel.
 */
export const cancelJobForClient = async (id, reason, clientId, userId) => {
    const job = await JobRequest.findByPk(id, { include: ['Vessel'], useMaster: true });
    if (!job) throw { statusCode: 404, message: 'The requested job could not be found.' };
    if (job.Vessel.client_id !== clientId) {
        throw { statusCode: 403, message: 'Access denied: this job does not belong to your account.' };
    }
    if (job.job_status !== 'CREATED') {
        throw {
            statusCode: 400,
            message: 'You can only cancel a job that is still in CREATED status. Please contact the GR-CLASS team for further assistance.'
        };
    }
    return await lifecycleService.updateJobStatus(id, 'REJECTED', userId, reason || 'Cancelled by client');
};

// ─────────────────────────────────────────────
// JOB DOCUMENTS
// ─────────────────────────────────────────────

/**
 * List all documents for a job with their verification status.
 * Returns documents grouped by certificate type for multi-certificate jobs.
 */
export const getJobDocuments = async (jobId, user) => {
    const job = await requireJob(jobId, { includeVessel: true });

    // Client can only see their own jobs' docs
    if (user.role === 'CLIENT') {
        const vessel = await Vessel.findByPk(job.vessel_id);
        if (!vessel || vessel.client_id !== user.client_id) {
            throw { statusCode: 403, message: 'Access denied: this job does not belong to your account.' };
        }
    }

    const docs = await JobDocument.findAll({
        where: { job_id: jobId },
        include: [{
            model: CertificateRequiredDocument,
            attributes: ['id', 'document_name', 'is_mandatory']
        }],
        order: [['createdAt', 'ASC']],
        useReplica: true
    });

    const resolvedDocs = await fileAccessService.resolveEntity(docs, user);

    // Fetch all certificates for this job (with type info)
    const jobCerts = await JobCertificate.findAll({
        where: { job_request_id: jobId },
        include: [{ model: CertificateType, attributes: ['id', 'name', 'issuing_authority', 'requires_survey'] }],
        useReplica: true
    });

    // Build per-certificate grouped response
    const certificates = await Promise.all(jobCerts.map(async (jc) => {
        const jcPlain = jc.get({ plain: true });

        // Required docs for this specific certificate type
        const requiredDocs = await CertificateRequiredDocument.findAll({
            where: { certificate_type_id: jcPlain.certificate_type_id },
            useReplica: true
        });

        // Docs uploaded specifically for this certificate (by job_certificate_id)
        const certDocs = resolvedDocs.filter(d => d.job_certificate_id === jc.id);

        // Group requirements with upload status
        const groupedRequirements = requiredDocs.map(rd => {
            const docsForReq = certDocs.filter(d => d.required_document_id === rd.id);
            let status = 'MISSING';
            if (docsForReq.length > 0) {
                docsForReq.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                status = docsForReq[0].verification_status; // latest: PENDING, APPROVED, REJECTED
            }
            return {
                requirement_id: rd.id,
                document_name: rd.document_name,
                is_mandatory: rd.is_mandatory,
                status,
                uploaded_versions: docsForReq
            };
        });

        const customDocuments = certDocs.filter(d => !d.required_document_id);

        return {
            job_certificate_id: jc.id,
            certificate_type_id: jcPlain.certificate_type_id,
            certificate_type_name: jcPlain.CertificateType?.name || null,
            issuing_authority: jcPlain.CertificateType?.issuing_authority || null,
            requires_survey: jcPlain.CertificateType?.requires_survey ?? true,
            certificate_status: jcPlain.status,
            rework_remarks: jcPlain.rework_remarks || null,
            grouped_requirements: groupedRequirements,
            custom_documents: customDocuments,
            summary: {
                total_uploaded: certDocs.length,
                approved: certDocs.filter(d => d.verification_status === 'APPROVED').length,
                rejected: certDocs.filter(d => d.verification_status === 'REJECTED').length,
                pending: certDocs.filter(d => d.verification_status === 'PENDING').length,
                missing: groupedRequirements.filter(r => r.status === 'MISSING').length
            }
        };
    }));

    // Also include any "global" docs not tied to a specific certificate
    const globalDocs = resolvedDocs.filter(d => !d.job_certificate_id);
    const allDocs = docs;

    return {
        certificates,
        global_documents: globalDocs,
        summary: {
            total_uploaded: allDocs.length,
            approved: allDocs.filter(d => d.verification_status === 'APPROVED').length,
            rejected: allDocs.filter(d => d.verification_status === 'REJECTED').length,
            pending: allDocs.filter(d => d.verification_status === 'PENDING').length,
            missing: certificates.reduce((acc, cg) => acc + cg.summary.missing, 0)
        }
    };
};

/**
 * Upload additional documents for a job (Client adds new/missing docs).
 * Only allowed while job is in CREATED status.
 * documents: [{ required_document_id, file_url }]
 */
export const uploadJobDocuments = async (jobId, documents, user) => {
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
        throw { statusCode: 400, message: 'Please provide at least one document to upload.' };
    }

    const job = await requireJob(jobId, { includeVessel: true, useMaster: true });

    const jobCerts = await JobCertificate.findAll({ where: { job_request_id: jobId }, useMaster: true });
    const hasPendingCert = jobCerts.some((c) => ['PENDING', 'REWORK_REQUESTED'].includes(c.status));
    const UPLOAD_ALLOWED_STATUSES = ['CREATED', 'REWORK_REQUESTED'];
    const inProgressWithPendingCert = job.job_status === 'IN_PROGRESS' && hasPendingCert;
    if (!UPLOAD_ALLOWED_STATUSES.includes(job.job_status) && !inProgressWithPendingCert) {
        throw { statusCode: 400, message: 'Documents can only be uploaded while the job is in CREATED, REWORK_REQUESTED, or IN_PROGRESS with a certificate still awaiting verification.' };
    }

    // Client ownership check
    if (user.role === 'CLIENT') {
        const vessel = await Vessel.findByPk(job.vessel_id, { useMaster: true });
        if (!vessel || vessel.client_id !== user.client_id) {
            throw { statusCode: 403, message: 'Access denied: this job does not belong to your account.' };
        }
    }

    const created = [];
    for (const doc of documents) {
        if (!doc.file_url) {
            throw { statusCode: 400, message: 'Each document must have a file_url.' };
        }
        if (!doc.required_document_id && !doc.custom_document_name) {
            throw { statusCode: 400, message: 'Each document must have either required_document_id or custom_document_name.' };
        }

        // Check if a PENDING document already exists for this requirement/name
        const existingPending = await JobDocument.findOne({
            where: {
                job_id: jobId,
                verification_status: 'PENDING',
                ...(doc.required_document_id ? { required_document_id: doc.required_document_id } : { custom_document_name: doc.custom_document_name })
            },
            useMaster: true
        });

        if (existingPending) {
            // Overwrite existing pending document
            await existingPending.update({
                file_url: doc.file_url,
                uploaded_by: user.id,
                job_certificate_id: doc.job_certificate_id || existingPending.job_certificate_id || null,
                rejection_reason: null // Clear any old rejection reason if it was somehow reused
            });
            created.push(existingPending);
        } else {
            // Create a new record
            const newDoc = await JobDocument.create({
                job_id: jobId,
                job_certificate_id: doc.job_certificate_id || null,
                required_document_id: doc.required_document_id || null,
                custom_document_name: doc.custom_document_name || null,
                file_url: doc.file_url,
                uploaded_by: user.id,
                verification_status: 'PENDING'
            });
            created.push(newDoc);
        }
    }

    // Notify TO that new documents were uploaded
    notificationService.notifyRoles(['TO'], 'JOB_DOCUMENTS_UPLOADED', {
        jobId,
        vesselName: job.Vessel.vessel_name,
        count: created.length
    }).catch(() => { });

    return created;
};

/**
 * Re-upload a rejected document (Client fixes the doc TO flagged as invalid).
 * Replaces the old file_url and resets status to PENDING.
 */
export const reuploadJobDocument = async (jobId, documentId, body, user) => {
    if (!body.file_url) {
        throw { statusCode: 400, message: 'Please provide the new file_url for the document.' };
    }

    const job = await requireJob(jobId, { includeVessel: true, useMaster: true });

    const jobCerts = await JobCertificate.findAll({ where: { job_request_id: jobId }, useMaster: true });
    const hasPendingCert = jobCerts.some((c) => ['PENDING', 'REWORK_REQUESTED'].includes(c.status));
    const reuploadAllowed =
        ['CREATED', 'REWORK_REQUESTED'].includes(job.job_status) ||
        (job.job_status === 'IN_PROGRESS' && hasPendingCert);
    if (!reuploadAllowed) {
        throw { statusCode: 400, message: 'Documents can only be re-uploaded while the job allows document corrections.' };
    }

    // Client ownership check
    if (user.role === 'CLIENT') {
        const vessel = await Vessel.findByPk(job.vessel_id, { useMaster: true });
        if (!vessel || vessel.client_id !== user.client_id) {
            throw { statusCode: 403, message: 'Access denied: this job does not belong to your account.' };
        }
    }

    const doc = await JobDocument.findOne({
        where: { id: documentId, job_id: jobId },
        useMaster: true
    });
    if (!doc) {
        throw { statusCode: 404, message: 'Document not found for this job.' };
    }

    if (doc.verification_status === 'APPROVED') {
        throw { statusCode: 400, message: `Approved documents cannot be re-uploaded. This document is currently: ${doc.verification_status}.` };
    }

    // Check if a PENDING version already exists for this requirement/name and certificate
    const existingPending = await JobDocument.findOne({
        where: {
            job_id: jobId,
            verification_status: 'PENDING',
            ...(doc.required_document_id ? { required_document_id: doc.required_document_id } : { custom_document_name: doc.custom_document_name }),
            ...(doc.job_certificate_id ? { job_certificate_id: doc.job_certificate_id } : {})
        },
        useMaster: true
    });

    if (existingPending) {
        // Reject existing pending document automatically
        await existingPending.update({
            verification_status: 'REJECTED',
            rejection_reason: 'Automatically rejected due to new document upload.',
            verified_by: user.id
        });
    }

    // Always create a NEW record to maintain the audit trail
    const resultDoc = await JobDocument.create({
        job_id: jobId,
        job_certificate_id: doc.job_certificate_id,
        required_document_id: doc.required_document_id,
        custom_document_name: doc.custom_document_name,
        file_url: body.file_url,
        verification_status: 'PENDING',
        uploaded_by: user.id
    });

    // Notify TO that a document was re-uploaded (or updated)
    notificationService.notifyRoles(['TO'], 'JOB_DOCUMENT_REUPLOADED', {
        jobId,
        vesselName: job.Vessel.vessel_name,
        documentId: resultDoc.id
    }).catch(() => { });

    return resultDoc;
};

// ─────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────

export const updatePriority = async (jobId, priority, reason, userId) => {
    const job = await requireJob(jobId, { useMaster: true });
    const oldPriority = job.priority;
    await job.update({ priority });
    await AuditLog.create({
        user_id: userId, action: 'UPDATE_PRIORITY',
        entity_name: 'JobRequest', entity_id: job.id,
        old_values: { priority: oldPriority }, new_values: { priority }, reason
    });
    return job;
};

export const getJobHistory = async (id, scopeFilters = {}) => {
    // Check if job exists and is accessible by the user (scope filtering)
    const job = await JobRequest.findOne({ where: { id, ...scopeFilters } });
    if (!job) {
        throw { statusCode: 404, message: 'The requested job could not be found or you do not have permission to view its history.' };
    }

    const jobHistory = await JobStatusHistory.findAll({
        where: { job_id: id },
        order: [['created_at', 'ASC']],
        attributes: ['id', 'job_id', 'previous_status', 'new_status', 'changed_by', 'reason', 'created_at'],
        include: [{ model: User, attributes: ['name', 'email', 'role'] }],
        useReplica: true
    });

    const jobCerts = await db.JobCertificate.findAll({ where: { job_request_id: id } });
    const certIds = jobCerts.map(jc => jc.id);
    const surveys = certIds.length > 0 ? await Survey.findAll({ where: { job_certificate_id: certIds }, useReplica: true }) : [];
    const surveyIds = surveys.map(s => s.id);
    const surveyHistory = surveyIds.length > 0 ? await db.SurveyStatusHistory.findAll({
        where: { survey_id: surveyIds },
        order: [['created_at', 'ASC']],
        attributes: ['id', 'survey_id', 'previous_status', 'new_status', 'changed_by', 'reason', 'submission_iteration', 'createdAt'],
        include: [{ model: User, as: 'User', attributes: ['name', 'email', 'role'] }],
        useReplica: true
    }) : [];

    const formattedJobHistory = jobHistory.map(h => {
        const plain = h.get({ plain: true });
        return {
            ...plain,
            changed_by_name: plain.User?.name || 'System/Admin',
            changed_by_role: plain.User?.role || 'SYSTEM'
        };
    });

    const formattedSurveyHistory = surveyHistory.map(h => {
        const plain = h.get({ plain: true });
        return {
            ...plain,
            changed_by_name: plain.User?.name || 'System/Admin',
            changed_by_role: plain.User?.role || 'SYSTEM'
        };
    });

    return {
        job_history: formattedJobHistory,
        survey_history: formattedSurveyHistory
    };
};

export const addInternalNote = async (jobId, noteText, userId) => {
    const note = await db.JobNote.create({ job_id: jobId, user_id: userId, note_text: noteText, is_internal: true });
    await db.Message.create({
        job_id: jobId,
        sender_id: userId,
        message_text: noteText,
        is_internal: true,
        attachment_url: null
    });
    return note;
};

export const updateJobStatus = (id, status, remarks, userId) => {
    throw { statusCode: 400, message: 'Direct status update is disabled. Use semantic workflow endpoints.' };
};
