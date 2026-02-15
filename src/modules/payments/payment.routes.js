import express from 'express';
import multer from 'multer';
import * as paymentController from './payment.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

// List payments
router.get('/', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM'), paymentController.getPayments);

// Financial Summary
router.get('/summary', authorizeRoles('CLIENT', 'ADMIN', 'GM'), paymentController.getFinancialSummary);

// Get specific payment details
router.get('/:id', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM'), paymentController.getPaymentById);

// Create a new invoice
router.post('/invoice', authorizeRoles('ADMIN', 'GM', 'TM'), paymentController.createInvoice);

// Mark an invoice as paid
router.put('/:id/pay', authorizeRoles('ADMIN', 'GM', 'TM', 'TA'), upload.single('receipt'), paymentController.markPaid);

// Process Refund
router.post('/:id/refund', authorizeRoles('ADMIN', 'GM'), paymentController.refund);

// Record Partial Payment
router.post('/:id/partial', authorizeRoles('ADMIN', 'GM', 'TM'), paymentController.recordPartial);

// Financial Compliance / Ledger
router.get('/:id/ledger', authorizeRoles('ADMIN', 'GM'), paymentController.getLedger);

// Write off
router.post('/writeoff', authorizeRoles('ADMIN'), paymentController.writeOff);

export default router;
