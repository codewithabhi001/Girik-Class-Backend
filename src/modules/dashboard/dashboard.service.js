import db from '../../models/index.js';
import { Op } from 'sequelize';
import * as clientPortalService from '../client_portal/client.portal.service.js';

const { User, Client, Vessel, JobRequest, SurveyorProfile, Certificate, Payment, FlagAdministration, SurveyReport } = db;

/** User attributes to expose (no password) */
const userSafeAttrs = ['id', 'name', 'email', 'role', 'phone', 'status', 'client_id', 'last_login_at', 'createdAt'];

/**
 * Get dashboard data based on user role
 */
export const getDashboard = async (user) => {
    switch (user.role) {
        case 'ADMIN':
            return getAdminDashboard();
        case 'GM':
            return getGMDashboard();
        case 'TM':
            return getTMDashboard();
        case 'TO':
            return getTODashboard(user);
        case 'TA':
            return getTADashboard(user);
        case 'SURVEYOR':
            return getSurveyorDashboard(user);
        case 'CLIENT':
            return clientPortalService.getClientDashboard(user.id);
        case 'FLAG_ADMIN':
            return getFlagAdminDashboard();
        default:
            return getDefaultDashboard(user);
    }
};

/** Admin: all users by role, surveyors, clients, vessels, clients with their users */
async function getAdminDashboard() {
    const [usersByRole, clientsWithUsers, vesselsCount, jobsCount, certificatesCount, surveyorProfiles] = await Promise.all([
        User.findAll({
            attributes: ['role'],
            raw: true,
        }),
        Client.findAll({
            where: { status: 'ACTIVE' },
            include: [{
                model: User,
                as: 'Users',
                required: false,
                attributes: userSafeAttrs,
            }],
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

    const clients = clientsWithUsers.map((c) => ({
        id: c.id,
        company_name: c.company_name,
        company_code: c.company_code,
        email: c.email,
        status: c.status,
        users: (c.Users || []).map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            status: u.status,
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
        clients_with_users: clients,
    };
}

/** GM: same structure as admin but can be scoped later if needed */
async function getGMDashboard() {
    const admin = await getAdminDashboard();
    return { ...admin, role: 'GM' };
}

/** TM: same as GM for now */
async function getTMDashboard() {
    const admin = await getAdminDashboard();
    return { ...admin, role: 'TM' };
}

/** TO: jobs they can work on, survey reports, NCs, etc. */
async function getTODashboard(user) {
    const [jobsCount, myInvolvedJobs, vesselsCount, clientsCount] = await Promise.all([
        JobRequest.count(),
        JobRequest.count({
            where: { job_status: { [Op.notIn]: ['CERTIFIED', 'REJECTED', 'CANCELLED'] } },
        }),
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

/** TA: minimal overview */
async function getTADashboard(user) {
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

/** Surveyor: my assigned jobs, my surveys, profile */
async function getSurveyorDashboard(user) {
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

/** Flag admin: flags and minimal stats */
async function getFlagAdminDashboard() {
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

/** Fallback for unknown role */
async function getDefaultDashboard(user) {
    return {
        role: user.role,
        user: { id: user.id, name: user.name, email: user.email },
        summary: {},
    };
}
