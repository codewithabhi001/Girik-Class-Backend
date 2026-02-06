
// Mock Cron Job wrapper
import cron from 'node-cron';
import * as slaService from '../sla/sla.service.js';
import * as certService from '../certificates/certificate.service.js';
import * as notificationService from '../services/notification.service.js';

export const startMonitoring = () => {
    // SLA Breach Monitor - Every hour
    cron.schedule('0 * * * *', async () => {
        console.log('CRON: Running SLA Breach Check');
        try {
            const breaches = await slaService.checkBreaches();
            if (breaches.length > 0) {
                // Notifications handled inside service or here
                // notificationService.notifyRoles(['ADMIN'], 'SLA Breaches Detected', `${breaches.length} jobs breached SLA.`);
            }
        } catch (e) { console.error('CRON Error (SLA):', e); }
    });

    // Certificate Expiry Monitor - Every day at midnight
    cron.schedule('0 0 * * *', async () => {
        console.log('CRON: Checking Certificate Expirations');
        try {
            const expiring30 = await certService.getExpiringCertificates(30);
            // Deduplicate and notify
            for (const cert of expiring30) {
                // Send email logic
                // notificationService.sendEmail(cert.vessel.owner_email, ...);
            }
        } catch (e) { console.error('CRON Error (Cert):', e); }
    });

    console.log('System Monitoring Started');
};
