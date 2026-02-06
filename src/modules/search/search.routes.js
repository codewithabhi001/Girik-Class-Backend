import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
    // Global search logic
    res.json({ results: [] });
});

router.get('/vessels', (req, res) => {
    // Allow complex filtering
    res.json({ results: [] });
});

router.get('/certificates', (req, res) => {
    res.json({ results: [] });
});

export default router;
