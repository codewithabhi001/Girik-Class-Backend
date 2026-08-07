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

const FONT = theme.typography.fontFamily;
const BRAND = '#0f2f57';
const ACCENT = '#1d4f7c';
const GOLD = '#b08d57';
const MUTED = '#5f6b7a';
const LINE = '#e5ebf2';
const SOFT = '#f5f7fa';

const iconImg = (cid, alt) =>
  `<img src="cid:${cid}" alt="${alt}" width="14" height="14" style="display:inline-block; border:0; outline:none; width:14px; height:14px; vertical-align:middle; margin:0 8px 1px 0;" />`;

const iconRow = (cid, alt, labelHtml) => `
  <tr>
    <td valign="top" width="22" style="width:22px; padding:0 0 8px;">
      ${iconImg(cid, alt)}
    </td>
    <td valign="top" style="padding:0 0 8px; font-family:${FONT}; font-size:13px; line-height:1.55; color:${MUTED};">
      ${labelHtml}
    </td>
  </tr>`;

/**
 * GR Class branded email shell — full-width desktop, stacked/centered mobile.
 * @param {{ title: string, innerHtml: string, preheader?: string, unsubscribeUrl?: string }} opts
 */
export const wrapGrclassEmail = ({ title, innerHtml, preheader = '', unsubscribeUrl }) => {
  const safeTitle = escapeHtml(title);
  const pre = escapeHtml(preheader).slice(0, 200);
  const year = new Date().getFullYear();
  const safeUnsubscribe = unsubscribeUrl ? escapeHtml(unsubscribeUrl) : '';

  const unsubscribeLine = safeUnsubscribe
    ? `<a href="${safeUnsubscribe}" style="color:#9db0c5; text-decoration:underline;">Unsubscribe</a><span style="color:#4b6480; padding:0 8px;">|</span>`
    : '';

  const contactBlock = `
    <p style="margin:0 0 2px; font-size:17px; font-weight:800; color:${BRAND}; line-height:1.25; letter-spacing:-0.01em;">
      GR Class Administration
    </p>
    <p style="margin:0 0 14px; font-size:12px; font-weight:600; color:${GOLD}; letter-spacing:0.04em; text-transform:uppercase;">
      Maritime Classification &amp; Certification
    </p>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%;">
      ${iconRow('icon-location', 'Address', `<strong style="color:${BRAND};">HQ:</strong> B.C. 1304883, C1 Building, Ajman District Business, Makani No – 4442612247, UAE.`)}
      ${iconRow('icon-location', 'Address', `<strong style="color:${BRAND};">India:</strong> Office No - 6, Hermes Atrium, Sector -11, CBD Belapur, Navi Mumbai, Maharashtra, India.`)}
      ${iconRow('icon-location', 'Address', `<strong style="color:${BRAND};">Greece:</strong> Notara Str. 110, Piraeus, 18535, Greece.`)}
      ${iconRow('icon-location', 'Address', `<strong style="color:${BRAND};">Panama:</strong> Edificio Global Plaza, Calle 50, Piso 21, Republic de Panama.`)}
      ${iconRow('icon-phone', 'Phone', `<a href="tel:+971555324087" style="color:${MUTED}; text-decoration:none;">+971 55 532 4087</a>`)}
      ${iconRow('icon-email', 'Email', `<a href="mailto:info@grclass.com" style="color:${ACCENT}; text-decoration:none;">info@grclass.com</a>`)}
      ${iconRow('icon-web', 'Website', `<a href="https://grclass.com" style="color:${ACCENT}; text-decoration:none;">www.grclass.com</a>`)}
    </table>`;

  const qrBlock = (size = 96) => `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
      <tr>
        <td align="center" style="padding:7px; border:1px solid ${LINE}; background:#ffffff;">
          <img src="cid:grclass-qr" alt="Scan to verify" width="${size}" height="${size}" style="display:block; border:0; width:${size}px; height:${size}px;" />
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-top:7px;">
          <p style="margin:0; font-family:${FONT}; font-size:9px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:${MUTED};">
            Scan to Verify
          </p>
        </td>
      </tr>
    </table>`;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${safeTitle}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    html, body { margin:0 !important; padding:0 !important; width:100% !important; }
    body {
      width:100% !important;
      -webkit-text-size-adjust:100%;
      -ms-text-size-adjust:100%;
      background-color:${SOFT};
      font-family:${FONT};
    }
    img { border:0; height:auto; line-height:100%; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
    table { border-collapse:collapse !important; mso-table-lspace:0pt; mso-table-rspace:0pt; }
    .email-shell { width:100% !important; max-width:100% !important; }
    .email-card { width:100% !important; max-width:600px !important; margin: 0 auto !important; }

    .sig-info { width:68%; }
    .sig-brand { width:32%; }

    /* Desktop default: stacked logo/QR. Mobile alternate hidden. */
    .brand-mobile { display:none !important; max-height:0 !important; overflow:hidden !important; mso-hide:all; }
    .brand-desktop { display:table !important; }

    @media only screen and (max-width:680px) {
      .email-shell-td { padding: 0 !important; }
      .email-pad { padding-left:16px !important; padding-right:16px !important; }
      .header { padding:18px 16px !important; }
      .content { padding:24px 16px 22px !important; }
      .sig-pad { padding:20px 16px 14px !important; }
      .privacy-pad { padding:16px !important; }
      .bottom-pad { padding:16px !important; }

      .sig-info,
      .sig-brand {
        display:block !important;
        width:100% !important;
        max-width:100% !important;
        padding:0 0 14px !important;
      }

      /* Hide desktop stacked brand; show mobile one-row centered */
      .brand-desktop {
        display:none !important;
        max-height:0 !important;
        overflow:hidden !important;
        mso-hide:all;
        width:0 !important;
        height:0 !important;
        font-size:0 !important;
        line-height:0 !important;
      }
      .brand-mobile {
        display:table !important;
        max-height:none !important;
        overflow:visible !important;
        width:auto !important;
        margin:0 auto !important;
      }
      .sig-brand { text-align:center !important; padding-top:6px !important; padding-bottom:4px !important; }

      .loc-bar { font-size:11px !important; line-height:1.55 !important; padding:12px 14px !important; }
      .ro-label { display:none !important; }
      .cta-btn { display:block !important; width:100% !important; box-sizing:border-box !important; text-align:center !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; width:100%; background-color:${SOFT};">
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;max-height:0;max-width:0;overflow:hidden;mso-hide:all;">${pre}</span>

  <table role="presentation" class="email-shell" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%; background-color:${SOFT};">
    <tr>
      <td align="center" class="email-shell-td" style="padding:40px 10px; width:100%;">
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="600" style="width:600px;">
        <tr>
        <td align="center" valign="top" width="600" style="width:600px;">
        <![endif]-->
        <table role="presentation" class="email-card" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%; max-width:600px; background-color:#ffffff; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03); border-radius: 8px; overflow: hidden;">

          <!-- Brand accent -->
          <tr>
            <td style="height:4px; line-height:4px; font-size:0; background:linear-gradient(90deg, ${BRAND} 0%, ${ACCENT} 70%, ${GOLD} 100%); background-color:${BRAND};">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td class="header email-pad" style="background-color:#ffffff; padding:24px 40px 20px; border-bottom:1px solid ${LINE};">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;">
                <tr>
                  <td align="left" valign="middle">
                    <a href="https://grclass.com" target="_blank" style="text-decoration:none;">
                      <img src="cid:grclass-logo" alt="GR Class Logo" width="148" height="99" style="display:block; border:0; outline:none; height:46px; width:auto; max-width:150px;" />
                    </a>
                  </td>
                  <td align="right" valign="middle" class="ro-label" style="font-family:${FONT}; font-size:10px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase; color:#8a96a5;">
                    Recognized Organization
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="content email-pad" style="padding:36px 40px 28px; font-family:${FONT}; color:#334155; font-size:15px; line-height:1.7; background-color:#ffffff;">
              ${innerHtml}
            </td>
          </tr>

          <tr>
            <td class="email-pad" style="padding:0 40px; background-color:#ffffff;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;">
                <tr><td style="border-top:1px solid ${LINE}; font-size:0; line-height:0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td class="sig-pad email-pad" style="padding:28px 40px 18px; background-color:#ffffff;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;">
                <tr>
                  <td class="sig-info" valign="top" style="width:68%; padding-right:28px; font-family:${FONT};">
                    ${contactBlock}
                  </td>

                  <td class="sig-brand" valign="top" align="right" style="width:32%; text-align:right;">
                    <!-- Desktop: logo above QR (right) -->
                    <table role="presentation" class="brand-desktop" border="0" cellpadding="0" cellspacing="0" align="right" style="margin-left:auto;">
                      <tr>
                        <td align="center" style="padding-bottom:14px;">
                          <a href="https://grclass.com" target="_blank" style="text-decoration:none;">
                            <img src="cid:grclass-logo" alt="GR Class Logo" width="118" height="79" style="display:block; border:0; outline:none; width:118px; max-width:118px; height:auto; margin:0 auto;" />
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td align="center">${qrBlock(100)}</td>
                      </tr>
                    </table>

                    <!-- Mobile: logo + QR one centered row -->
                    <table role="presentation" class="brand-mobile" border="0" cellpadding="0" cellspacing="0" align="center" style="display:none; margin:0 auto;">
                      <tr>
                        <td valign="middle" align="center" style="padding-right:16px;">
                          <a href="https://grclass.com" target="_blank" style="text-decoration:none;">
                            <img src="cid:grclass-logo" alt="GR Class Logo" width="100" height="67" style="display:block; border:0; outline:none; width:100px; height:auto;" />
                          </a>
                        </td>
                        <td valign="middle" align="center">${qrBlock(84)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Locations -->
          <tr>
            <td align="center" class="loc-bar" style="background-color:${BRAND}; padding:12px 20px; font-family:${FONT}; font-size:12px; font-weight:600; letter-spacing:0.06em; color:#ffffff;">
              Ajman &nbsp;•&nbsp; Navi Mumbai &nbsp;•&nbsp; Piraeus &nbsp;•&nbsp; Panama
            </td>
          </tr>

          <!-- Privacy -->
          <tr>
            <td class="privacy-pad email-pad" style="padding:20px 40px 10px; background-color:#ffffff;">
              <p style="margin:0 0 10px; text-align:center; font-family:${FONT}; font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:${BRAND};">
                Privacy and Confidentiality Notice
              </p>
              <p style="margin:0; font-family:${FONT}; font-size:11px; line-height:1.65; color:#7b8794;">
                This email and any attachments are confidential and intended solely for the named recipient(s).
                If you received this message in error, please notify the sender and delete it.
                Unauthorized disclosure or distribution is prohibited.
                GR Class is a Classification Society and Recognized Organization.
                Read our
                <a href="https://grclass.com/legal/privacy" target="_blank" style="color:${ACCENT}; text-decoration:underline; font-weight:600;">Privacy Policy</a>
                (
                <a href="https://grclass.com/legal/privacy" target="_blank" style="color:${ACCENT}; text-decoration:underline;">grclass.com/legal/privacy</a>
                ).
                Also see
                <a href="https://grclass.com/legal/terms" target="_blank" style="color:${ACCENT}; text-decoration:underline;">Terms</a>
                and
                <a href="https://grclass.com/legal/compliance" target="_blank" style="color:${ACCENT}; text-decoration:underline;">Compliance</a>.
              </p>
            </td>
          </tr>

          <tr>
            <td class="email-pad" style="padding:6px 40px 18px; background-color:#ffffff;">
              <p style="margin:0; font-family:${FONT}; font-size:11px; font-style:italic; color:#2f6b4f;">
                Please consider the environment before printing this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" class="bottom-pad" style="background-color:#0b2138; padding:18px 24px;">
              <p style="margin:0 0 8px; font-family:${FONT}; font-size:12px; color:#9db0c5;">
                <a href="https://grclass.com/about" style="color:#d7e3ef; text-decoration:none;">About</a>
                <span style="color:#4b6480; padding:0 8px;">|</span>
                <a href="https://grclass.com/contact" style="color:#d7e3ef; text-decoration:none;">Contact</a>
                <span style="color:#4b6480; padding:0 8px;">|</span>
                <a href="https://grclass.com/legal/privacy" style="color:#d7e3ef; text-decoration:none;">Privacy</a>
                <span style="color:#4b6480; padding:0 8px;">|</span>
                <a href="https://grclass.com/legal/terms" style="color:#d7e3ef; text-decoration:none;">Terms</a>
                <span style="color:#4b6480; padding:0 8px;">|</span>
                <a href="https://grclass.com/legal/compliance" style="color:#d7e3ef; text-decoration:none;">Compliance</a>
              </p>
              <p style="margin:0; font-family:${FONT}; font-size:12px; color:#9db0c5;">
                ${unsubscribeLine}
                <a href="https://grclass.com" style="color:#e8f0f7; text-decoration:none; font-weight:600;">www.grclass.com</a>
              </p>
              <p style="margin:10px 0 0; font-family:${FONT}; font-size:11px; color:#6f8499;">
                © ${year} GR Class. All Rights Reserved.
              </p>
            </td>
          </tr>
        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export const wrapEmailHtml = (opts) => wrapGrclassEmail(opts);
