import * as paymentService from './payment.service.js';
import db from '../../models/index.js';

const getScopeFilters = async (user) => {
    const scopeFilters = {};
    if (user.role === 'CLIENT') {
        const vessels = await db.Vessel.findAll({ where: { client_id: user.client_id }, attributes: ['id'] });
        const vesselIds = vessels.map(v => v.id);
        const jobs = await db.JobRequest.findAll({ where: { vessel_id: vesselIds }, attributes: ['id'] });
        const jobIds = jobs.map(j => j.id);
        scopeFilters.job_id = jobIds;
    }
    return scopeFilters;
};

export const getPayments = async (req, res, next) => {
    try {
        const scopeFilters = await getScopeFilters(req.user);
        const result = await paymentService.getPayments(req.query, scopeFilters);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const getPaymentById = async (req, res, next) => {
    try {
        const scopeFilters = await getScopeFilters(req.user);
        const payment = await paymentService.getPaymentById(req.params.id, scopeFilters);
        res.json({ success: true, data: payment });
    } catch (e) { next(e); }
};

export const getFinancialSummary = async (req, res, next) => {
    try {
        const scopeFilters = await getScopeFilters(req.user);
        const result = await paymentService.getFinancialSummary(scopeFilters);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const createInvoice = async (req, res, next) => {
    try {
        const invoice = await paymentService.createInvoice(req.body);
        res.status(201).json({ success: true, data: invoice });
    } catch (error) { next(error); }
};

export const markPaid = async (req, res, next) => {
    try {
        const payment = await paymentService.markPaid(req.params.id, req.user.id, req.file, req.body?.remarks);
        res.json({ success: true, data: payment });
    } catch (error) { next(error); }
};

export const getLedger = async (req, res, next) => {
    try {
        const ledger = await paymentService.getLedger(req.params.id);
        res.json({ success: true, data: ledger });
    } catch (e) { next(e); }
};

export const writeOff = async (req, res, next) => {
    try {
        const result = await paymentService.writeOffPayment(req.body.paymentId, req.body.reason, req.user.id);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const refund = async (req, res, next) => {
    try {
        const result = await paymentService.processRefund(req.params.id, req.body.amount, req.body.reason, req.user.id);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const recordPartial = async (req, res, next) => {
    try {
        const result = await paymentService.recordPartialPayment(req.params.id, req.body.amount, req.user.id);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};
