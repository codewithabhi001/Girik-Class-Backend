import express from 'express';
import * as flagController from './flag.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const router = express.Router();
router.use(authenticate);

router.post('/', authorizeRoles('ADMIN'), validate(schemas.createFlag), flagController.createFlag);
router.get('/', authorizeRoles('ADMIN', 'GM', 'TM', 'To'), flagController.getFlags);
router.put('/:id', authorizeRoles('ADMIN'), flagController.updateFlag);

export default router;
