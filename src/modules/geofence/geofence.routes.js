import express from 'express';
import * as geofenceController from './geofence.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const router = express.Router();
router.use(authenticate);

router.post('/gps/update', hasRole('SURVEYOR'), validate(schemas.updateGps), geofenceController.updateGps);
router.post('/geofence', hasRole('ADMIN', 'TM'), validate(schemas.setGeoFence), geofenceController.setGeoFence);
router.get('/geofence/:vesselId', hasRole('ADMIN', 'TM'), geofenceController.getGeoFence);

export default router;
