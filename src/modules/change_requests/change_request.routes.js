import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(authenticate);

router.post('/', (req, res) => res.json({ message: 'Change Request Created', id: 'CR-123' }));
router.get('/', (req, res) => res.json({ change_requests: [] }));
router.put('/:id/approve', hasRole('ADMIN', 'GM'), (req, res) => res.json({ message: 'Approved' }));

export default router;
