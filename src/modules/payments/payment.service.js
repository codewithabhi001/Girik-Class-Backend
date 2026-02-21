import db from '../../models/index.js';
import { v4 as uuidv4 } from 'uuid';
import * as s3Service from '../../services/s3.service.js';
import * as lifecycleService from '../../services/lifecycle.service.js';
import logger from '../../utils/logger.js';

const Payment = db.Payment;
const JobRequest = db.JobRequest;
const FinancialLedger = db.FinancialLedger;
const Vessel = db.Vessel;
const AuditLog = db.AuditLog;

// ─────────────────────────────────────────────────────────────────────────────
// CREATE INVOICE
// ─────────────────────────────────────────────────────────────────────────────

export const createInvoice = async (data, userId = null) => {
    const { job_id, amount, currency } = data;

    // Job must be FINALIZED before an invoice can be raised
    const job = await JobRequest.findByPk(job_id);
    if (!job) throw { statusCode: 404, message: 'Job not found' };
    if (job.job_status !== 'FINALIZED') {
        throw { statusCode: 400, message: `Invoice can only be created for a FINALIZED job. Current status: ${job.job_status}` };
    }

    // Prevent double-invoice for the same job
    const existing = await Payment.findOne({ where: { job_id, payment_status: ['UNPAID', 'PAID'] } });
    if (existing) {
        throw { statusCode: 409, message: 'An invoice already exists for this job.' };
    }

    const payment = await Payment.create({
        job_id,
        invoice_number: `INV-${uuidv4().substring(0, 8).toUpperCase()}`,
        amount,
        currency: currency || 'USD',
        payment_status: 'UNPAID'
    });

    await AuditLog.create({
        user_id: userId, action: 'CREATE_INVOICE',
        entity_name: 'Payment', entity_id: payment.id,
        old_values: null,
        new_values: { job_id, amount, currency: payment.currency, payment_status: 'UNPAID' }
    });

    logger.info({ entity: 'PAYMENT', event: 'INVOICE_CREATED', jobId: job_id, paymentId: payment.id, triggeredBy: userId });

    return payment;
};

// ─────────────────────────────────────────────────────────────────────────────
// MARK PAID
// ─────────────────────────────────────────────────────────────────────────────

