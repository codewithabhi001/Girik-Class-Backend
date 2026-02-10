import express from 'express';
import multer from 'multer';
import * as surveyorController from './surveyor.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// Public application
router.post('/apply',
    upload.fields([{ name: 'cv', maxCount: 1 }, { name: 'id_proof', maxCount: 1 }, { name: 'certificates', maxCount: 5 }]),
    validate(schemas.applySurveyor),
    surveyorController.applySurveyor
);

router.use(authenticate);

// Admin/Management
router.post('/', authorizeRoles('ADMIN', 'TM'), validate(schemas.createUser), surveyorController.createSurveyor);
router.get('/applications', authorizeRoles('ADMIN', 'TM'), surveyorController.getApplications);
router.put('/applications/:id/review', authorizeRoles('TM', 'ADMIN'), validate(schemas.reviewSurveyor), surveyorController.reviewApplication);

// Profile
router.get('/:id/profile', authorizeRoles('ADMIN', 'TM', 'SURVEYOR'), surveyorController.getProfile);
router.put('/:id/profile', authorizeRoles('ADMIN', 'TM'), surveyorController.updateProfile);

// Surveyor self-operations
router.post('/availability', authorizeRoles('SURVEYOR'), surveyorController.updateAvailability);
router.post('/location', authorizeRoles('SURVEYOR'), surveyorController.reportLocation);

// GPS History
router.get('/:id/location-history', authorizeRoles('ADMIN', 'TM'), surveyorController.getGPSHistory);

export default router;
