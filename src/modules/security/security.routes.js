import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';
import db from '../../models/index.js';

const LoginAttempt = db.LoginAttempt;
const router = express.Router();
router.use(authenticate);
router.use(hasRole('ADMIN'));

// Security Routes Update
router.get('/rate-limits', (req, res) => res.json({ limits: {} }));
router.put('/rate-limits/:ip', (req, res) => res.json({ message: 'Rate limit updated' }));

import * as securityController from './security.controller.js';

// Session Control
router.get('/sessions', securityController.getSessions);
router.delete('/sessions/others', securityController.revokeOtherSessions);
router.delete('/sessions/:id', securityController.revokeSession);
router.post('/users/:user_id/logout-force', hasRole('ADMIN'), securityController.forceLogout);

// ABAC Policies
router.get('/policies', hasRole('ADMIN'), securityController.getPolicies);
router.post('/policies', hasRole('ADMIN'), securityController.createPolicy);

// Legacy/Monitoring
router.get('/login-attempts', hasRole('ADMIN'), securityController.getLoginAttempts);

router.post('/block-ip', (req, res) => {
    // Implement IP block logic (Redis/DB)
    const { ip } = req.body;
    if (!ip) return res.status(400).json({ message: 'IP is required' });
    // Add IP to block list
    res.json({ message: 'IP Blocked' });
});


export default router;
