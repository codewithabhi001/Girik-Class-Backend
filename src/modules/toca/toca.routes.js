import express from 'express';
import * as tocaController from './toca.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const router = express.Router();
router.use(authenticate);

router.post('/', authorizeRoles('TM'), validate(schemas.createToca), tocaController.createToca);
router.put('/:id/status', authorizeRoles('TM', 'ADMIN'), validate(schemas.updateToca), tocaController.updateStatus);
router.get('/', authorizeRoles('ADMIN', 'GM', 'TM'), tocaController.getTocas);

export default router;
