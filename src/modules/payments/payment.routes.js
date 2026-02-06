import express from 'express';
import * as paymentController from './payment.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(authenticate);

// Create a new invoice
// Access: ADMIN, GM, TM
router.post('/invoice', hasRole('ADMIN', 'GM', 'TM'), paymentController.createInvoice);

// Mark an invoice as paid
// Access: ADMIN, GM, TM
router.put('/:id/pay', hasRole('ADMIN', 'GM', 'TM'), paymentController.markPaid);

// Financial Compliance

// Get immutable financial ledger history
// Access: ADMIN, GM
router.get('/:id/ledger', hasRole('ADMIN', 'GM'), paymentController.getLedger);

// Write off a bad debt/payment (Strict strict audit)
// Access: ADMIN
router.post('/writeoff', hasRole('ADMIN'), paymentController.writeOff);


export default router;
