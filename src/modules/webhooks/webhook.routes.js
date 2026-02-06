import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';

const router = express.Router();

// Public callbacks (secured by signature verification in middleware usually)
router.post('/callbacks/payment', (req, res) => res.json({ status: 'received' }));
router.post('/callbacks/flag', (req, res) => res.json({ status: 'received' }));

// Internal Management
router.use(authenticate);
router.use(hasRole('ADMIN'));

router.post('/register', (req, res) => res.json({ message: 'Webhook Registered' }));
router.post('/trigger', (req, res) => res.json({ message: 'Webhook Triggered' }));

export default router;
