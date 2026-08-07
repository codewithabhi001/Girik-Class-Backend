import { layout } from './layout.js';

export const render = (data) => {
    const { name, message } = data;

    const content = `
        <h1 style="color: #1e293b; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 24px;">Scheduled Maintenance Notice</h1>
        
        <p style="color: #475569; font-size: 16px; line-height: 24px; margin-bottom: 20px;">
            Hello ${name || 'User'},
        </p>
        
        <p style="color: #475569; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
            We are writing to inform you that the GR Class Portal is currently undergoing scheduled maintenance to improve our systems. During this time, the portal will be temporarily unavailable.
        </p>

        <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
            <p style="color: #1e293b; font-size: 15px; line-height: 24px; margin: 0; font-weight: 500;">
                Message from the Admin Team:
            </p>
            <p style="color: #475569; font-size: 14px; line-height: 20px; margin-top: 8px; margin-bottom: 0;">
                "${message || 'System is currently undergoing maintenance. Please try again later.'}"
            </p>
        </div>

        <p style="color: #475569; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
            We apologize for any inconvenience this may cause. Our team is working to complete the maintenance as quickly as possible. You will be able to access your account as soon as the maintenance is complete.
        </p>
        
        <p style="color: #475569; font-size: 16px; line-height: 24px; margin-bottom: 0;">
            Best regards,<br>
            <strong>The GR Class Technical Team</strong>
        </p>
    `;

    return {
        subject: 'GR Class - Scheduled Maintenance Notice',
        html: layout(content)
    };
};
