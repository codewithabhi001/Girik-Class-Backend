import express from 'express';
import * as vesselController from './vessel.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/', hasRole('ADMIN', 'GM', 'TM'), vesselController.createVessel);
router.get('/', hasRole('ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR'), vesselController.getVessels);
router.get('/:id', hasRole('ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR'), vesselController.getVesselById);
router.put('/:id', hasRole('ADMIN', 'GM', 'TM'), vesselController.updateVessel);

export default router;
