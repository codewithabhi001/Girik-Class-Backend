import express from 'express';

// Core Modules
import authRoutes from './modules/auth/auth.routes.js';
import publicRoutes from './modules/public/public.routes.js';

// Management Modules
import clientRoutes from './modules/clients/client.routes.js';
import vesselRoutes from './modules/vessels/vessel.routes.js';
import jobRoutes from './modules/jobs/job.routes.js';
import surveyRoutes from './modules/surveys/survey.routes.js';
import certificateRoutes from './modules/certificates/certificate.routes.js';
import paymentRoutes from './modules/payments/payment.routes.js';
import surveyorRoutes from './modules/surveyors/surveyor.routes.js';
import checklistRoutes from './modules/checklists/checklist.routes.js';
import checklistTemplateRoutes from './modules/checklists/checklist_template.routes.js';
import ncRoutes from './modules/non_conformities/nc.routes.js';
import tocaRoutes from './modules/toca/toca.routes.js';
import flagRoutes from './modules/flags/flag.routes.js';
import approvalRoutes from './modules/approvals/approval.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import userRoutes from './modules/users/user.routes.js';
import docRoutes from './modules/documents/document.routes.js';
import systemRoutes from './modules/system/system.routes.js';
import reportRoutes from './modules/reports/report.routes.js';
import activityRequestRoutes from './modules/activity_requests/activity_request.routes.js';
import customerFeedbackRoutes from './modules/feedback/feedback.routes.js';
import changeRequestRoutes from './modules/change_requests/change_request.routes.js';
import templateRoutes from './modules/templates/template.routes.js';
import incidentRoutes from './modules/incidents/incident.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import mobileRoutes from './modules/mobile/mobile.routes.js';

// New Operational Modules
import supportRoutes from './modules/support/support.routes.js';
import searchRoutes from './modules/search/search.routes.js';
import complianceRoutes from './modules/compliance/compliance.routes.js';

// Client Modules
const router = express.Router();

router.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// 1. Public Routes
router.use('/public', publicRoutes);

// 2. Auth Routes
router.use('/auth', authRoutes);

// 4. Operational Modules
router.use('/support', supportRoutes);
router.use('/search', searchRoutes);
router.use('/compliance', complianceRoutes);

// 5. Management Routes (Internal/RBAC)
router.use('/clients', clientRoutes);
router.use('/vessels', vesselRoutes);
router.use('/jobs', jobRoutes);
router.use('/surveys', surveyRoutes);
router.use('/certificates', certificateRoutes);
router.use('/payments', paymentRoutes);
router.use('/surveyors', surveyorRoutes);
router.use('/', checklistRoutes);
router.use('/checklist-templates', checklistTemplateRoutes);
router.use('/non-conformities', ncRoutes);
router.use('/toca', tocaRoutes);
router.use('/flags', flagRoutes);
router.use('/approvals', approvalRoutes);
router.use('/notifications', notificationRoutes);
router.use('/users', userRoutes);
router.use('/documents', docRoutes);
router.use('/system', systemRoutes);
router.use('/reports', reportRoutes);
router.use('/change-requests', changeRequestRoutes);
router.use('/certificate-templates', templateRoutes);
router.use('/incidents', incidentRoutes);
router.use('/activity-requests', activityRequestRoutes);
router.use('/customer-feedback', customerFeedbackRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/mobile', mobileRoutes);

export default router;
