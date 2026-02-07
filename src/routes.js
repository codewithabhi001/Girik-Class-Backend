import express from 'express';
import authRoutes from './modules/auth/auth.routes.js';
import clientRoutes from './modules/clients/client.routes.js';
import vesselRoutes from './modules/vessels/vessel.routes.js';
import jobRoutes from './modules/jobs/job.routes.js';
import surveyRoutes from './modules/surveys/survey.routes.js';
import certificateRoutes from './modules/certificates/certificate.routes.js';
import paymentRoutes from './modules/payments/payment.routes.js';
import surveyorRoutes from './modules/surveyors/surveyor.routes.js';
import checklistRoutes from './modules/checklists/checklist.routes.js';
import ncRoutes from './modules/non_conformities/nc.routes.js';
import tocaRoutes from './modules/toca/toca.routes.js';
import flagRoutes from './modules/flags/flag.routes.js';
import approvalRoutes from './modules/approvals/approval.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import userRoutes from './modules/users/user.routes.js';
import docRoutes from './modules/documents/document.routes.js';
import publicRoutes from './modules/public/public.routes.js';
import clientPortalRoutes from './modules/client_portal/client.portal.routes.js';
import systemRoutes from './modules/system/system.routes.js';
import reportRoutes from './modules/reports/report.routes.js';
import activityRequestRoutes from './modules/activity_requests/activity_request.routes.js';
import providerRoutes from './modules/providers/provider.routes.js';
import customerFeedbackRoutes from './modules/customer_feedback/feedback.routes.js';
import changeRequestRoutes from './modules/change_requests/change_request.routes.js';
import templateRoutes from './modules/templates/template.routes.js';
import incidentRoutes from './modules/incidents/incident.routes.js';
import mobileRoutes from './modules/mobile/mobile.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';

const router = express.Router();

router.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Public
router.use('/public', publicRoutes);

// Protected Modules
router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/vessels', vesselRoutes);
router.use('/jobs', jobRoutes);
router.use('/surveys', surveyRoutes);
router.use('/certificates', certificateRoutes);
router.use('/payments', paymentRoutes);
router.use('/surveyors', surveyorRoutes);
router.use('/', checklistRoutes); // Assumes mounted internally or separate
router.use('/non-conformities', ncRoutes);
router.use('/toca', tocaRoutes);
router.use('/flags', flagRoutes);
router.use('/approvals', approvalRoutes);
router.use('/notifications', notificationRoutes);
router.use('/users', userRoutes);
router.use('/documents', docRoutes);
router.use('/mobile', mobileRoutes);
router.use('/client', clientPortalRoutes);
router.use('/system', systemRoutes);
router.use('/reports', reportRoutes);
router.use('/change-requests', changeRequestRoutes);
router.use('/certificate-templates', templateRoutes);
router.use('/incidents', incidentRoutes);
router.use('/activity-requests', activityRequestRoutes);
router.use('/providers', providerRoutes);
router.use('/customer-feedback', customerFeedbackRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
