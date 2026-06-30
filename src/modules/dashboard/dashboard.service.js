import db from '../../models/index.js';
import { Op } from 'sequelize';
import * as cache from '../../services/cache.service.js';

const { User, Client, Vessel, JobRequest, SurveyorProfile, Certificate, FlagAdministration, Survey, CertificateType, Payment, NonConformity, SurveyorApplication, WebsiteContact, JobCertificate } = db;

const vesselAttrs = ['id', 'vessel_name', 'imo_number', 'flag_administration_id', 'class_status'];

export const getAdminDashboard = async () => {
    return cache.getOrSet('dashboard:admin', async () => {
        const stats = await getOperationalStats();
        const roleCountsRaw = await User.findAll({
            attributes: ['role', [db.sequelize.fn('COUNT', 'role'), 'count']],
            group: ['role'],
            raw: true,
            useReplica: true
        });

        const roleCounts = roleCountsRaw.reduce((acc, r) => {
            acc[r.role] = parseInt(r.count, 10);
            return acc;
        }, {});

        return {
            role: 'ADMIN',
            summary: {
                ...stats.summary,
                users: {
                    total: roleCountsRaw.reduce((sum, r) => sum + parseInt(r.count, 10), 0),
                    by_role: roleCounts,
                    admin: roleCounts.ADMIN || 0,
                    gm: roleCounts.GM || 0,
                    tm: roleCounts.TM || 0,
                    to: roleCounts.TO || 0,
                    surveyors: stats.surveyorCount,
                    clients: roleCounts.CLIENT || 0,
                },
            },
            client_with_vessels: stats.client_with_vessels,
            recent_activities: stats.recent_activities
        };
    }, cache.TTL.DASHBOARD);
}

const getOperationalStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date();
    target.setDate(today.getDate() + 30);
    target.setHours(23, 59, 59, 999);

    const [
        clientsWithVessels,
        vesselsCount,
        jobsCount,
        certificatesCount,
        surveyorProfilesCount,
        jobStatusCountsRaw,
        certStatusCountsRaw,
        surveyStatusCountsRaw,
        ncCountsRaw,
        expiringCertsCount,
        recentJobs,
        recentCertificates,
        recentSurveyApplications,
        recentSurveys,
        recentNCs,
        recentEnquiries,
        draftingNeededJobs
    ] = await Promise.all([
        Client.findAll({
            where: { status: 'ACTIVE' },
            include: [{
                model: Vessel,
                as: 'Vessels',
                required: false,
                attributes: vesselAttrs,
                include: [{ model: FlagAdministration, as: 'FlagAdministration', attributes: ['flag_state_name'] }]
            }],
            useReplica: true
        }),
        Vessel.count({ useReplica: true }),
        JobRequest.count({ useReplica: true }),
        Certificate.count({ useReplica: true }),
        SurveyorProfile.count({ where: { status: 'ACTIVE' }, useReplica: true }),
        JobRequest.findAll({
            attributes: ['job_status', [db.sequelize.fn('COUNT', 'job_status'), 'count']],
            group: ['job_status'],
            raw: true,
            useReplica: true
        }),
        Certificate.findAll({
            attributes: ['status', [db.sequelize.fn('COUNT', 'status'), 'count']],
            group: ['status'],
            raw: true,
            useReplica: true
        }),
        Survey.findAll({
            attributes: ['survey_status', [db.sequelize.fn('COUNT', 'survey_status'), 'count']],
            group: ['survey_status'],
            raw: true,
            useReplica: true
        }),
        NonConformity.findAll({
            attributes: ['status', [db.sequelize.fn('COUNT', 'status'), 'count']],
            group: ['status'],
            raw: true,
            useReplica: true
        }),
        Certificate.count({
            where: {
                status: 'VALID',
                expiry_date: {
                    [Op.between]: [today, target]
                }
            },
            useReplica: true
        }),
        JobRequest.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [
                { model: Vessel, attributes: ['vessel_name'] },
                { model: JobCertificate, as: 'certificates', include: [{ model: CertificateType, attributes: ['name'] }] }
            ],
            useReplica: true
        }),
        Certificate.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [{ model: Vessel, attributes: ['vessel_name'] }],
            useReplica: true
        }),
        SurveyorApplication.findAll({
            limit: 5,
            attributes: ['id', 'full_name', 'email', 'phone', 'status', 'created_at'],
            order: [['createdAt', 'DESC']],
            useReplica: true
        }),
        Survey.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'job_certificate_id', 'survey_status', 'submitted_at', 'created_at'],
            include: [
                {
                    model: JobCertificate,
                    include: [
                        {
                            model: JobRequest,
                            attributes: ['id', 'job_status', 'vessel_id'],
                            include: [{ model: Vessel, attributes: ['vessel_name'] }]
                        }
                    ]
                },
                { model: User, attributes: ['name', 'email'] }
            ],
            useReplica: true
        }),
        NonConformity.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'job_id', 'description', 'severity', 'status', 'created_at'],
            include: [{ model: JobRequest, attributes: ['id', 'job_status', 'vessel_id'], include: [{ model: Vessel, attributes: ['vessel_name'] }] }],
            useReplica: true
        }),
        WebsiteContact.findAll({
            limit: 5,
            attributes: ['id', 'full_name', 'company', 'corporate_email', 'status', 'created_at'],
            order: [['createdAt', 'DESC']],
            useReplica: true
        }),
        JobRequest.findAll({
            where: {
                job_status: 'FINALIZED'
            },
            limit: 5,
            order: [['updatedAt', 'DESC']],
            include: [
                { model: Vessel, attributes: ['vessel_name'] },
                {
                    model: JobCertificate,
                    as: 'certificates',
                    required: true,
                    where: {
                        generated_certificate_id: null
                    },
                    include: [{ model: CertificateType, attributes: ['name'] }]
                }
            ],
            useReplica: true
        })
    ]);

    const jobsByStatus = jobStatusCountsRaw.reduce((acc, j) => {
        const status = j.job_status || 'CREATED';
        acc[status] = (acc[status] || 0) + parseInt(j.count, 10);
        return acc;
    }, {});

    const certsByStatus = certStatusCountsRaw.reduce((acc, c) => {
        const status = c.status || 'VALID';
        acc[status] = (acc[status] || 0) + parseInt(c.count, 10);
        return acc;
    }, {});

    const surveysByStatus = surveyStatusCountsRaw.reduce((acc, s) => {
        const status = s.survey_status || 'NOT_STARTED';
        acc[status] = (acc[status] || 0) + parseInt(s.count, 10);
        return acc;
    }, {});

    const ncByStatus = ncCountsRaw.reduce((acc, n) => {
        const status = n.status || 'OPEN';
        acc[status] = (acc[status] || 0) + parseInt(n.count, 10);
        return acc;
    }, {});

    const clients = clientsWithVessels.map((c) => ({
        id: c.id,
        company_name: c.company_name,
        company_code: c.company_code,
        email: c.email,
        status: c.status,
        vessels: (c.Vessels || []).map((v) => ({
            id: v.id,
            vessel_name: v.vessel_name,
            imo_number: v.imo_number,
            flag: v.FlagAdministration?.flag_state_name,
            status: v.class_status,
        })),
    }));

    const sortedClients = clients
        .filter(c => c.vessels && c.vessels.length > 0)
        .sort((a, b) => b.vessels.length - a.vessels.length)
        .slice(0, 5);

    return {
        summary: {
            vessels: vesselsCount,
            clients: clients.length,
            jobs: { total: jobsCount, by_status: jobsByStatus },
            surveys: { total: surveyStatusCountsRaw.reduce((sum, s) => sum + parseInt(s.count, 10), 0), by_status: surveysByStatus },
            certificates: { 
                total: certificatesCount, 
                by_status: certsByStatus,
                expiring_soon: expiringCertsCount 
            },
            non_conformities: { total: ncCountsRaw.reduce((sum, n) => sum + parseInt(n.count, 10), 0), by_status: ncByStatus }
        },
        surveyorCount: surveyorProfilesCount,
        client_with_vessels: sortedClients,
        actionable_items: {
            drafting_needed: draftingNeededJobs.map(j => ({
                id: j.id,
                job_request_number: j.job_request_number,
                vessel: j.vessel_id === null || j.vessel_id === undefined ? "Company Wide" : (j.Vessel?.vessel_name || null),
                type: (j.certificates || []).map(c => c.CertificateType?.name).filter(Boolean).join(', ') || 'N/A',
                finalized_at: j.updatedAt
            }))
        },
        recent_activities: {
            jobs: recentJobs.map(j => ({
                id: j.id,
                job_request_number: j.job_request_number,
                vessel: j.vessel_id === null || j.vessel_id === undefined ? "Company Wide" : (j.Vessel?.vessel_name || null),
                type: (j.certificates || []).map(c => c.CertificateType?.name).filter(Boolean).join(', ') || 'N/A',
                status: j.job_status,
                created_at: j.createdAt
            })),
            certificates: recentCertificates.map(c => ({
                id: c.id,
                vessel: c.vessel_id === null || c.vessel_id === undefined ? "Company Wide" : (c.Vessel?.vessel_name || null),
                name: c.certificate_name,
                status: c.status,
                issued_at: c.issued_date || c.createdAt
            })),
            survey_applications: recentSurveyApplications.map(a => ({
                id: a.id,
                name: a.full_name,
                email: a.email,
                qualification: a.qualification,
                status: a.status,
                created_at: a.createdAt
            })),
            surveys: recentSurveys.map(s => ({
                id: s.id,
                vessel: (s.JobCertificate?.JobRequest?.vessel_id === null || s.JobCertificate?.JobRequest?.vessel_id === undefined || s.JobRequest?.vessel_id === null || s.JobRequest?.vessel_id === undefined)
                    ? "Company Wide"
                    : (s.JobCertificate?.JobRequest?.Vessel?.vessel_name ?? s.JobRequest?.Vessel?.vessel_name ?? null),
                surveyor: s.User?.name,
                status: s.survey_status,
                updated_at: s.updatedAt
            })),
            non_conformities: recentNCs.map(n => ({
                id: n.id,
                vessel: n.JobRequest?.vessel_id === null || n.JobRequest?.vessel_id === undefined ? "Company Wide" : (n.JobRequest?.Vessel?.vessel_name || null),
                description: n.description,
                status: n.status,
                created_at: n.createdAt
            })),
            enquiries: recentEnquiries.map(e => ({
                id: e.id,
                name: e.name,
                subject: e.subject,
                status: e.status,
                created_at: e.createdAt
            }))
        }
    };
}

