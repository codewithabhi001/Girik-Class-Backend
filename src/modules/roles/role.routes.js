import express from 'express';
import * as roleController from './role.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const router = express.Router();
router.use(authenticate);

router.get('/', hasRole('ADMIN'), roleController.getRoles);
router.post('/', hasRole('ADMIN'), validate(schemas.createRole), roleController.createRole);
router.post('/:id/permissions', hasRole('ADMIN'), validate(schemas.assignPermissions), roleController.assignPermissions);
router.get('/permissions', hasRole('ADMIN'), roleController.getPermissions);

export default router;
