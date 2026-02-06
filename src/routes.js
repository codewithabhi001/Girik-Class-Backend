import express from 'express';
import authRoutes from './modules/auth/auth.routes.js';
import clientRoutes from './modules/clients/client.routes.js';
import vesselRoutes from './modules/vessels/vessel.routes.js';
import jobRoutes from './modules/jobs/job.routes.js';
import surveyRoutes from './modules/surveys/survey.routes.js';
import certificateRoutes from './modules/certificates/certificate.routes.js';
import paymentRoutes from './modules/payments/payment.routes.js';
import surveyorRoutes from './modules/surveyors/surveyor.routes.js';
import geofenceRoutes from './modules/geofence/geofence.routes.js';
import checklistRoutes from './modules/checklists/checklist.routes.js';
import ncRoutes from './modules/non_conformities/nc.routes.js';
import tocaRoutes from './modules/toca/toca.routes.js';
import flagRoutes from './modules/flags/flag.routes.js';
import approvalRoutes from './modules/approvals/approval.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';

import userRoutes from './modules/users/user.routes.js';
import roleRoutes from './modules/roles/role.routes.js';
import docRoutes from './modules/documents/document.routes.js';
import publicRoutes from './modules/public/public.routes.js';
import clientPortalRoutes from './modules/client_portal/client.portal.routes.js';
import systemRoutes from './modules/system/system.routes.js';
import securityRoutes from './modules/security/security.routes.js';
import reportRoutes from './modules/reports/report.routes.js';

import { auditLogger } from './middlewares/audit.middleware.js';

const router = express.Router();
router.use(auditLogger);

router.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Public
router.use('/public', publicRoutes);

router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/vessels', vesselRoutes);
router.use('/jobs', jobRoutes);
router.use('/surveys', surveyRoutes);
router.use('/certificates', certificateRoutes);
router.use('/payments', paymentRoutes);
router.use('/surveyors', surveyorRoutes);
router.use('/geofence', geofenceRoutes);
router.use('/', checklistRoutes); // checklistRoutes mounts on /jobs/:jobId/checklist
router.use('/non-conformities', ncRoutes);
router.use('/toca', tocaRoutes);
router.use('/flags', flagRoutes);
router.use('/approvals', approvalRoutes);
router.use('/audit', auditRoutes);
router.use('/notifications', notificationRoutes);

import evidenceRoutes from './modules/evidence/evidence.routes.js';
import mobileRoutes from './modules/mobile/mobile.routes.js';

// ... imports

import eventRoutes from './modules/events/event.routes.js';
import slaRoutes from './modules/sla/sla.routes.js';
import bulkRoutes from './modules/bulk/bulk.routes.js';
import searchRoutes from './modules/search/search.routes.js';
import webhookRoutes from './modules/webhooks/webhook.routes.js';
import complianceRoutes from './modules/compliance/compliance.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';

// ... imports

// New Modules
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/documents', docRoutes);
router.use('/evidence', evidenceRoutes);
router.use('/mobile', mobileRoutes);
router.use('/client', clientPortalRoutes);
router.use('/system', systemRoutes);
router.use('/security', securityRoutes);
router.use('/reports', reportRoutes);

import changeRequestRoutes from './modules/change_requests/change_request.routes.js';
import templateRoutes from './modules/templates/template.routes.js';
import incidentRoutes from './modules/incidents/incident.routes.js';

// ... imports

// New Modules
router.use('/change-requests', changeRequestRoutes);
router.use('/certificate-templates', templateRoutes);
router.use('/incidents', incidentRoutes);

// Additional Enterprise Modules
router.use('/events', eventRoutes);
router.use('/sla', slaRoutes);
router.use('/bulk', bulkRoutes);
router.use('/search', searchRoutes);
router.use('/webhooks', webhookRoutes); // Internal management
router.use('/callbacks', webhookRoutes); // Public callbacks (shared router but path differs internally handle?) 
// Actually webhook.routes.js separates them? 
// No, I combined them. Let's split or just mount at /webhooks and /callbacks if needed.
// My webhook.routes handles /callbacks/payment separately?
// Ideally mount webhookRoutes to / to handle raw paths or split.
// Let's mount 'webhookRoutes' at '/' and it has subpaths.
// Wait, I defined `router.post('/callbacks/payment')` inside webhook.routes.js which uses `router`.
// So if I mount at `/` it works.
router.use('/', webhookRoutes);

router.use('/compliance', complianceRoutes);
router.use('/compliance', complianceRoutes);
router.use('/ai', aiRoutes);

import activityRequestRoutes from './modules/activity_requests/activity_request.routes.js';
import providerRoutes from './modules/providers/provider.routes.js';
import customerFeedbackRoutes from './modules/customer_feedback/feedback.routes.js';

router.use('/activity-requests', activityRequestRoutes);
router.use('/providers', providerRoutes);
router.use('/customer-feedback', customerFeedbackRoutes);

export default router;