export const getGMDashboard = async () => {
    return cache.getOrSet('dashboard:gm', async () => {
        const stats = await getOperationalStats();

        // ACTIONABLE: Jobs that are FINALIZED and have a DRAFT certificate ready for GM issuance
        const pendingIssuanceJobs = await JobRequest.findAll({
            where: { job_status: 'FINALIZED' },
            include: [
                { model: Vessel, attributes: ['vessel_name', 'imo_number'] },
                {
                    model: JobCertificate,
                    as: 'certificates',
                    required: true,
                    include: [
                        { model: CertificateType, attributes: ['name'] },
                        { model: db.Certificate, as: 'Certificate', required: true, where: { status: 'DRAFT' } }
                    ]
                }
            ],
            order: [['updatedAt', 'DESC']],
            limit: 10,
            subQuery: false,
            useReplica: true
        });

        return {
            role: 'GM',
            summary: stats.summary,
            actionable_items: {
                pending_issuance: pendingIssuanceJobs.flatMap(j =>
                    (j.certificates || []).map(c => ({
                        id: j.id,
                        job_request_number: j.job_request_number,
                        certificate_id: c.generated_certificate_id,
                        vessel: j.vessel_id === null || j.vessel_id === undefined ? "Company Wide" : (j.Vessel?.vessel_name || null),
                        type: c.CertificateType?.name || 'N/A',
                        finalized_at: j.updatedAt
                    }))
                )
            },
            client_with_vessels: stats.client_with_vessels,
            recent_activities: stats.recent_activities
        };
    }, cache.TTL.DASHBOARD);
}

