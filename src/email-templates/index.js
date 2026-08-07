import { render as renderOtp } from './otp.template.js';
import { render as renderPasswordReset } from './password-reset.template.js';
import { render as renderEmailVerification } from './email-verification.template.js';
import { render as renderWelcomeUser } from './welcome-user.template.js';
import { render as renderSubscriptionWelcome } from './subscription-welcome.template.js';
import { render as renderContactAcknowledgement } from './contact-acknowledgement.template.js';
import { render as renderAdminNewEnquiry } from './admin-new-enquiry.template.js';
import { render as renderMaintenance } from './maintenance.template.js';

/** @type {Record<string, (data: object) => { subject: string, html: string, type?: string }>} */
const registry = {
    OTP: renderOtp,
    PASSWORD_RESET: renderPasswordReset,
    EMAIL_VERIFICATION: renderEmailVerification,
    WELCOME_USER: renderWelcomeUser,
    SUBSCRIPTION_WELCOME: renderSubscriptionWelcome,
    CONTACT_ACKNOWLEDGEMENT: renderContactAcknowledgement,
    NEW_WEBSITE_ENQUIRY: renderAdminNewEnquiry,
    MAINTENANCE_NOTIFICATION: renderMaintenance,
};

/**
 * Password reset email for auth flow — returns subject, plain text, and HTML.
 * @param {{ userName?: string, resetLink: string, ttlMinutes?: number }} data
 * @returns {{ subject: string, text: string, html: string }}
 */
export const passwordReset = (data) => {
    const out = renderPasswordReset({
        resetUrl: data.resetLink,
        userName: data.userName,
        ttlMinutes: data.ttlMinutes ?? 60,
    });
    const link = String(data.resetLink || '');
    const name = data.userName ? String(data.userName) : 'there';
    const text = [
        `Hi ${name},`,
        '',
        'We received a request to reset your GR Class password. Open this link to set a new password:',
        link,
        '',
        'If you did not request this, you can ignore this email.',
        '',
        '— GR Class',
    ].join('\n');
    return { subject: out.subject, text, html: out.html };
};

/**
 * @param {string} name - Template key (e.g. OTP, PASSWORD_RESET)
 * @param {object} data - Template-specific payload
 * @returns {{ subject: string, html: string, type: string } | null}
 */
export const renderEmailTemplate = (name, data) => {
    const render = registry[name];
    if (!render) return null;
    const out = render(data);
    return {
        subject: out.subject,
        html: out.html,
        type: out.type || 'notification',
    };
};

export { registry };
