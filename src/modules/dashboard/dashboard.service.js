import db from '../../models/index.js';
import { Op } from 'sequelize';

const { User, Client, Vessel, JobRequest, SurveyorProfile, Certificate, FlagAdministration, SurveyReport, CertificateType, Payment } = db;

const userSafeAttrs = ['id', 'name', 'email', 'role', 'phone', 'status', 'client_id', 'last_login_at', 'createdAt'];

export const getAdminDashboard = async () => {
    const [usersByRole, clientsWithVessels, vesselsCount, jobsCount, certificatesCount, surveyorProfiles] = await Promise.all([
        User.findAll({ attributes: ['role'], raw: true }),
        Client.findAll({
            where: { status: 'ACTIVE' },
            include: [{ model: Vessel, as: 'Vessels', required: false, attributes: userSafeAttrs }],
            order: [['company_name', 'ASC']],
        }),
        Vessel.count(),
        JobRequest.count(),
        Certificate.count(),
        SurveyorProfile.count({ where: { status: 'ACTIVE' } }),
    ]);

    const roleCounts = usersByRole.reduce((acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1;
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
            flag: v.flag,
            status: v.status,
        })),
    }));

    const [jobStatusCounts, certStatusCounts] = await Promise.all([
        JobRequest.findAll({ attributes: ['job_status'], raw: true }),
        Certificate.findAll({ attributes: ['status'], raw: true }),
    ]);

    const jobsByStatus = jobStatusCounts.reduce((acc, j) => {
        acc[j.job_status || 'CREATED'] = (acc[j.job_status || 'CREATED'] || 0) + 1;
        return acc;
    }, {});
    const certsByStatus = certStatusCounts.reduce((acc, c) => {
        acc[c.status || 'VALID'] = (acc[c.status || 'VALID'] || 0) + 1;
        return acc;
    }, {});

    return {
        role: 'ADMIN',
        summary: {
            users: {
                total: usersByRole.length,
                by_role: roleCounts,
                admin: roleCounts.ADMIN || 0,
                gm: roleCounts.GM || 0,
                tm: roleCounts.TM || 0,
                to: roleCounts.TO || 0,
                ta: roleCounts.TA || 0,
                surveyors: surveyorProfiles,
                clients: roleCounts.CLIENT || 0,
                flag_admin: roleCounts.FLAG_ADMIN || 0,
            },
            clients: clients.length,
            vessels: vesselsCount,
            jobs: { total: jobsCount, by_status: jobsByStatus },
            certificates: { total: certificatesCount, by_status: certsByStatus },
        },
        client_with_vessels: clients,
    };
}

export const getGMDashboard = async () => {
    const admin = await getAdminDashboard();
    return { ...admin, role: 'GM' };
}

export const getTMDashboard = async () => {
    const admin = await getAdminDashboard();
    return { ...admin, role: 'TM' };
}

export const getTODashboard = async (user) => {
    // user argument kept for potential future filtering logic if needed, although current implementation doesn't strictly depend on user.id heavily for count beyond role logic? 
    // Wait, getTODashboard logic uses JobRequest.count() globally? 
    // "JobRequest.count({ where: { job_status: { [Op.notIn]: ... } } })"
    // It seems global. If TO sees everything, that is fine.
    const [jobsCount, myInvolvedJobs, vesselsCount, clientsCount] = await Promise.all([
        JobRequest.count(),
        JobRequest.count({ where: { job_status: { [Op.notIn]: ['CERTIFIED', 'REJECTED', 'CANCELLED'] } } }),
        Vessel.count(),
        Client.count({ where: { status: 'ACTIVE' } }),
    ]);

    const surveys = await SurveyReport.count();

    return {
        role: 'TO',
        summary: {
            jobs_total: jobsCount,
            jobs_active: myInvolvedJobs,
            vessels: vesselsCount,
            clients: clientsCount,
            survey_reports: surveys,
        },
    };
}

