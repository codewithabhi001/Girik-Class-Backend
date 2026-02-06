import express from 'express';
import * as ncController from './nc.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const router = express.Router();
router.use(authenticate);

router.post('/', hasRole('SURVEYOR', 'TO'), validate(schemas.createNC), ncController.createNC);
router.put('/:id/close', hasRole('TO', 'TM'), validate(schemas.closeNC), ncController.closeNC);
router.get('/job/:jobId', ncController.getByJob);

export default router;
