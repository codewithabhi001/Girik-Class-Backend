import express from 'express';
import * as publicController from './public.controller.js';

import * as websiteController from '../website/website.controller.js';

const router = express.Router();

router.get('/certificate/verify/:number', publicController.verifyCertificate);
router.get('/vessel/:imo', publicController.verifyVessel);
router.get('/website/videos', websiteController.getVideos);

export default router;
