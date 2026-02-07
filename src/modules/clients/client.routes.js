import express from 'express';
import * as clientController from './client.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const router = express.Router();

router.use(authenticate); // Protect all routes

router.post('/', hasRole('ADMIN', 'GM', 'TM'), validate(schemas.createClient), clientController.createClient);
router.get('/', hasRole('ADMIN', 'GM', 'TM', 'TO'), clientController.getClients);
router.get('/:id', hasRole('ADMIN', 'GM', 'TM', 'TO'), clientController.getClientById);
router.put('/:id', hasRole('ADMIN', 'GM', 'TM'), clientController.updateClient);
router.delete('/:id', hasRole('ADMIN'), clientController.deleteClient);

export default router;
