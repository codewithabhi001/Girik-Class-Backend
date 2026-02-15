import express from 'express';
import * as supportController from './support.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const router = express.Router();
router.use(authenticate);

router.post('/', validate(schemas.createSupportTicket), supportController.createTicket);
router.get('/', supportController.getTickets);
router.get('/:id', supportController.getTicketById);
router.put('/:id/status', hasRole('ADMIN', 'GM'), validate(schemas.updateSupportTicketStatus), supportController.updateTicketStatus);
router.put('/:id', hasRole('ADMIN', 'GM'), validate(schemas.updateSupportTicketStatus), supportController.updateTicketStatus);

export default router;