export const getTADashboard = async (user) => {
    const [jobsCount, vesselsCount, clientsCount] = await Promise.all([
        JobRequest.count(),
        Vessel.count(),
        Client.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
        role: 'TA',
        summary: {
            jobs: jobsCount,
            vessels: vesselsCount,
            clients: clientsCount,
        },
    };
}

export const getSurveyorDashboard = async (user) => {
    const [assignedJobsCount, assignedJobs, completedSurveys, profile] = await Promise.all([
        JobRequest.count({ where: { gm_assigned_surveyor_id: user.id } }),
        JobRequest.findAll({
            where: { gm_assigned_surveyor_id: user.id },
            include: ['Vessel', 'CertificateType'],
            order: [['createdAt', 'DESC']],
            limit: 10,
        }),
        SurveyReport.count({ where: { surveyor_id: user.id } }),
        SurveyorProfile.findOne({ where: { user_id: user.id }, raw: true }),
    ]);

    const byStatus = assignedJobs.reduce((acc, j) => {
        acc[j.job_status || 'CREATED'] = (acc[j.job_status || 'CREATED'] || 0) + 1;
        return acc;
    }, {});

    return {
        role: 'SURVEYOR',
        user: { id: user.id, name: user.name, email: user.email },
        profile: profile || null,
        summary: {
            assigned_jobs_total: assignedJobsCount,
            assigned_jobs_by_status: byStatus,
            completed_surveys: completedSurveys,
        },
        recent_assigned_jobs: assignedJobs.map((j) => ({
            id: j.id,
            job_status: j.job_status,
            target_date: j.target_date,
            vessel: j.Vessel ? { vessel_name: j.Vessel.vessel_name, imo_number: j.Vessel.imo_number } : null,
        })),
    };
}

export const getClientDashboard = async (clientId) => {
    if (!clientId) throw { statusCode: 403, message: 'User is not associated with a client' };

    // Get all vessels for this client
    const vessels = await Vessel.findAll({ where: { client_id: clientId } });
    const vesselIds = vessels.map(v => v.id);

    // Get jobs for all vessels of this client
    const jobs = await JobRequest.findAll({
        where: { vessel_id: vesselIds },
        include: [
            { model: Vessel, attributes: ['vessel_name'] },
            { model: CertificateType, attributes: ['name'] }
        ],
        order: [['created_at', 'DESC']]
    });

    // Get certificates for all vessels
    const certificates = await Certificate.findAll({
        where: { vessel_id: vesselIds },
        include: [{ model: Vessel, attributes: ['vessel_name'] }]
    });

    // Get payments for these jobs
    const jobIds = jobs.map(j => j.id);
    const payments = await Payment.findAll({
        where: { job_id: jobIds }
    });

    // Calculate statistics
    const stats = {
        total_vessels: vessels.length,
        active_jobs: jobs.filter(j => !['CERTIFIED', 'REJECTED'].includes(j.job_status)).length,
        expiring_soon: certificates.filter(c => {
            const daysToExpiry = Math.floor((new Date(c.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
            return daysToExpiry <= 60 && daysToExpiry > 0;
        }).length,
        pending_payments: payments.filter(p => p.payment_status === 'UNPAID').length,
    };

    return {
        role: 'CLIENT',
        stats,
        recent_jobs: jobs.slice(0, 5).map(j => ({
            id: j.id,
            vessel_name: j.Vessel?.vessel_name,
            type: j.CertificateType?.name,
            status: j.job_status,
            date: j.created_at
        })),
        expiring_certificates: certificates
            .filter(c => {
                const daysToExpiry = Math.floor((new Date(c.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                return daysToExpiry <= 60 && daysToExpiry > 0;
            })
            .slice(0, 5)
            .map(c => ({
                id: c.id,
                name: c.certificate_name,
                vessel: c.Vessel?.vessel_name,
                expiry_date: c.expiry_date
            }))
    };
};

export const getFlagAdminDashboard = async () => {
    const [flags, flagsActive] = await Promise.all([
        FlagAdministration.count(),
        FlagAdministration.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
        role: 'FLAG_ADMIN',
        summary: {
            flags_total: flags,
            flags_active: flagsActive,
        },
        flags: await FlagAdministration.findAll({
            attributes: ['id', 'flag_name', 'country', 'status'],
            raw: true,
        }),
    };
}

export const getDefaultDashboard = async (user) => {
    return {
        role: user.role,
        user: { id: user.id, name: user.name, email: user.email },
        summary: {},
    };
}