export const getTMDashboard = async (user) => {
    return cache.getOrSet('dashboard:tm', async () => { // TM view is role-wide, not per-user
    const jobIncludes = [
        { model: Vessel, attributes: ['vessel_name', 'imo_number'] },
        { model: JobCertificate, as: 'certificates', include: [{ model: CertificateType, attributes: ['name'] }] },
        { model: User, as: 'requester', attributes: ['name', 'email'] }
    ];

    const [
        pendingAssignmentJobs,
        pendingAuthorizationJobs,
        pendingFinalizationJobs,
        allJobsRaw
    ] = await Promise.all([
        JobRequest.findAll({
            where: { job_status: 'DOCUMENT_VERIFIED' },
            include: jobIncludes,
            order: [['updatedAt', 'DESC']],
            limit: 5,
            useReplica: true
        }),
        JobRequest.findAll({
            where: { job_status: 'ASSIGNED' },
            include: jobIncludes,
            order: [['updatedAt', 'DESC']],
            limit: 5,
            useReplica: true
        }),
        JobRequest.findAll({
            where: { job_status: { [Op.in]: ['REVIEWED', 'PAYMENT_DONE'] } },
            include: jobIncludes,
            order: [['updatedAt', 'DESC']],
            limit: 5,
            useReplica: true
        }),
        JobRequest.findAll({
            attributes: ['job_status', [db.sequelize.fn('COUNT', 'job_status'), 'count']],
            where: { job_status: ['DOCUMENT_VERIFIED', 'ASSIGNED', 'REVIEWED', 'PAYMENT_DONE'] },
            group: ['job_status'],
            raw: true,
            useReplica: true
        })
    ]);

    const jobsByStatus = allJobsRaw.reduce((acc, j) => {
        acc[j.job_status] = parseInt(j.count, 10);
        return acc;
    }, {});

    const formatJob = (j) => ({
        id: j.id,
        job_request_number: j.job_request_number,
        job_status: j.job_status,
        vessel: j.vessel_id === null || j.vessel_id === undefined
            ? { vessel_name: "Company Wide", imo_number: "N/A" }
            : (j.Vessel ? { vessel_name: j.Vessel.vessel_name, imo_number: j.Vessel.imo_number } : null),
        certificate_type: (j.certificates || []).map(c => c.CertificateType?.name).filter(Boolean).join(', ') || 'N/A',
        created_at: j.createdAt,
        updated_at: j.updatedAt,
        requester: j.requester?.name
    });

        return {
            role: 'TM',
            summary: {
                assignment_needed: jobsByStatus['DOCUMENT_VERIFIED'] || 0,
                authorization_needed: jobsByStatus['ASSIGNED'] || 0,
                finalization_needed: (jobsByStatus['REVIEWED'] || 0) + (jobsByStatus['PAYMENT_DONE'] || 0)
            },
            actionable_items: {
                pending_assignments: pendingAssignmentJobs.map(formatJob),
                pending_authorizations: pendingAuthorizationJobs.map(formatJob),
                pending_finalizations: pendingFinalizationJobs.map(formatJob)
            }
        };
    }, cache.TTL.DASHBOARD);
}

