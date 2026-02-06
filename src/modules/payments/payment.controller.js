import * as paymentService from './payment.service.js';

export const createInvoice = async (req, res, next) => {
    try {
        const invoice = await paymentService.createInvoice(req.body);
        res.status(201).json(invoice);
    } catch (error) {
        next(error);
    }
};


export const markPaid = async (req, res, next) => {
    try {
        const payment = await paymentService.markPaid(req.params.id, req.user);
        res.json(payment);
    } catch (error) {
        next(error);
    }
}

export const getLedger = async (req, res, next) => {
    try {
        const ledger = await paymentService.getLedger(req.params.id);
        res.json(ledger);
    } catch (e) { next(e); }
};

export const writeOff = async (req, res, next) => {
    try {
        const result = await paymentService.writeOffPayment(req.body.paymentId, req.body.reason, req.user);
        res.json(result);
    } catch (e) { next(e); }
};

