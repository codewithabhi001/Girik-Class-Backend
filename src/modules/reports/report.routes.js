import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(authenticate);
router.use(hasRole('ADMIN', 'GM', 'TM'));

router.get('/certificates', (req, res) => res.json({ report: 'Cert Stats' }));
router.get('/surveyors', (req, res) => res.json({ report: 'Surveyor Performance' }));
router.get('/non-conformities', (req, res) => res.json({ report: 'NC Trends' }));
router.get('/financials', (req, res) => res.json({ report: 'Financials' }));

export default router;