export const getTODashboard = async (user) => {
    return cache.getOrSet('dashboard:to', async () => { // TO view is role-wide
    const jobIncludes = [
        { model: Vessel, attributes: ['vessel_name', 'imo_number'] },
        { model: JobCertificate, as: 'certificates', include: [{ model: CertificateType, attributes: ['name'] }] },
        { model: User, as: 'requester', attributes: ['name', 'email'] }
    ];

    const [
        pendingVerificationJobs,
        pendingReviewJobs,
        reworkJobs,
        openNCs,
        allJobsRaw,
        ncCountsRaw
    ] = await Promise.all([
        JobRequest.findAll({
            where: { job_status: 'CREATED' },
            include: jobIncludes,
            order: [['createdAt', 'DESC']],
            limit: 5,
            useReplica: true
        }),
        JobRequest.findAll({
            where: { job_status: 'SURVEY_DONE' },
            include: jobIncludes,
            order: [['updatedAt', 'DESC']],
            limit: 5,
            useReplica: true
        }),
        JobRequest.findAll({
            where: { job_status: 'REWORK_REQUESTED' },
            include: jobIncludes,
            order: [['updatedAt', 'DESC']],
            limit: 5,
            useReplica: true
        }),
        NonConformity.findAll({
            where: { status: 'OPEN' },
            include: [{ model: JobRequest, attributes: ['id', 'job_status'], include: [{ model: Vessel, attributes: ['vessel_name'] }] }],
            order: [['createdAt', 'DESC']],
            limit: 5,
            useReplica: true
        }),
        JobRequest.findAll({
            attributes: ['job_status', [db.sequelize.fn('COUNT', 'job_status'), 'count']],
            where: { job_status: ['CREATED', 'SURVEY_DONE', 'REWORK_REQUESTED'] },
            group: ['job_status'],
            raw: true,
            useReplica: true
        }),
        NonConformity.count({
            where: { status: 'OPEN' },
            useReplica: true
        })
    ]);

    const jobsByStatus = allJobsRaw.reduce((acc, j) => {
        acc[j.job_status] = parseInt(j.count, 10);
        return acc;
    }, {});

    const formatJob = (j) => ({
        id: j.id,
        job_request_number: j.job_request_number,
        job_status: j.job_status,
        vessel: j.vessel_id === null || j.vessel_id === undefined
            ? { vessel_name: "Company Wide", imo_number: "N/A" }
            : (j.Vessel ? { vessel_name: j.Vessel.vessel_name, imo_number: j.Vessel.imo_number } : null),
        certificate_type: (j.certificates || []).map(c => c.CertificateType?.name).filter(Boolean).join(', ') || 'N/A',
        created_at: j.createdAt,
        updated_at: j.updatedAt,
        requester: j.requester?.name
    });

        return {
            role: 'TO',
            summary: {
                verification_needed: jobsByStatus['CREATED'] || 0,
                review_needed: jobsByStatus['SURVEY_DONE'] || 0,
                rework_requested: jobsByStatus['REWORK_REQUESTED'] || 0,
                open_non_conformities: ncCountsRaw
            },
            actionable_items: {
                pending_verifications: pendingVerificationJobs.map(formatJob),
                pending_reviews: pendingReviewJobs.map(formatJob),
                rework_items: reworkJobs.map(formatJob),
                open_non_conformities: openNCs.map(n => ({
                    id: n.id,
                    job_id: n.job_id,
                    job_request_number: n.JobRequest?.job_request_number,
                    vessel_name: n.JobRequest?.vessel_id === null || n.JobRequest?.vessel_id === undefined ? "Company Wide" : (n.JobRequest?.Vessel?.vessel_name || null),
                    vessel: n.JobRequest?.vessel_id === null || n.JobRequest?.vessel_id === undefined ? "Company Wide" : (n.JobRequest?.Vessel?.vessel_name || null),
                    description: n.description,
                    severity: n.severity,
                    created_at: n.createdAt
                }))
            }
        };
    }, cache.TTL.DASHBOARD);
}

