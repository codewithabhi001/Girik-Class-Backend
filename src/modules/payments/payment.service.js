import db from '../../models/index.js';
import { v4 as uuidv4 } from 'uuid';

const Payment = db.Payment;
const JobRequest = db.JobRequest;

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

export const markPaid = async (paymentId, user) => {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) throw { statusCode: 404, message: 'Payment record not found' };

    await payment.update({
        payment_status: 'PAID',
        payment_date: new Date(),
        verified_by_user_id: user.id
    });

    // Update job status
    const job = await JobRequest.findByPk(payment.job_id);
    if (job) {
        await job.update({ job_status: 'PAYMENT_DONE' });
    }


    return payment;
};

// --- Financial Extensions ---

const FinancialLedger = db.FinancialLedger;

export const getLedger = async (paymentId) => {
    // Return all transactions related to this invoice/payment container
    return await FinancialLedger.findAll({ where: { invoice_id: paymentId }, order: [['created_at', 'ASC']] });
};

export const writeOffPayment = async (paymentId, reason, user) => {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) throw { statusCode: 404, message: 'Payment not found' };

    // Transaction logic should be here
    await payment.update({ payment_status: 'WRITTEN_OFF' });

    await FinancialLedger.create({
        invoice_id: payment.id,
        job_id: payment.job_id,
        transaction_type: 'WRITEOFF',
        amount: payment.amount, // Full amount
        performed_by: user.id,
        remarks: reason,
        balance_after: 0
    });

    return payment;
};

