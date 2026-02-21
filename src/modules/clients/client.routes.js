import express from 'express';
import * as clientController from './client.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const router = express.Router();

router.use(authenticate);

// Profile
router.get('/profile', authorizeRoles('CLIENT'), clientController.getProfile);
router.put('/profile', authorizeRoles('CLIENT'), clientController.updateProfile);
router.get('/profile/documents', authorizeRoles('CLIENT'), clientController.getClientDocuments);

// Dashboard
router.get('/dashboard', authorizeRoles('CLIENT'), clientController.getDashboard);

// Management (Admin/Staff)
router.post('/', authorizeRoles('ADMIN', 'GM', 'TM'), validate(schemas.createClient), clientController.createClient);
router.get('/', authorizeRoles('ADMIN', 'GM', 'TM', 'TO'), clientController.getClients);
router.get('/:id', authorizeRoles('ADMIN', 'GM', 'TM', 'TO'), clientController.getClientById);
router.get('/:id/documents', authorizeRoles('ADMIN', 'GM', 'TM', 'TO'), clientController.getClientDocuments);
router.put('/:id', authorizeRoles('ADMIN', 'GM', 'TM'), clientController.updateClient);
router.delete('/:id', authorizeRoles('ADMIN'), clientController.deleteClient);

export default router;
