import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import * as incidentController from './incident.controller.js';

const router = express.Router();
router.use(authenticate);

router.post('/', incidentController.createIncident);
router.get('/', incidentController.getIncidents);
router.put('/:id/resolve', incidentController.resolveIncident);

export default router;

