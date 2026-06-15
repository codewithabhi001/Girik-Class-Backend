import db from '../../models/index.js';
import { v4 as uuidv4 } from 'uuid';
import * as s3Service from '../../services/s3.service.js';
import * as lifecycleService from '../../services/lifecycle.service.js';
import * as fileAccessService from '../../services/fileAccess.service.js';
import logger from '../../utils/logger.js';
import { flatPaymentListRow } from '../../utils/listRowFlatten.util.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scales = ['', 'Thousand', 'Million', 'Billion'];

    if (num === 0) return 'Zero US Dollars Only';

    let numStr = num.toString().split('.')[0];
    let n = parseInt(numStr);
    if (isNaN(n)) return '';

    let parts = [];
    let scaleIndex = 0;

    while (n > 0) {
        let chunk = n % 1000;
        if (chunk > 0) {
            let chunkStr = '';
            let hundreds = Math.floor(chunk / 100);
            let remainder = chunk % 100;

            if (hundreds > 0) {
                chunkStr += ones[hundreds] + ' Hundred';
                if (remainder > 0) chunkStr += ' and ';
            }

            if (remainder > 0) {
                if (remainder < 20) {
                    chunkStr += ones[remainder];
                } else {
                    let ten = Math.floor(remainder / 10);
                    let one = remainder % 10;
                    chunkStr += tens[ten];
                    if (one > 0) chunkStr += '-' + ones[one];
                }
            }

            if (scales[scaleIndex]) {
                chunkStr += ' ' + scales[scaleIndex];
            }
            parts.unshift(chunkStr);
        }
        n = Math.floor(n / 1000);
        scaleIndex++;
    }

    return parts.join(', ') + ' US Dollars Only';
};

const Payment = db.Payment;
const JobRequest = db.JobRequest;
const FinancialLedger = db.FinancialLedger;
const Vessel = db.Vessel;
const AuditLog = db.AuditLog;

// Ledger types that count towards "amount collected"
const COLLECTION_TYPES = ['ADVANCE', 'PARTIAL_PAYMENT', 'PAYMENT'];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate total collected and refunded from ledger entries for a payment.
 */
const calculateLedgerTotals = (ledgers) => {
    const collected = ledgers
        .filter(l => COLLECTION_TYPES.includes(l.transaction_type))
        .reduce((sum, l) => sum + parseFloat(l.amount), 0);

    const refunded = ledgers
        .filter(l => l.transaction_type === 'REFUND')
        .reduce((sum, l) => sum + Math.abs(parseFloat(l.amount)), 0);

    return { collected, refunded };
};

/** Latest collection ledger entry date (ADVANCE / PARTIAL_PAYMENT / PAYMENT). */
const getLatestCollectionLedgerDate = (ledgers) => {
    const latest = ledgers
        .filter(l => COLLECTION_TYPES.includes(l.transaction_type))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    return latest?.createdAt ?? null;
};

/**
 * paid_at: full settlement uses payment_date; otherwise latest ledger collection date.
 */
const resolvePaidAt = (paymentStatus, paymentDate, ledgers) => {
    if (paymentStatus === 'PAID') {
        return paymentDate ?? getLatestCollectionLedgerDate(ledgers);
    }
    if (paymentDate) return paymentDate;
    return getLatestCollectionLedgerDate(ledgers);
};

/**
 * Enrich a plain payment object with ledger-derived financial totals.
 * Receipts live on ledger rows only (see formatLedgerRows / GET :id/ledger).
 */
const enrichPaymentWithLedger = (plain, ledgers) => {
    const { collected, refunded } = calculateLedgerTotals(ledgers);

    plain.amount_collected = collected.toFixed(2);
    plain.refunded_amount = refunded > 0 ? refunded.toFixed(2) : "0.00";
    plain.amount_paid = collected.toFixed(2);
    plain.net_amount = (parseFloat(plain.amount) - refunded).toFixed(2);
    plain.remaining = Math.max(0, parseFloat(plain.amount) - collected + refunded).toFixed(2);
    plain.paid_at = resolvePaidAt(plain.payment_status, plain.payment_date, ledgers);

    return plain;
};