export const markPaid = async (paymentId, userId, receiptFile = null, remarks = '') => {
    const txn = await db.sequelize.transaction();
    try {
        // Lock payment row
        const payment = await Payment.findByPk(paymentId, { transaction: txn, lock: txn.LOCK.UPDATE });
        if (!payment) throw { statusCode: 404, message: 'Payment record not found' };

        // ── Guard 1: Idempotency — cannot mark paid twice ──
        if (payment.payment_status === 'PAID') {
            throw { statusCode: 409, message: 'Payment has already been marked as paid.' };
        }

        // ── Guard 2: Job must be FINALIZED (not PAYMENT_DONE, CERTIFIED, or terminal) ──
        const job = await JobRequest.findByPk(payment.job_id, { transaction: txn, lock: txn.LOCK.UPDATE });
        if (!job) throw { statusCode: 404, message: 'Job not found for this payment' };

        if (lifecycleService.JOB_TERMINAL_STATES.includes(job.job_status)) {
            throw { statusCode: 400, message: `Cannot process payment: Job is in a terminal state (${job.job_status}).` };
        }
        if (job.job_status !== 'FINALIZED') {
            throw { statusCode: 400, message: `Payment can only be marked as paid when job is FINALIZED. Current: ${job.job_status}` };
        }

        // ── Upload receipt (optional) ──
        const oldPaymentStatus = payment.payment_status;
        let receiptUrl = payment.receipt_url || null;
        if (receiptFile) {
            receiptUrl = await s3Service.uploadFile(
                receiptFile.buffer, receiptFile.originalname, receiptFile.mimetype,
                `${s3Service.UPLOAD_FOLDERS.DOCUMENTS}/payments`
            );
        }

        // ── Update payment ──
        await payment.update({
            payment_status: 'PAID',
            payment_date: new Date(),
            verified_by_user_id: userId,
            receipt_url: receiptUrl
        }, { transaction: txn });

        // ── Advance Job to PAYMENT_DONE via lifecycle (history included) ──
        await lifecycleService.updateJobStatus(payment.job_id, 'PAYMENT_DONE', userId,
            remarks || 'Payment verified and cleared', { transaction: txn });

        await AuditLog.create({
            user_id: userId, action: 'MARK_PAYMENT_PAID',
            entity_name: 'Payment', entity_id: payment.id,
            old_values: { payment_status: oldPaymentStatus, receipt_url: payment.receipt_url || null },
            new_values: { payment_status: 'PAID', receipt_url: receiptUrl, verified_by_user_id: userId }
        }, { transaction: txn });

        logger.info({ entity: 'PAYMENT', event: 'MARKED_PAID', jobId: payment.job_id, paymentId, triggeredBy: userId });

        await txn.commit();
        return payment;
    } catch (error) {
        await txn.rollback();
        throw error;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────────────────

export const getPayments = async (query, scopeFilters = {}) => {
    const { page = 1, limit = 10, ...filters } = query;
    const allowedFilters = {};
    const ALLOWED_KEYS = ['payment_status', 'job_id', 'invoice_number'];
    ALLOWED_KEYS.forEach(key => { if (filters[key]) allowedFilters[key] = filters[key]; });

    return await Payment.findAndCountAll({
        where: { ...allowedFilters, ...scopeFilters },
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        include: [{ model: JobRequest, include: [{ model: Vessel, attributes: ['vessel_name'] }] }],
        order: [['payment_date', 'DESC']]
    });
};

export const getPaymentById = async (id, scopeFilters = {}) => {
    const payment = await Payment.findOne({
        where: { id, ...scopeFilters },
        include: [{ model: JobRequest, include: [{ model: Vessel, attributes: ['vessel_name'] }] }]
    });
    if (!payment) throw { statusCode: 404, message: 'Payment record not found' };
    return payment;
};

export const getFinancialSummary = async (scopeFilters = {}) => {
    const payments = await Payment.findAll({ where: scopeFilters });
    const totalInvoiced = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
    const totalPaid = payments.filter(p => p.payment_status === 'PAID').reduce((s, p) => s + parseFloat(p.amount), 0);
    return { total_invoiced: totalInvoiced, total_paid: totalPaid, pending_balance: totalInvoiced - totalPaid, currency: 'USD' };
};

export const getLedger = async (paymentId) =>
    await FinancialLedger.findAll({ where: { invoice_id: paymentId }, order: [['createdAt', 'ASC']] });

// ─────────────────────────────────────────────────────────────────────────────
// LEDGER OPS (non-state-changing)
// ─────────────────────────────────────────────────────────────────────────────

export const writeOffPayment = async (paymentId, reason, userId) => {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) throw { statusCode: 404, message: 'Payment not found' };
    await payment.update({ payment_status: 'WRITTEN_OFF' });
    await FinancialLedger.create({
        invoice_id: paymentId, job_id: payment.job_id,
        transaction_type: 'WRITEOFF', amount: payment.amount,
        performed_by: userId, remarks: reason, balance_after: 0
    });
    return payment;
};

export const processRefund = async (paymentId, amount, reason, userId) => {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) throw { statusCode: 404, message: 'Payment not found' };
    await FinancialLedger.create({
        invoice_id: paymentId, job_id: payment.job_id,
        transaction_type: 'REFUND', amount: -Math.abs(amount),
        performed_by: userId, remarks: reason
    });
    return { success: true, message: 'Refund processed' };
};

export const recordPartialPayment = async (paymentId, amount, userId) => {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) throw { statusCode: 404, message: 'Payment not found' };
    await FinancialLedger.create({
        invoice_id: paymentId, job_id: payment.job_id,
        transaction_type: 'PARTIAL_PAYMENT', amount,
        performed_by: userId, remarks: 'Partial payment recorded'
    });
    return { success: true, amount_recorded: amount };
};
