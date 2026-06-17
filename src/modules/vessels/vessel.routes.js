import express from 'express';
import * as vesselController from './vessel.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const router = express.Router();

router.use(authenticate);

// List all vessels (scoped by client_id for CLIENT)
router.get('/', authorizeRoles('ADMIN', 'GM', 'CLIENT'), vesselController.getVessels);

// Get distinct vessel types (ship_type) — for dropdowns/filters
router.get('/types', authorizeRoles('CLIENT', 'ADMIN', 'GM', 'SURVEYOR'), vesselController.getVesselTypes);

// Get all vessels of a specific client (for management)
router.get('/client/:clientId', authorizeRoles('ADMIN', 'GM'), vesselController.getVesselsByClientId);

// Create a new vessel
router.post('/', authorizeRoles('ADMIN', 'GM'), validate(schemas.createVessel), vesselController.createVessel);

// Lookup vessel details by IMO number from external registry
router.get('/lookup/:imo', authorizeRoles('ADMIN', 'GM'), vesselController.lookupVesselByImo);

// Get specific vessel details
router.get('/:id', authorizeRoles('ADMIN', 'GM', 'SURVEYOR', 'CLIENT'), vesselController.getVesselById);

// Update vessel details
router.put('/:id', authorizeRoles('ADMIN', 'GM'), validate(schemas.updateVessel), vesselController.updateVessel);

export default router;