const formatLedgerRows = (ledgers) => ledgers.map((l) => {
    const entry = typeof l.get === 'function' ? l.get({ plain: true }) : l;
    return {
        id: entry.id,
        transaction_type: entry.transaction_type,
        amount: entry.amount,
        currency: entry.currency,
        reference_id: entry.reference_id,
        remarks: entry.remarks,
        receipt_url: entry.receipt_url || null,
        balance_after: entry.balance_after,
        performed_by: entry.performed_by,
        created_at: entry.createdAt,
    };
});

// ─────────────────────────────────────────────────────────────────────────────
// CREATE INVOICE
// ─────────────────────────────────────────────────────────────────────────────

export const createInvoice = async (data, userId = null) => {
    const { job_id, amount, currency, reason } = data;

    let job = null;
    if (job_id) {
        // Invoice can be created at any active job stage — only block terminal states
        job = await JobRequest.findByPk(job_id, { useMaster: true });
        if (!job) throw { statusCode: 404, message: 'Job not found' };
        if (job.job_status === 'REJECTED') {
            throw { statusCode: 400, message: `Cannot create invoice: Job is in a rejected state (${job.job_status}).` };
        }

        // Prevent double-invoice for the same job
        const existing = await Payment.findOne({
            where: { job_id, payment_status: ['UNPAID', 'PARTIALLY_PAID', 'PAID'] },
            useMaster: true
        });
        if (existing) {
            throw { statusCode: 409, message: 'An invoice already exists for this job.' };
        }
    } else {
        if (!reason || reason.trim() === '') {
            throw { statusCode: 400, message: 'Billing reason is required for standalone payments.' };
        }
    }

    const payment = await Payment.create({
        job_id: job_id || null,
        invoice_number: `INV-${uuidv4().substring(0, 8).toUpperCase()}`,
        amount,
        currency: currency || 'USD',
        payment_status: 'UNPAID',
        reason: job_id ? null : reason
    });

    await AuditLog.create({
        user_id: userId, action: 'CREATE_INVOICE',
        entity_name: 'Payment', entity_id: payment.id,
        old_values: null,
        new_values: { job_id: job_id || null, amount, currency: payment.currency, payment_status: 'UNPAID', reason: payment.reason || null }
    });

    logger.info({ entity: 'PAYMENT', event: 'INVOICE_CREATED', jobId: job_id || null, paymentId: payment.id, jobStatus: job ? job.job_status : 'STANDALONE', triggeredBy: userId });

    return payment;
};

// ─────────────────────────────────────────────────────────────────────────────
// MARK PAID (Admin override — marks full payment at once)
// ─────────────────────────────────────────────────────────────────────────────

