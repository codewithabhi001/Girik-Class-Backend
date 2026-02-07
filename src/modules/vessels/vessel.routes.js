import express from 'express';
import * as vesselController from './vessel.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';

import { validate, schemas } from '../../middlewares/validate.middleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/', hasRole('ADMIN', 'GM', 'TM'), validate(schemas.createVessel), vesselController.createVessel);
router.get('/', hasRole('ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR', 'CLIENT'), vesselController.getVessels);
router.get('/:id', hasRole('ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR', 'CLIENT'), vesselController.getVesselById);
router.put('/:id', hasRole('ADMIN', 'GM', 'TM'), validate(schemas.updateVessel), vesselController.updateVessel);

export default router;
