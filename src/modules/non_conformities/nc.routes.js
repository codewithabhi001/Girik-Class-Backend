import express from 'express';
import * as ncController from './nc.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const router = express.Router();
router.use(authenticate);

router.post('/', authorizeRoles('SURVEYOR', 'TO'), validate(schemas.createNC), ncController.createNC);
router.put('/:id/close', authorizeRoles('TO', 'TM'), validate(schemas.closeNC), ncController.closeNC);
router.get('/job/:jobId', authorizeRoles('ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR'), ncController.getByJob);

export default router;
