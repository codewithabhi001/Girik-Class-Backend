import db from '../../models/index.js';
import { v4 as uuidv4 } from 'uuid';
import * as s3Service from '../../services/s3.service.js';

const Payment = db.Payment;
const JobRequest = db.JobRequest;
const FinancialLedger = db.FinancialLedger;
const Vessel = db.Vessel;
const JobStatusHistory = db.JobStatusHistory;

export const createInvoice = async (data) => {
    const { job_id, amount, currency } = data;

    const payment = await Payment.create({
        job_id,
        invoice_number: `INV-${uuidv4().substring(0, 8).toUpperCase()}`,
        amount,
        currency: currency || 'USD',
        payment_status: 'UNPAID'
    });

    return payment;
};

export const getPayments = async (query, scopeFilters = {}) => {
    const { page = 1, limit = 10, ...filters } = query;
    const where = { ...filters };

    // If scopeFilters contains job_id from a client's vessels
    // We handle that in the controller by pre-calculating jobIds or using associations

    return await Payment.findAndCountAll({
        where: { ...where, ...scopeFilters },
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

export const markPaid = async (paymentId, userId, receiptFile = null, remarks = '') => {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) throw { statusCode: 404, message: 'Payment record not found' };

    const job = await JobRequest.findByPk(payment.job_id);
    if (!job) throw { statusCode: 404, message: 'Job not found for payment record' };
    if (job.job_status !== 'TM_FINAL') {
        throw { statusCode: 400, message: 'Payment can only be marked done when job is TM_FINAL' };
    }

    let receiptUrl = payment.receipt_url || null;
    if (receiptFile) {
        receiptUrl = await s3Service.uploadFile(
            receiptFile.buffer,
            receiptFile.originalname,
            receiptFile.mimetype,
            `${s3Service.UPLOAD_FOLDERS.DOCUMENTS}/payments`
        );
    }

    await payment.update({
        payment_status: 'PAID',
        payment_date: new Date(),
        verified_by_user_id: userId,
        receipt_url: receiptUrl
    });

    await job.update({ job_status: 'PAYMENT_DONE' });
    await JobStatusHistory.create({
        job_id: job.id,
        old_status: 'TM_FINAL',
        new_status: 'PAYMENT_DONE',
        changed_by: userId,
        change_reason: remarks || 'Payment verified and cleared'
    });

    return payment;
};

export const getLedger = async (paymentId) => {
    return await FinancialLedger.findAll({
        where: { invoice_id: paymentId },
        order: [['createdAt', 'ASC']]
    });
};

export const writeOffPayment = async (paymentId, reason, userId) => {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) throw { statusCode: 404, message: 'Payment not found' };

    await payment.update({ payment_status: 'WRITTEN_OFF' });

    await FinancialLedger.create({
        invoice_id: payment.id,
        job_id: payment.job_id,
        transaction_type: 'WRITEOFF',
        amount: payment.amount,
        performed_by: userId,
        remarks: reason,
        balance_after: 0
    });

    return payment;
};

export const processRefund = async (paymentId, amount, reason, userId) => {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) throw { statusCode: 404, message: 'Payment not found' };

    await FinancialLedger.create({
        invoice_id: payment.id,
        job_id: payment.job_id,
        transaction_type: 'REFUND',
        amount: -Math.abs(amount),
        performed_by: userId,
        remarks: reason
    });

    return { success: true, message: 'Refund processed' };
};

export const recordPartialPayment = async (paymentId, amount, userId) => {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) throw { statusCode: 404, message: 'Payment not found' };

    await FinancialLedger.create({
        invoice_id: payment.id,
        job_id: payment.job_id,
        transaction_type: 'PARTIAL_PAYMENT',
        amount: amount,
        performed_by: userId,
        remarks: 'Partial payment recorded'
    });

    return { success: true, amount_recorded: amount };
};

export const getFinancialSummary = async (scopeFilters = {}) => {
    // This expects scopeFilters to be something like { job_id: [ids...] }
    const payments = await Payment.findAll({ where: scopeFilters });

    const totalInvoiced = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const totalPaid = payments.filter(p => p.payment_status === 'PAID').reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const pendingBalance = totalInvoiced - totalPaid;

    return {
        total_invoiced: totalInvoiced,
        total_paid: totalPaid,
        pending_balance: pendingBalance,
        currency: 'USD'
    };
};