export const markPaid = async (paymentId, userId, receiptFile = null, data = {}) => {
    const remarks = data.remarks || '';
    const txn = await db.sequelize.transaction();
    try {
        // Lock payment row
        const payment = await Payment.findByPk(paymentId, { transaction: txn, lock: txn.LOCK.UPDATE });
        if (!payment) throw { statusCode: 404, message: 'Payment record not found' };

        // ── Guard 1: Idempotency — cannot mark paid twice ──
        if (payment.payment_status === 'PAID') {
            throw { statusCode: 409, message: 'Payment has already been marked as paid.' };
        }

        // ── Guard 2: Verify job exists if it is job-linked ──
        let job = null;
        if (payment.job_id) {
            job = await JobRequest.findByPk(payment.job_id, { transaction: txn, lock: txn.LOCK.UPDATE });
            if (!job) throw { statusCode: 404, message: 'Job not found for this payment' };
        }

        // ── Upload receipt (optional) ──
        const oldPaymentStatus = payment.payment_status;
        let receiptUrl = data.receiptKey || null;
        if (receiptFile) {
            receiptUrl = await s3Service.uploadFile(
                receiptFile.buffer, receiptFile.originalname, receiptFile.mimetype,
                `${s3Service.UPLOAD_FOLDERS.DOCUMENTS}/payments`
            );
        }

        // ── Calculate remaining after previous partial/advance collections ──
        const existingLedgers = await FinancialLedger.findAll({
            where: { invoice_id: paymentId },
            transaction: txn
        });
        const { collected } = calculateLedgerTotals(existingLedgers);
        const remainingAmount = Math.max(0, parseFloat(payment.amount) - collected);

        // ── Log full settlement in ledger ──
        if (remainingAmount > 0) {
            await FinancialLedger.create({
                invoice_id: paymentId, job_id: payment.job_id,
                transaction_type: 'PAYMENT', amount: remainingAmount,
                performed_by: userId, remarks: remarks || 'Full payment / settlement',
                balance_after: 0,
                receipt_url: receiptUrl
            }, { transaction: txn });
        }

        // ── Update payment ──
        await payment.update({
            payment_status: 'PAID',
            payment_date: new Date(),
            verified_by_user_id: userId,
        }, { transaction: txn });

        await AuditLog.create({
            user_id: userId, action: 'MARK_PAYMENT_PAID',
            entity_name: 'Payment', entity_id: payment.id,
            old_values: { payment_status: oldPaymentStatus },
            new_values: { payment_status: 'PAID', ledger_receipt_url: receiptUrl, verified_by_user_id: userId }
        }, { transaction: txn });

        logger.info({ entity: 'PAYMENT', event: 'MARKED_PAID', jobId: payment.job_id, paymentId, triggeredBy: userId });

        await txn.commit();
        const ledgersAfter = await FinancialLedger.findAll({ where: { invoice_id: paymentId }, order: [['createdAt', 'ASC']] });
        const plain = enrichPaymentWithLedger(payment.get({ plain: true }), ledgersAfter);
        plain.ledgers = formatLedgerRows(ledgersAfter);
        return plain;
    } catch (error) {
        await txn.rollback();
        throw error;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────────────────

export const getPayments = async (query, scopeFilters = {}, user = null) => {
    const { page = 1, limit = 10, ...filters } = query;
    const allowedFilters = {};
    const ALLOWED_KEYS = ['payment_status', 'job_id', 'invoice_number', 'vessel_id', 'type'];
    ALLOWED_KEYS.forEach(key => { if (filters[key]) allowedFilters[key] = filters[key]; });

    // Handle type filtering: JOB vs STANDALONE
    if (allowedFilters.type === 'STANDALONE') {
        allowedFilters.job_id = null;
        delete allowedFilters.type;
    } else if (allowedFilters.type === 'JOB') {
        allowedFilters.job_id = { [db.Sequelize.Op.ne]: null };
        delete allowedFilters.type;
    } else {
        delete allowedFilters.type;
    }

    const include = [{
        model: JobRequest,
        required: false, // LEFT JOIN to support null job_id
        attributes: ['id', 'job_request_number', 'job_status', 'vessel_id'],
        include: [{
            model: Vessel,
            required: false,
            attributes: ['vessel_name', 'client_id'],
            include: [{ model: db.Client, as: 'Client', required: false, attributes: ['company_name'] }]
        }]
    }];

    // Filter by vessel via JobRequest join
    if (allowedFilters.vessel_id) {
        include[0] = {
            ...include[0],
            where: { vessel_id: allowedFilters.vessel_id },
            required: true // Force INNER JOIN if filtering by vessel
        };
        delete allowedFilters.vessel_id;
    }

    const result = await Payment.findAndCountAll({
        where: { ...allowedFilters, ...scopeFilters },
        attributes: [
            'id',
            'job_id',
            'invoice_number',
            'amount',
            'currency',
            'payment_status',
            'payment_date',
            'created_at',
            'reason',
        ],
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        include,
        order: [['created_at', 'DESC']],
        useReplica: true
    });

    const paymentIds = result.rows.map(r => r.id);
    const ledgers = paymentIds.length > 0 ? await FinancialLedger.findAll({ where: { invoice_id: paymentIds }, useReplica: true }) : [];

    const enrichedRows = result.rows.map(row => {
        const plain = row.get({ plain: true });
        const pLedgers = ledgers.filter(l => l.invoice_id === plain.id);
        return enrichPaymentWithLedger(plain, pLedgers);
    });

    const resolvedRows = await fileAccessService.resolveEntity(enrichedRows, user);
    return { count: result.count, rows: resolvedRows.map(flatPaymentListRow) };
};

export const getPaymentById = async (id, scopeFilters = {}, user = null) => {
    const payment = await Payment.findOne({
        where: { id, ...scopeFilters },
        include: [{
            model: JobRequest,
            required: false,
            attributes: ['id', 'job_request_number', 'job_status'],
            include: [
                { model: Vessel, attributes: ['vessel_name', 'imo_number'] },
                {
                    model: db.JobCertificate,
                    as: 'certificates',
                    attributes: ['id', 'status'],
                    include: [{ model: db.CertificateType, attributes: ['name'] }]
                }
            ],
        }],
    });
    if (!payment) throw { statusCode: 404, message: 'Payment record not found' };

    const plain = payment.get({ plain: true });
    const ledgers = await FinancialLedger.findAll({ where: { invoice_id: id }, order: [['createdAt', 'ASC']] });

    const enriched = enrichPaymentWithLedger(plain, ledgers);
    enriched.job_request_number = plain.JobRequest?.job_request_number ?? null;
    enriched.vessel_name = plain.JobRequest?.Vessel?.vessel_name ?? null;
    enriched.imo_number = plain.JobRequest?.Vessel?.imo_number ?? null;
    enriched.job_status = plain.JobRequest?.job_status ?? null;
    enriched.reason = plain.reason ?? null;
    enriched.certificates = plain.JobRequest?.certificates || [];

    let parsedReason = null;
    try {
        if (plain.reason && plain.reason.trim().startsWith('{')) {
            parsedReason = JSON.parse(plain.reason);
        }
    } catch (e) {}
    enriched.parsed_reason = parsedReason;

    delete enriched.JobRequest;
    enriched.ledgers = formatLedgerRows(ledgers);

    return await fileAccessService.resolveEntity(enriched, user);
};

export const getPaymentByJobId = async (jobId, scopeFilters = {}, user = null) => {
    const payment = await Payment.findOne({
        where: { job_id: jobId, ...scopeFilters },
        include: [{
            model: JobRequest,
            required: false,
            attributes: ['id', 'job_request_number', 'job_status'],
            include: [
                { model: Vessel, attributes: ['vessel_name', 'imo_number'] },
                {
                    model: db.JobCertificate,
                    as: 'certificates',
                    attributes: ['id', 'status'],
                    include: [{ model: db.CertificateType, attributes: ['name'] }]
                }
            ],
        }],
    });
    if (!payment) throw { statusCode: 404, message: 'Payment record not found for this job.' };

    const plain = payment.get({ plain: true });
    const ledgers = await FinancialLedger.findAll({ where: { invoice_id: plain.id }, order: [['createdAt', 'ASC']] });

    const enriched = enrichPaymentWithLedger(plain, ledgers);
    enriched.job_request_number = plain.JobRequest?.job_request_number ?? null;
    enriched.vessel_name = plain.JobRequest?.Vessel?.vessel_name ?? null;
    enriched.imo_number = plain.JobRequest?.Vessel?.imo_number ?? null;
    enriched.job_status = plain.JobRequest?.job_status ?? null;
    enriched.reason = plain.reason ?? null;
    enriched.certificates = plain.JobRequest?.certificates || [];

    let parsedReason = null;
    try {
        if (plain.reason && plain.reason.trim().startsWith('{')) {
            parsedReason = JSON.parse(plain.reason);
        }
    } catch (e) {}
    enriched.parsed_reason = parsedReason;

    delete enriched.JobRequest;
    enriched.ledgers = formatLedgerRows(ledgers);

    return await fileAccessService.resolveEntity(enriched, user);
};

export const generateInvoicePdf = async (paymentId) => {
    // 1. Fetch payment with JobRequest, Vessel, Client, and Certificates
    const payment = await Payment.findByPk(paymentId, {
        include: [{
            model: JobRequest,
            required: false,
            include: [
                {
                    model: Vessel,
                    include: [{ model: db.Client, as: 'Client' }]
                },
                {
                    model: db.JobCertificate,
                    as: 'certificates',
                    include: [{ model: db.CertificateType }]
                }
            ]
        }]
    });

    if (!payment) throw { statusCode: 404, message: 'Payment not found' };

    // 2. Read template file
    const templatePath = path.join(__dirname, 'invoice_template.html');
    let html = await fs.readFile(templatePath, 'utf8');

    // 3. Prepare replacements
    let billingToName = 'Standalone Billing';
    let billingToAddress = 'General System Record';
    let clientCompany = 'VSV MARINE MANAGEMENT'; // Default client company
    let subject = 'General Maritime Charges';
    let vesselName = 'N/A';
    let imoNumber = 'N/A';
    let itemRows = '';

    let parsedReason = null;
    try {
        if (payment.reason && payment.reason.trim().startsWith('{')) {
            parsedReason = JSON.parse(payment.reason);
        }
    } catch (e) {}

    if (payment.JobRequest) {
        const vessel = payment.JobRequest.Vessel;
        const client = vessel?.Client;

        if (client) {
            billingToName = client.company_name || 'N/A';
            billingToAddress = `${client.address || ''} ${client.city || ''} ${client.country || ''}`.trim() || 'N/A';
            clientCompany = client.company_name || 'VSV MARINE MANAGEMENT';
        }
        
        subject = `Flag Change & Class change (OMCS to GR Class)`;
        vesselName = vessel?.vessel_name || 'N/A';
        imoNumber = vessel?.imo_number || 'N/A';

        // Build item rows for job certificates
        const certs = payment.JobRequest.certificates || [];
        if (certs.length > 0) {
            const count = certs.length;
            const unitPrice = (parseFloat(payment.amount) / count).toFixed(2);
            certs.forEach((cert, index) => {
                const certName = cert.CertificateType?.name || 'Certificate';
                itemRows += `
                <tr>
                  <td class="idx">${index + 1}</td>
                  <td>
                    Statutory inspection and certification for: <strong>${certName}</strong> under job <strong>${payment.JobRequest.job_request_number}</strong>
                  </td>
                  <td class="num">${Number(unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td class="num">${Number(unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>`;
            });
        } else {
            itemRows += `
            <tr>
              <td class="idx">1</td>
              <td>
                Statutory marine classification and certification services for job <strong>${payment.JobRequest.job_request_number}</strong>
              </td>
              <td class="num">${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              <td class="num">${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            </tr>`;
        }
    } else {
        // Standalone invoice
        if (parsedReason) {
            billingToName = parsedReason.client_name || 'N/A';
            billingToAddress = parsedReason.client_address || 'General System Record';
            clientCompany = parsedReason.client_name || 'VSV MARINE MANAGEMENT';
            subject = parsedReason.subject || 'General Maritime Charges';
            vesselName = parsedReason.vessel_name || 'N/A';
            imoNumber = parsedReason.imo_number || 'N/A';

            // Build item rows for standalone custom items
            const items = parsedReason.items || [];
            if (items.length > 0) {
                items.forEach((item, index) => {
                    const itemDesc = item.description || 'General maritime services';
                    const itemAmt = parseFloat(item.amount || 0);
                    itemRows += `
                    <tr>
                      <td class="idx">${index + 1}</td>
                      <td>
                        ${itemDesc}
                      </td>
                      <td class="num">${Number(itemAmt).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td class="num">${Number(itemAmt).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    </tr>`;
                });
            } else {
                itemRows += `
                <tr>
                  <td class="idx">1</td>
                  <td>
                    ${subject}
                  </td>
                  <td class="num">${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td class="num">${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>`;
            }
        } else {
            subject = payment.reason || 'General Maritime Services';
            itemRows += `
            <tr>
              <td class="idx">1</td>
              <td>
                Standalone billing services: <strong>${payment.reason || 'General services rendered'}</strong>
              </td>
              <td class="num">${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              <td class="num">${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            </tr>`;
        }
    }

    const subTotal = Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 });
    const vat = 'Nil';
    const totalUsd = Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 });
    
    // Calculate approximate EUR (~0.93 rate)
    const totalEurVal = (parseFloat(payment.amount) * 0.933).toFixed(2);
    const totalEur = `~${Number(totalEurVal).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    const sayAmount = numberToWords(parseFloat(payment.amount));

    // Format date: e.g. 15 June 2026
    const createdDate = new Date(payment.createdAt || new Date());
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const invoiceDate = createdDate.toLocaleDateString('en-US', options);

    // Dynamic bank details
    const replacements = {
        invoice_number: payment.invoice_number,
        invoice_date: invoiceDate,
        currency: payment.currency || 'USD',
        billing_to_name: billingToName,
        billing_to_address: billingToAddress,
        subject,
        vessel_name: vesselName,
        imo_number: imoNumber,
        item_rows: itemRows,
        sub_total: subTotal,
        vat,
        total_usd: totalUsd,
        total_eur: totalEur,
        say_amount: sayAmount,
        client_company: clientCompany,
        bank_name: 'STATE BANK OF INDIA',
        bank_branch: 'Vasai Road Branch',
        bank_swift: 'SBININBBXXX',
        iban_usd: 'IN12SBIN00001234567890',
        iban_eur: 'IN12SBIN00009876543210',
    };

    // Replace placeholders in HTML template
    for (const [key, value] of Object.entries(replacements)) {
        const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}|\\{\\s*${key}\\s*\\}`, 'g');
        html = html.replace(placeholder, String(value ?? ''));
    }

    // 4. Generate PDF buffer using htmlToPdfBuffer
    const { htmlToPdfBuffer } = await import('../../services/certificate-pdf.service.js');
    const pdfBuffer = await htmlToPdfBuffer(html);
    return pdfBuffer;
};



