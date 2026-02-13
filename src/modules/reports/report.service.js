import db from '../../models/index.js';
import { Op } from 'sequelize';

const { Certificate, NonConformity, Payment, SurveyReport, JobRequest } = db;

export const getCertificateReport = async (filters = {}) => {
    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.from_date && filters.to_date) {
        where.issue_date = {
            [Op.between]: [filters.from_date, filters.to_date]
        };
    }

    const certificates = await Certificate.findAll({
        where,
        include: [
            { model: db.Vessel, attributes: ['vessel_name', 'imo_number'] },
            { model: db.CertificateType, attributes: ['name'] },
            { model: db.User, as: 'issuer', attributes: ['name', 'email'] }
        ]
    });

    const stats = {
        total: certificates.length,
        by_status: {},
        by_type: {},
        expiring_soon: 0
    };

    certificates.forEach(cert => {
        stats.by_status[cert.status] = (stats.by_status[cert.status] || 0) + 1;
        const typeName = cert.CertificateType?.name || 'Unknown';
        stats.by_type[typeName] = (stats.by_type[typeName] || 0) + 1;

        const daysToExpiry = Math.floor((new Date(cert.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysToExpiry <= 30 && daysToExpiry >= 0) stats.expiring_soon++;
    });

    return { certificates, stats };
};

export const getSurveyorPerformanceReport = async (filters = {}) => {
    const where = {};
    if (filters.from_date && filters.to_date) {
        where.createdAt = {
            [Op.between]: [filters.from_date, filters.to_date]
        };
    }

    const surveys = await SurveyReport.findAll({
        where,
        include: [
            { model: db.User, attributes: ['id', 'name', 'email'] },
            { model: JobRequest, attributes: ['id', 'job_status'] }
        ]
    });

    const performance = {};
    surveys.forEach(survey => {
        const surveyorId = survey.surveyor_id;
        if (!performance[surveyorId]) {
            performance[surveyorId] = {
                surveyor: survey.User,
                total_surveys: 0,
                avg_completion_time: 0
            };
        }
        performance[surveyorId].total_surveys++;
    });

    return { performance: Object.values(performance) };
};

export const getNonConformityReport = async (filters = {}) => {
    const where = {};
    if (filters.severity) where.severity = filters.severity;
    if (filters.status) where.status = filters.status;

    const ncs = await NonConformity.findAll({
        where,
        include: [{ model: JobRequest, attributes: ['id', 'job_status', 'vessel_id'] }]
    });

    const stats = {
        total: ncs.length,
        by_severity: {},
        by_status: {},
        open_count: 0
    };

    ncs.forEach(nc => {
        stats.by_severity[nc.severity] = (stats.by_severity[nc.severity] || 0) + 1;
        stats.by_status[nc.status] = (stats.by_status[nc.status] || 0) + 1;
        if (nc.status === 'OPEN') stats.open_count++;
    });

    return { non_conformities: ncs, stats };
};

export const getFinancialReport = async (filters = {}) => {
    const where = {};
    if (filters.from_date && filters.to_date) {
        where.payment_date = {
            [Op.between]: [filters.from_date, filters.to_date]
        };
    }

    const payments = await Payment.findAll({
        where,
        include: [{ model: JobRequest, attributes: ['id', 'job_status', 'vessel_id'] }]
    });

    const stats = {
        total_invoiced: 0,
        total_paid: 0,
        total_pending: 0,
        by_status: {}
    };

    payments.forEach(payment => {
        const amount = parseFloat(payment.amount) || 0;
        stats.total_invoiced += amount;

        if (payment.payment_status === 'PAID') {
            stats.total_paid += amount;
        } else {
            stats.total_pending += amount;
        }

        stats.by_status[payment.payment_status] =
            (stats.by_status[payment.payment_status] || 0) + amount;
    });

    return { payments, stats };
};
