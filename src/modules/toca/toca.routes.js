import express from 'express';
import * as tocaController from './toca.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const router = express.Router();
router.use(authenticate);

router.post('/', hasRole('TM'), validate(schemas.createToca), tocaController.createToca);
router.put('/:id/status', hasRole('TM', 'ADMIN'), validate(schemas.updateToca), tocaController.updateStatus);
router.get('/', tocaController.getTocas);

export default router;
