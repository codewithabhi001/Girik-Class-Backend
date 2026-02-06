import express from 'express';
import * as publicController from './public.controller.js';

const router = express.Router();

router.get('/certificate/verify/:number', publicController.verifyCertificate);
router.get('/vessel/:imo', publicController.verifyVessel);

export default router;