export const getFinancialSummary = async (scopeFilters = {}) => {
    const payments = await Payment.findAll({ where: scopeFilters, useReplica: true });
    const paymentIds = payments.map(p => p.id);

    // Use ledger as source of truth for actual collections
    const ledgers = paymentIds.length > 0 ? await FinancialLedger.findAll({ where: { invoice_id: paymentIds }, useReplica: true }) : [];

    const totalInvoiced = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
    const totalCollected = ledgers
        .filter(l => COLLECTION_TYPES.includes(l.transaction_type))
        .reduce((s, l) => s + parseFloat(l.amount), 0);
    const totalRefunded = ledgers
        .filter(l => l.transaction_type === 'REFUND')
        .reduce((s, l) => s + Math.abs(parseFloat(l.amount)), 0);

    return {
        total_invoiced: totalInvoiced,
        total_collected: totalCollected,
        total_refunded: totalRefunded,
        total_paid: totalCollected - totalRefunded,
        pending_balance: totalInvoiced - totalCollected + totalRefunded,
        currency: 'USD'
    };
};

export const getLedger = async (paymentId) => {
    const ledgers = await FinancialLedger.findAll({ where: { invoice_id: paymentId }, order: [['createdAt', 'ASC']], useReplica: true });
    return formatLedgerRows(ledgers);
};

