import express from 'express';

import { authenticate } from '../../middlewares/auth.middleware.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';

import db from '../../models/index.js';

const NotificationPreference = db.NotificationPreference;

const router = express.Router();
router.use(authenticate);

router.get('/preferences', async (req, res, next) => {
    try {
        let prefs = await NotificationPreference.findOne({ where: { user_id: req.user.id } });
        if (!prefs) {
            // Default response if not set
            return res.json({ email_enabled: true, app_enabled: true, alert_types: [] });
        }
        res.json(prefs);
    } catch (e) { next(e); }
});

router.put('/preferences', validate(schemas.updateNotifPrefs), async (req, res, next) => {
    try {
        const [prefs, created] = await NotificationPreference.findOrCreate({
            where: { user_id: req.user.id },
            defaults: req.body
        });

        if (!created) {
            await prefs.update(req.body);
        }
        res.json(prefs);
    } catch (e) { next(e); }
});

router.get('/rules', hasRole('ADMIN'), (req, res) => res.json({ rules: [] }));
router.post('/rules', hasRole('ADMIN'), (req, res) => res.json({ message: 'Rule Created' }));

export default router;
