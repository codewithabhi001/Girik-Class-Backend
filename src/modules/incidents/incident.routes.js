import express from 'express';
import * as incidentController from './incident.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(authenticate);

router.post('/', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM'), incidentController.reportIncident);
router.get('/', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO'), incidentController.getIncidents);
router.get('/:id', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'TM', 'TO'), incidentController.getIncidentById);
router.put('/:id/status', authorizeRoles('ADMIN', 'GM', 'TM'), incidentController.updateStatus);

export default router;