// ─────────────────────────────────────────────────────────────────────────────
// COLLECT PAYMENT (Advance / Partial — each becomes a ledger entry)
// ─────────────────────────────────────────────────────────────────────────────

export const recordPartialPayment = async (paymentId, amount, userId, data = {}) => {
    const txn = await db.sequelize.transaction();
    try {
        const payment = await Payment.findByPk(paymentId, { transaction: txn, lock: txn.LOCK.UPDATE });
        if (!payment) throw { statusCode: 404, message: 'Payment not found' };

        if (payment.payment_status === 'PAID') {
            throw { statusCode: 409, message: 'Invoice is already fully paid.' };
        }

        const payingNow = parseFloat(amount);
        if (payingNow <= 0) throw { statusCode: 400, message: 'Payment amount must be greater than 0.' };

        // Determine transaction type: ADVANCE or PARTIAL_PAYMENT
        const transactionType = (data.type === 'ADVANCE') ? 'ADVANCE' : 'PARTIAL_PAYMENT';
        const remarks = data.remarks || (transactionType === 'ADVANCE' ? 'Advance payment collected' : 'Partial payment recorded');

        // Calculate total collected so far
        const existingLedgers = await FinancialLedger.findAll({
            where: { invoice_id: paymentId },
            transaction: txn
        });
        const { collected: previouslyCollected } = calculateLedgerTotals(existingLedgers);

        // Create ledger entry
        const totalAfterThis = previouslyCollected + payingNow;
        const remainingAfterThis = Math.max(0, parseFloat(payment.amount) - totalAfterThis);

        await FinancialLedger.create({
            invoice_id: paymentId, job_id: payment.job_id,
            transaction_type: transactionType, amount: payingNow,
            performed_by: userId, remarks,
            receipt_url: data.receiptKey || null,
            balance_after: remainingAfterThis
        }, { transaction: txn });

        // Update payment status based on total collected
        const updatedFields = {};
        if (remainingAfterThis <= 0 && payment.payment_status !== 'PAID') {
            updatedFields.payment_status = 'PAID';
            updatedFields.payment_date = new Date();
            updatedFields.verified_by_user_id = userId;
        } else if (totalAfterThis > 0 && payment.payment_status === 'UNPAID') {
            updatedFields.payment_status = 'PARTIALLY_PAID';
        }
        await payment.update(updatedFields, { transaction: txn });

        logger.info({
            entity: 'PAYMENT', event: transactionType,
            jobId: payment.job_id, paymentId,
            amount: payingNow, totalCollected: totalAfterThis,
            remaining: remainingAfterThis,
            receipt: data.receiptKey ? 'attached' : 'none',
            triggeredBy: userId
        });

        await txn.commit();
        return { id: payment.id, amount_paid: totalAfterThis.toFixed(2), remaining: remainingAfterThis.toFixed(2), payment_status: payment.payment_status };
    } catch (e) {
        await txn.rollback();
        throw e;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// LEDGER OPS (non-state-changing)
// ─────────────────────────────────────────────────────────────────────────────

export const writeOffPayment = async (paymentId, reason, userId) => {
    const txn = await db.sequelize.transaction();
    try {
        const payment = await Payment.findByPk(paymentId, { transaction: txn, lock: txn.LOCK.UPDATE });
        if (!payment) throw { statusCode: 404, message: 'Payment not found' };
        await payment.update({ payment_status: 'ON_HOLD' }, { transaction: txn });
        await FinancialLedger.create({
            invoice_id: paymentId, job_id: payment.job_id,
            transaction_type: 'WRITEOFF', amount: payment.amount,
            performed_by: userId, remarks: reason, balance_after: 0
        }, { transaction: txn });
        await txn.commit();
        return payment;
    } catch (e) {
        await txn.rollback();
        throw e;
    }
};

export const processRefund = async (paymentId, amount, reason, userId) => {
    const txn = await db.sequelize.transaction();
    try {
        const payment = await Payment.findByPk(paymentId, { transaction: txn, lock: txn.LOCK.UPDATE });
        if (!payment) throw { statusCode: 404, message: 'Payment not found' };

        const refundAmount = Math.abs(parseFloat(amount)).toFixed(2);

        await FinancialLedger.create({
            invoice_id: paymentId, job_id: payment.job_id,
            transaction_type: 'REFUND', amount: -refundAmount,
            performed_by: userId, remarks: reason, balance_after: 0
        }, { transaction: txn });

        await txn.commit();
        return { id: payment.id, refunded_amount: refundAmount };
    } catch (e) {
        await txn.rollback();
        throw e;
    }
};
