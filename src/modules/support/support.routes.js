import express from 'express';
import * as supportController from './support.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(authenticate);

router.post('/', supportController.createTicket);
router.get('/', supportController.getTickets);
router.get('/:id', supportController.getTicketById);
router.put('/:id/status', hasRole('ADMIN', 'GM'), supportController.updateTicketStatus);

export default router;