export const getSurveyorDashboard = async (user) => {
    return cache.getOrSet(`dashboard:surveyor:${user.id}`, async () => {
    const jobIncludes = [
        'Vessel',
        {
            model: JobCertificate,
            as: 'certificates',
            include: [
                { model: CertificateType },
                { model: Survey, as: 'survey', attributes: ['survey_status'] }
            ]
        }
    ];

    const certRows = await JobCertificate.findAll({
        where: { assigned_surveyor_id: user.id },
        attributes: ['job_request_id'],
        raw: true,
        useReplica: true
    });
    const certJobIds = [...new Set(certRows.map((r) => r.job_request_id).filter(Boolean))];
    const surveyorFilter = {
        [Op.or]: [
            { assigned_surveyor_id: user.id },
            ...(certJobIds.length ? [{ id: { [Op.in]: certJobIds } }] : []),
        ]
    };

    const [assignedJobs, authorizedJobs, inProgressJobs, reworkJobs, completedJobs, allJobsRaw, allSurveysRaw, openNCsCount, profile] = await Promise.all([
        // Assigned — waiting for authorization, surveyor cannot start yet
        JobRequest.findAll({
            where: { [Op.and]: [surveyorFilter, { job_status: 'ASSIGNED' }] },
            include: jobIncludes,
            order: [['target_date', 'ASC']],
            limit: 5,
            useReplica: true
        }),
        // Authorized — surveyor can start these
        JobRequest.findAll({
            where: { [Op.and]: [surveyorFilter, { job_status: 'SURVEY_AUTHORIZED' }] },
            include: jobIncludes,
            order: [['target_date', 'ASC']],
            limit: 5,
            useReplica: true
        }),
        // In Progress — actively being surveyed
        JobRequest.findAll({
            where: { [Op.and]: [surveyorFilter, { job_status: 'IN_PROGRESS' }] },
            include: jobIncludes,
            order: [['target_date', 'ASC']],
            limit: 5,
            useReplica: true
        }),
        // Action Required — rework requested, needs surveyor's attention
        JobRequest.findAll({
            where: { [Op.and]: [surveyorFilter, { job_status: 'REWORK_REQUESTED' }] },
            include: jobIncludes,
            order: [['updatedAt', 'DESC']],
            limit: 5,
            useReplica: true
        }),
        // Recently Completed — finished jobs
        JobRequest.findAll({
            where: { [Op.and]: [surveyorFilter, { job_status: { [Op.in]: ['SURVEY_DONE', 'REVIEWED', 'FINALIZED', 'PAYMENT_DONE', 'CERTIFIED'] } }] },
            include: jobIncludes,
            order: [['updatedAt', 'DESC']],
            limit: 5,
            useReplica: true
        }),
        // Summary counts (lightweight)
        JobRequest.findAll({
            where: surveyorFilter,
            attributes: ['job_status'],
            raw: true,
            useReplica: true
        }),
        Survey.findAll({
            where: { surveyor_id: user.id },
            attributes: ['survey_status'],
            raw: true,
            useReplica: true
        }),
        NonConformity.count({
            include: [{
                model: JobRequest,
                where: surveyorFilter,
                required: true
            }],
            where: { status: 'OPEN' },
            useReplica: true
        }),
        SurveyorProfile.findOne({ where: { user_id: user.id }, raw: true, useReplica: true }),
    ]);

    const jobsByStatus = allJobsRaw.reduce((acc, j) => {
        const s = j.job_status || 'CREATED';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});

    const surveysByStatus = allSurveysRaw.reduce((acc, s) => {
        const status = s.survey_status || 'NOT_STARTED';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    const formatJob = (j) => {
        const surveys = (j.certificates || []).map(c => c.survey).filter(Boolean);
        let overallSurveyStatus = 'NOT_STARTED';
        if (surveys.length > 0) {
            const statuses = surveys.map(s => s.survey_status);
            if (statuses.includes('REWORK_REQUIRED')) {
                overallSurveyStatus = 'REWORK_REQUIRED';
            } else if (statuses.includes('STARTED')) {
                overallSurveyStatus = 'STARTED';
            } else if (statuses.includes('CHECKLIST_SUBMITTED')) {
                overallSurveyStatus = 'CHECKLIST_SUBMITTED';
            } else if (statuses.includes('PROOF_UPLOADED')) {
                overallSurveyStatus = 'PROOF_UPLOADED';
            } else if (statuses.includes('SUBMITTED')) {
                overallSurveyStatus = 'SUBMITTED';
            } else if (statuses.every(status => status === 'FINALIZED')) {
                overallSurveyStatus = 'FINALIZED';
            } else {
                overallSurveyStatus = statuses.find(s => s !== 'FINALIZED') || 'NOT_STARTED';
            }
        }

        return {
            id: j.id,
            job_request_number: j.job_request_number,
            job_status: j.job_status,
            survey_status: overallSurveyStatus,
            target_date: j.target_date,
            vessel: j.vessel_id === null || j.vessel_id === undefined
                ? { vessel_name: "Company Wide", imo_number: "N/A" }
                : (j.Vessel ? { vessel_name: j.Vessel.vessel_name, imo_number: j.Vessel.imo_number } : null),
            certificate_type: (j.certificates || []).map(c => c.CertificateType?.name).filter(Boolean).join(', ') || 'N/A'
        };
    };

        return {
            role: 'SURVEYOR',
            user: { id: user.id, name: user.name, email: user.email },
            profile: profile || null,
            summary: {
                assigned_jobs_total: allJobsRaw.length,
                jobs_by_status: jobsByStatus,
                surveys_by_status: surveysByStatus,
                completed_surveys: surveysByStatus['FINALIZED'] || 0,
                open_non_conformities: openNCsCount,
                rework_requested: jobsByStatus['REWORK_REQUESTED'] || 0,
                pending_proofs: surveysByStatus['CHECKLIST_SUBMITTED'] || 0
            },
            jobs: {
                assigned: assignedJobs.map(formatJob),
                authorized: authorizedJobs.map(formatJob),
                in_progress: inProgressJobs.map(formatJob),
                action_required: reworkJobs.map(formatJob),
                recently_completed: completedJobs.map(formatJob)
            }
        };
    }, cache.TTL.DASHBOARD);
}

export const getClientDashboard = async (clientId) => {
    if (!clientId) throw { statusCode: 403, message: 'User is not associated with a client' };
    return cache.getOrSet(`dashboard:client:${clientId}`, async () => {

    // 1. Get vessels (sorted by recent)
    const vessels = await Vessel.findAll({ 
        where: { client_id: clientId }, 
        attributes: ['id', 'vessel_name', 'imo_number', 'createdAt'],
        order: [['createdAt', 'DESC']],
        useReplica: true
    });
    const vesselIds = vessels.map(v => v.id);

    if (vesselIds.length === 0) {
        return {
            role: 'CLIENT',
            stats: { total_vessels: 0, active_jobs: 0, expiring_soon: 0, pending_payments: 0 },
            recent_jobs: [],
            expiring_certificates: [],
            recent_vessels: [],
            recent_certificates: [],
            recent_payments: []
        };
    }


    // 2. Parallel fetch jobs, certificates, payments, surveys and NCs
    const [jobs, certificates, payments, surveys, ncs] = await Promise.all([
        JobRequest.findAll({
            where: { [db.Sequelize.Op.or]: [{ vessel_id: vesselIds }, { client_id: clientId }] },
            include: [
                { model: Vessel, attributes: ['vessel_name'] },
                { model: db.Client, as: 'Client', attributes: ['company_name'] },
                { model: JobCertificate, as: 'certificates', include: [{ model: CertificateType, attributes: ['name'] }] },
                { model: User, as: 'surveyor', attributes: ['name', 'email'] }
            ],
            order: [['createdAt', 'DESC']],
            useReplica: true
        }),
        Certificate.findAll({
            where: { [db.Sequelize.Op.or]: [{ vessel_id: vesselIds }, { client_id: clientId }] },
            include: [{ model: Vessel, attributes: ['vessel_name'] }],
            order: [['createdAt', 'DESC']],
            useReplica: true
        }),
        Payment.findAll({
            include: [{
                model: JobRequest,
                where: { [db.Sequelize.Op.or]: [{ vessel_id: vesselIds }, { client_id: clientId }] },
                required: true,
                include: [
                    { model: Vessel, attributes: ['vessel_name'] },
                    { model: db.Client, as: 'Client', attributes: ['company_name'] }
                ]
            }],
            order: [['createdAt', 'DESC']],
            useReplica: true
        }),
        Survey.findAll({
            include: [{
                model: JobCertificate,
                required: true,
                include: [{
                    model: JobRequest,
                    where: { [db.Sequelize.Op.or]: [{ vessel_id: vesselIds }, { client_id: clientId }] },
                    required: true,
                    include: [{ model: Vessel, attributes: ['vessel_name'] }]
                }]
            }, {
                model: User, attributes: ['name', 'email']
            }],
            order: [['updatedAt', 'DESC']],
            useReplica: true
        }),
        NonConformity.findAll({
            include: [{
                model: JobRequest,
                where: { [db.Sequelize.Op.or]: [{ vessel_id: vesselIds }, { client_id: clientId }] },
                required: true,
                include: [{ model: Vessel, attributes: ['vessel_name'] }]
            }],
            order: [['createdAt', 'DESC']],
            useReplica: true
        })
    ]);

    // Calculate statistics
    const jobsByStatus = jobs.reduce((acc, j) => {
        const s = j.job_status || 'CREATED';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});
    const stats = {
        total_vessels: vessels.length,
        active_jobs: jobs.filter(j => !['CERTIFIED', 'REJECTED', 'CANCELLED'].includes(j.job_status)).length,
        jobs_by_status: jobsByStatus,
        expiring_soon: certificates.filter(c => {
            const expiry = new Date(c.expiry_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            expiry.setHours(0, 0, 0, 0);
            const diffTime = expiry - today;
            const daysToExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return daysToExpiry <= 30 && daysToExpiry >= 0;
        }).length,
        pending_payments: payments.filter(p => ['UNPAID', 'PARTIALLY_PAID'].includes(p.payment_status)).length,
        open_non_conformities: ncs.filter(n => n.status === 'OPEN').length
    };

    return {
        role: 'CLIENT',
        stats,
        recent_jobs: jobs.slice(0, 5).map(j => ({
            id: j.id,
            job_request_number: j.job_request_number,
            vessel_name: j.vessel_id === null || j.vessel_id === undefined ? "Company Wide" : (j.Vessel?.vessel_name || null),
            type: (j.certificates || []).map(c => c.CertificateType?.name).filter(Boolean).join(', ') || 'N/A',
            status: j.job_status,
            surveyor: j.surveyor?.name,
            date: j.createdAt
        })),
        recent_vessels: vessels.slice(0, 5).map(v => ({
            id: v.id,
            vessel_name: v.vessel_name,
            imo_number: v.imo_number,
            date_added: v.createdAt
        })),
        recent_certificates: certificates.slice(0, 5).map(c => ({
            id: c.id,
            name: c.certificate_name,
            vessel: c.vessel_id === null || c.vessel_id === undefined ? "Company Wide" : (c.Vessel?.vessel_name || null),
            expiry_date: c.expiry_date,
            issued_date: c.issued_date || c.createdAt
        })),
        recent_surveys: surveys.slice(0, 5).map(s => ({
            id: s.id,
            vessel: (s.JobCertificate?.JobRequest?.vessel_id === null || s.JobCertificate?.JobRequest?.vessel_id === undefined || s.JobRequest?.vessel_id === null || s.JobRequest?.vessel_id === undefined)
                ? "Company Wide"
                : (s.JobCertificate?.JobRequest?.Vessel?.vessel_name ?? s.JobRequest?.Vessel?.vessel_name ?? null),
            surveyor: s.User?.name,
            status: s.survey_status,
            date: s.submitted_at || s.updatedAt
        })),
        recent_payments: payments.slice(0, 5).map(p => ({
            id: p.id,
            invoice_number: p.invoice_number,
            amount: p.amount,
            currency: p.currency,
            status: p.payment_status,
            vessel_name: p.JobRequest?.vessel_id === null || p.JobRequest?.vessel_id === undefined ? "Company Wide" : (p.JobRequest?.Vessel?.vessel_name || null),
            date: p.payment_date || p.createdAt
        })),
        open_non_conformities_list: ncs.filter(n => n.status === 'OPEN').slice(0, 5).map(n => ({
            id: n.id,
            job_id: n.job_id,
            job_request_number: n.JobRequest?.job_request_number,
            vessel_name: n.JobRequest?.vessel_id === null || n.JobRequest?.vessel_id === undefined ? "Company Wide" : (n.JobRequest?.Vessel?.vessel_name || null),
            vessel: n.JobRequest?.vessel_id === null || n.JobRequest?.vessel_id === undefined ? "Company Wide" : (n.JobRequest?.Vessel?.vessel_name || null),
            description: n.description,
            severity: n.severity,
            date: n.createdAt
        })),
        pending_payments: payments.filter(p => ['UNPAID', 'PARTIALLY_PAID'].includes(p.payment_status)).map(p => ({
            id: p.id,
            invoice_number: p.invoice_number,
            amount: p.amount,
            currency: p.currency,
            vessel_name: p.JobRequest?.vessel_id === null || p.JobRequest?.vessel_id === undefined ? "Company Wide" : (p.JobRequest?.Vessel?.vessel_name || null)
        })),
        expiring_certificates: certificates
            .filter(c => {
                const expiry = new Date(c.expiry_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                expiry.setHours(0, 0, 0, 0);
                const diffTime = expiry - today;
                const daysToExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return daysToExpiry <= 30 && daysToExpiry >= 0;
            })
            .slice(0, 5)
            .map(c => ({
                id: c.id,
                name: c.certificate_name,
                vessel: c.vessel_id === null || c.vessel_id === undefined ? "Company Wide" : (c.Vessel?.vessel_name || null),
                expiry_date: c.expiry_date
            }))
    };
    }, cache.TTL.DASHBOARD);
};

export const getDefaultDashboard = async (user) => {
    return {
        role: user.role,
        user: { id: user.id, name: user.name, email: user.email },
        summary: {},
    };
}
