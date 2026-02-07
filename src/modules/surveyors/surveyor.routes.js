import express from 'express';
import multer from 'multer';
import * as surveyorController from './surveyor.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.post('/apply',
    upload.fields([{ name: 'cv', maxCount: 1 }, { name: 'id_proof', maxCount: 1 }, { name: 'certificates', maxCount: 5 }]),
    // Manual validation for files or body checks inside controller or validation middleware wrapper
    // validate(schemas.applySurveyor), // Requires body parsing first which multer does.
    // Order: multer -> validate -> controller
    // Note: validate middleware might need adjustment if body fields are inside req.body coming from multer (which they are).
    // validate middleware uses req.body, so it should work after multer.
    validate(schemas.applySurveyor),
    surveyorController.applySurveyor
);

router.use(authenticate);

router.post('/', hasRole('ADMIN', 'TM'), validate(schemas.createUser), surveyorController.createSurveyor);
router.get('/applications', hasRole('ADMIN', 'TM'), surveyorController.getApplications);
router.put('/applications/:id/review', hasRole('TM', 'ADMIN'), validate(schemas.reviewSurveyor), surveyorController.reviewApplication);

router.get('/:id/profile', hasRole('ADMIN', 'TM', 'SURVEYOR'), surveyorController.getProfile);
router.put('/:id/profile', hasRole('ADMIN', 'TM'), surveyorController.updateProfile);

export default router;
