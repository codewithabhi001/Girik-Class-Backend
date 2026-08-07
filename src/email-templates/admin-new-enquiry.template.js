import { escapeHtml, wrapEmailHtml } from './layout.js';
import { emailTheme as theme } from './theme.js';

/**
 * Admin notification for new contact enquiry.
 * Expected data: { fullName: string, company: string, email: string, phone: string, message: string }
 */
export const templateName = 'ADMIN_NEW_ENQUIRY';

export const render = (data) => {
    const fullName = escapeHtml(data.fullName);
    const company = escapeHtml(data.company);
    const email = escapeHtml(data.email);
    const phone = escapeHtml(data.phone);
    const message = escapeHtml(data.message);

    const subject = `ACTION REQUIRED: New Lead - ${fullName}`;

    const innerHtml = `
      <p style="margin: 0; font-size: 11px; font-weight: 700; color: ${theme.colors.brand.main}; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">
        System Alert
      </p>
      <h1 style="margin: 0; color: ${theme.colors.text.core}; font-size: 20px; font-weight: 800; line-height: 1.2; letter-spacing: -0.02em;">
        NEW WEBSITE ENQUIRY
      </h1>
      <p style="margin: 20px 0; color: ${theme.colors.text.body}; font-size: 14px; line-height: 1.6;">
        A new professional lead has been captured through the <strong>GR Class</strong> digital portal. Please initiate the standard client onboarding protocol.
      </p>
      
      <div style="background-color: ${theme.colors.brand.surface}; border: 1px solid ${theme.colors.brand.faded}; border-radius: 0; padding: 24px; margin-bottom: 24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 8px 0; color: ${theme.colors.text.muted}; width: 110px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Principal</td>
            <td style="padding: 8px 0; color: ${theme.colors.text.core}; font-size: 13px; font-weight: 600;">${fullName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: ${theme.colors.text.muted}; font-size: 11px; font-weight: 700; text-transform: uppercase;">Organization</td>
            <td style="padding: 8px 0; color: ${theme.colors.text.core}; font-size: 13px; font-weight: 600;">${company}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: ${theme.colors.text.muted}; font-size: 11px; font-weight: 700; text-transform: uppercase;">Email</td>
            <td style="padding: 8px 0; color: ${theme.colors.text.core}; font-size: 13px; font-weight: 600;"><a href="mailto:${email}" style="color: ${theme.colors.brand.main}; text-decoration: none;">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: ${theme.colors.text.muted}; font-size: 11px; font-weight: 700; text-transform: uppercase;">Contact</td>
            <td style="padding: 8px 0; color: ${theme.colors.text.core}; font-size: 13px; font-weight: 600;">${phone}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: ${theme.colors.white}; border-left: 4px solid ${theme.colors.brand.main}; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${theme.colors.text.muted}; margin-bottom: 10px;">Enquiry Message</p>
        <p style="margin: 0; font-size: 13px; color: ${theme.colors.text.body}; line-height: 1.6; font-style: italic;">
          "${message}"
        </p>
      </div>

      <div align="center">
        <a href="https://ops.grclass.com" style="background-color: ${theme.colors.brand.main}; color: ${theme.colors.text.white}; padding: 15px 35px; border-radius: 0; text-decoration: none; font-size: 13px; font-weight: 700; display: inline-block; text-transform: uppercase; letter-spacing: 0.05em;">
          Manage Lead in CRM
        </a>
      </div>
    `;

    return {
        subject,
        html: wrapEmailHtml({ title: subject, innerHtml }),
        type: 'administration',
    };
};
