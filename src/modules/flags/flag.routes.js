import express from 'express';
import * as flagController from './flag.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const router = express.Router();
router.use(authenticate);

router.post('/', hasRole('ADMIN'), validate(schemas.createFlag), flagController.createFlag);
router.get('/', flagController.getFlags);
router.put('/:id', hasRole('ADMIN'), flagController.updateFlag);

export default router;
