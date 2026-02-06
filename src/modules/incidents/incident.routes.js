import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = express.Router();
router.use(authenticate);

router.post('/', (req, res) => res.json({ message: 'Incident Reported', id: 'INC-999' }));
router.get('/', (req, res) => res.json({ incidents: [] }));
router.put('/:id/resolve', (req, res) => res.json({ message: 'Incident Resolved' }));

export default router;
