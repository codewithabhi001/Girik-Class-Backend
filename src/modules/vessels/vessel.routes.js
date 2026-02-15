import express from 'express';
import * as vesselController from './vessel.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const router = express.Router();

router.use(authenticate);

// List all vessels (scoped by client_id for CLIENT)
router.get('/', authorizeRoles('ADMIN', 'GM', 'TM', 'TO', 'CLIENT'), vesselController.getVessels);

// Get all vessels of a specific client (for management)
router.get('/client/:clientId', authorizeRoles('ADMIN', 'GM', 'TM'), vesselController.getVesselsByClientId);

// Create a new vessel
router.post('/', authorizeRoles('ADMIN', 'GM', 'TM'), validate(schemas.createVessel), vesselController.createVessel);

// Get specific vessel details
router.get('/:id', authorizeRoles('ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR', 'CLIENT'), vesselController.getVesselById);

// Update vessel details
router.put('/:id', authorizeRoles('ADMIN', 'GM', 'TM'), validate(schemas.updateVessel), vesselController.updateVessel);

export default router;
