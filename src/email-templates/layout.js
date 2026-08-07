import { emailTheme as theme } from './theme.js';

export const escapeHtml = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Professional Maritime/Industrial Email Wrapper
 * @param {{ title: string, innerHtml: string, preheader?: string }} opts
 */
export const wrapGrclassEmail = ({ title, innerHtml, preheader = '' }) => {
  const safeTitle = escapeHtml(title);
  const pre = escapeHtml(preheader).slice(0, 200);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      background-color: ${theme.colors.background};
      font-family: ${theme.typography.fontFamily};
    }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 30px 20px !important; }
      .header { padding: 25px 20px !important; }
    }
  </style>
</head>
<body style="background-color: ${theme.colors.background}; margin: 0; padding: 40px 0;">
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0">${pre}</span>
  <center>
    <table border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="background-color: ${theme.colors.white}; border-radius: 0; overflow: hidden; border: 1px solid ${theme.colors.brand.faded};">
      
      <!-- HEADER -->
      <tr>
        <td align="left" class="header" style="background-color: ${theme.colors.brand.primary}; padding: 30px 40px; border-bottom: 2px solid ${theme.colors.brand.accent};">
          <a href="https://grclass.com" target="_blank" style="text-decoration:none;">
            <img src="https://grclass.com/grclass-logo.webp" alt="GR Class" style="display:block; border:none; outline:none; height:45px; width:auto;" />
          </a>
        </td>
      </tr>

      <!-- CONTENT BODY -->
      <tr>
        <td class="content" style="padding: 40px 40px 30px 40px;">
          ${innerHtml}
        </td>
      </tr>

      <!-- SIGNATURE / FOOTER -->
      <tr>
        <td style="padding: 0 40px 40px 40px;">
          
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top: 1px solid ${theme.colors.brand.faded}; padding-top: 30px;">
            <tr>
              <!-- LEFT SIDE: LOGO -->
              <td width="150" valign="top" style="padding-right: 15px; border-right: 2px solid ${theme.colors.brand.main}; text-align: center;">
                <img src="https://grclass.com/grclass-logo.webp" alt="GR Class Logo" width="120" style="max-width: 120px; height: auto; display: block; margin: 0 auto 10px auto;">
                <div style="background-color: ${theme.colors.brand.main}; color: ${theme.colors.white}; font-size: 8pt; font-weight: bold; padding: 4px; text-transform: uppercase; margin-top: 5px;">
                  GR CLASS
                </div>
                <div style="font-size: 7pt; color: ${theme.colors.brand.accent}; font-weight: bold; margin-top: 4px; text-transform: uppercase;">
                  Classified for Standards
                </div>
                <div style="font-size: 6.5pt; color: ${theme.colors.text.muted}; margin-top: 4px;">
                  Recognized Organization (RO)
                </div>
              </td>

              <!-- MIDDLE SIDE: CONTACT INFO -->
              <td valign="top" style="padding-left: 15px; padding-right: 15px;">
                <div style="font-size: 13pt; font-weight: bold; color: ${theme.colors.brand.main}; margin-bottom: 2px;">
                  GR Class Administration
                </div>
                <div style="font-size: 9pt; font-weight: bold; color: ${theme.colors.brand.accent}; margin-bottom: 12px;">
                  Automated Notification System
                </div>
                
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size: 8pt; color: ${theme.colors.text.body}; line-height: 1.4;">
                  <tr>
                    <td width="40" valign="top" style="color: ${theme.colors.brand.main}; font-weight: bold;">HQ:</td>
                    <td valign="top" style="padding-bottom: 4px;">
                      B.C. 1304883, Ajman Free Zone C1 Building, Ajman District Business, Makani No – 4442612247, UAE.
                    </td>
                  </tr>
                  <tr>
                    <td width="40" valign="top" style="color: ${theme.colors.brand.main}; font-weight: bold;">India:</td>
                    <td valign="top" style="padding-bottom: 4px;">
                      Office No - 6, Hermes Atrium, Sector -11, CBD Belapur, Navi Mumbai, Maharashtra, India.
                    </td>
                  </tr>
                  <tr>
                    <td width="40" valign="top" style="color: ${theme.colors.brand.main}; font-weight: bold;">Panama:</td>
                    <td valign="top" style="padding-bottom: 8px;">
                      Edificio Global Plaza, Calle 50, Piso 21, Republic de Panama.
                    </td>
                  </tr>
                  <tr>
                    <td width="40" valign="top" style="color: ${theme.colors.brand.main}; font-weight: bold;">Tel:</td>
                    <td valign="top" style="padding-bottom: 4px;">
                      +971 55 532 4087
                    </td>
                  </tr>
                  <tr>
                    <td width="40" valign="top" style="color: ${theme.colors.brand.main}; font-weight: bold;">Email:</td>
                    <td valign="top" style="padding-bottom: 4px;">
                      <a href="mailto:info@grclass.com" style="color: ${theme.colors.brand.main}; text-decoration: none;">info@grclass.com</a> &nbsp;|&nbsp; 
                      <a href="mailto:operation@grclass.com" style="color: ${theme.colors.brand.main}; text-decoration: none;">operation@grclass.com</a>
                    </td>
                  </tr>
                  <tr>
                    <td width="40" valign="top" style="color: ${theme.colors.brand.main}; font-weight: bold;">Web:</td>
                    <td valign="top">
                      <a href="https://www.grclass.com" style="color: ${theme.colors.brand.main}; text-decoration: none; font-weight: bold;">www.grclass.com</a>
                    </td>
                  </tr>
                </table>
              </td>

              <!-- RIGHT SIDE: QR CODE -->
              <td width="80" valign="bottom" style="text-align: right;">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=https://www.grclass.com" alt="Website QR" width="70" style="max-width: 70px; height: auto; border: 1px solid ${theme.colors.brand.faded}; padding: 2px;">
                <div style="font-size: 6pt; color: ${theme.colors.brand.main}; font-weight: bold; margin-top: 4px; text-align: center;">
                  Website
                </div>
              </td>
            </tr>
          </table>

          <!-- BOTTOM REGIONS BAR -->
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 15px;">
            <tr>
              <td style="background-color: ${theme.colors.brand.navy_sec}; color: ${theme.colors.text.body}; font-size: 7.5pt; font-weight: bold; text-align: center; padding: 6px 10px; border-bottom: 2px solid ${theme.colors.brand.accent}; border-top: 1px solid ${theme.colors.brand.faded};">
                UAE &nbsp;&bull;&nbsp; India &nbsp;&bull;&nbsp; Greece &nbsp;&bull;&nbsp; Panama &nbsp;&bull;&nbsp; Singapore &nbsp;&bull;&nbsp; Turkey
              </td>
            </tr>
          </table>

          <!-- PRIVACY NOTICE -->
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 10px;">
            <tr>
              <td style="font-size: 7pt; color: ${theme.colors.text.light}; line-height: 1.3; text-align: justify;">
                <strong>Privacy and Confidentiality Notice:</strong> This email may contain confidential and privileged information. It is intended solely for the use of the named recipient(s). If you are not an intended recipient, you must not distribute, copy, or disclose the information herein, nor should you act in reliance upon it. If you have received this email in error, please notify us immediately at the email address above and delete it from your system. GR Class is a Recognized Organization committed to strictly avoiding engagement in the inspection and certification process for any entities addressed under International Sanctions by the United Nations. Please consider the environment before printing this email.
              </td>
            </tr>
          </table>

        </td>
      </tr>

      <!-- FOOTER LINKS -->
      <tr>
        <td align="center" style="background-color: ${theme.colors.brand.navy_sec}; padding: 20px 40px; border-top: 1px solid ${theme.colors.brand.faded};">
          <p style="margin: 0; font-size: 10px; color: ${theme.colors.text.muted}; letter-spacing: 0.1em; font-weight: 700; text-transform: uppercase; margin-bottom: 10px;">
            © ${new Date().getFullYear()} GR Class. All Rights Reserved.
          </p>
          <div>
            <a href="https://grclass.com/privacy" style="color: ${theme.colors.text.body}; font-size: 10px; text-decoration: none; margin: 0 8px; font-weight: 600;">Privacy Policy</a>
            <span style="color: ${theme.colors.text.light}; font-size: 10px;">|</span>
            <a href="https://grclass.com/terms" style="color: ${theme.colors.text.body}; font-size: 10px; text-decoration: none; margin: 0 8px; font-weight: 600;">Terms of Service</a>
            <span style="color: ${theme.colors.text.light}; font-size: 10px;">|</span>
            <a href="https://grclass.com/sustainability" style="color: ${theme.colors.text.body}; font-size: 10px; text-decoration: none; margin: 0 8px; font-weight: 600;">Environmental Policy</a>
          </div>
        </td>
      </tr>
  </center>
</body>
</html>`;
};

export const wrapEmailHtml = (opts) => wrapGrclassEmail(opts);

