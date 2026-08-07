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
const MUTED = '#5f6b7a';
const LINE = '#d7dee7';

/** Small CID icon for Gmail-safe rendering (no emoji). */
const iconImg = (cid, alt) =>
  `<img src="cid:${cid}" alt="${alt}" width="14" height="14" style="display:inline-block; border:0; outline:none; width:14px; height:14px; vertical-align:middle; margin:0 7px 2px 0;" />`;

const iconRow = (cid, alt, labelHtml) => `
  <tr>
    <td valign="top" width="22" style="width:22px; padding:0 0 7px 0; line-height:1.55;">
      ${iconImg(cid, alt)}
    </td>
    <td valign="top" style="padding:0 0 7px 0; font-family:${FONT}; font-size:12.5px; line-height:1.55; color:${MUTED};">
      ${labelHtml}
    </td>
  </tr>`;

/**
 * Professional Maritime Email Wrapper
 * Fluid full-width on desktop reading panes; stacks cleanly on mobile.
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

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
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
    html, body { margin:0 !important; padding:0 !important; width:100% !important; height:100% !important; }
    body {
      width:100% !important;
      -webkit-text-size-adjust:100%;
      -ms-text-size-adjust:100%;
      background-color:#ffffff;
      font-family:${FONT};
    }
    img { border:0; height:auto; line-height:100%; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
    table { border-collapse:collapse !important; mso-table-lspace:0pt; mso-table-rspace:0pt; }
    .email-shell, .email-shell > tbody, .email-shell > tbody > tr, .email-shell > tbody > tr > td { width:100% !important; }
    .email-card { width:100% !important; max-width:100% !important; }

    /* Desktop: keep signature columns side-by-side */
    .sig-logo { width:18%; }
    .sig-info { width:62%; }
    .sig-qr { width:20%; }

    @media only screen and (max-width:680px) {
      .email-pad { padding-left:16px !important; padding-right:16px !important; }
      .header { padding:18px 16px !important; }
      .content { padding:24px 16px 20px !important; }
      .sig-pad { padding:20px 16px 12px !important; }
      .privacy-pad { padding:16px 16px 8px !important; }
      .bottom-pad { padding:16px !important; }
      .sig-logo,
      .sig-info,
      .sig-qr {
        display:block !important;
        width:100% !important;
        max-width:100% !important;
        padding-left:0 !important;
        padding-right:0 !important;
        padding-bottom:14px !important;
        text-align:left !important;
      }
      .sig-qr { text-align:left !important; }
      .sig-qr table { margin:0 !important; }
      .loc-bar {
        font-size:11px !important;
        line-height:1.55 !important;
        letter-spacing:0.02em !important;
        padding:12px 14px !important;
      }
      .ro-label { display:none !important; }
      .cta-btn { display:block !important; width:100% !important; box-sizing:border-box !important; text-align:center !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; width:100%; background-color:#ffffff;">
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;max-height:0;max-width:0;overflow:hidden;mso-hide:all;">${pre}</span>

  <!-- Full-width shell: fills Gmail reading pane on desktop -->
  <table role="presentation" class="email-shell" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%; background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:0; margin:0; width:100%;">
        <table role="presentation" class="email-card" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%; max-width:100%; background-color:#ffffff;">

          <tr>
            <td style="height:4px; line-height:4px; font-size:0; background-color:${BRAND};">&nbsp;</td>
          </tr>

          <!-- HEADER -->
          <tr>
            <td class="header email-pad" style="background-color:#ffffff; padding:22px 40px 18px; border-bottom:1px solid ${LINE};">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;">
                <tr>
                  <td align="left" valign="middle" style="width:70%;">
                    <a href="https://grclass.com" target="_blank" style="text-decoration:none;">
                      <img src="cid:grclass-logo" alt="GR Class Logo" width="150" height="100" style="display:block; border:0; outline:none; height:48px; width:auto; max-width:160px;" />
                    </a>
                  </td>
                  <td align="right" valign="middle" class="ro-label" style="width:30%; font-family:${FONT}; font-size:11px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase; color:#8a96a5;">
                    Recognized Organization
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td class="content email-pad" style="padding:36px 40px 28px; font-family:${FONT}; color:#334155; font-size:15px; line-height:1.7;">
              ${innerHtml}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td class="email-pad" style="padding:0 40px;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;">
                <tr><td style="border-top:1px solid ${LINE}; font-size:0; line-height:0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <!-- SIGNATURE: logo | contact | QR (stacks on mobile) -->
          <tr>
            <td class="sig-pad email-pad" style="padding:28px 40px 16px; background-color:#ffffff;">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;">
                <tr>
                  <td class="sig-logo" valign="top" style="width:18%; padding-right:18px;">
                    <a href="https://grclass.com" target="_blank" style="text-decoration:none;">
                      <img src="cid:grclass-logo" alt="GR Class Logo" width="130" height="87" style="display:block; border:0; outline:none; width:130px; max-width:100%; height:auto;" />
                    </a>
                  </td>

                  <td class="sig-info" valign="top" style="width:62%; padding-right:16px; font-family:${FONT};">
                    <p style="margin:0 0 2px; font-size:16px; font-weight:800; color:${BRAND}; line-height:1.25;">
                      GR Class Administration
                    </p>
                    <p style="margin:0 0 12px; font-size:12px; font-weight:600; color:${ACCENT};">
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
                    </table>
                  </td>

                  <td class="sig-qr" valign="top" align="right" style="width:20%; text-align:right;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="right" style="margin-left:auto;">
                      <tr>
                        <td align="center" style="padding:6px; border:1px solid ${LINE}; background:#ffffff;">
                          <img src="cid:grclass-qr" alt="Scan to verify" width="100" height="100" style="display:block; border:0; width:100px; height:100px; max-width:100%;" />
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-top:8px;">
                          <p style="margin:0; font-family:${FONT}; font-size:9px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:${MUTED};">
                            Scan to Verify
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Locations bar -->
          <tr>
            <td align="center" class="loc-bar" style="background-color:${BRAND}; padding:12px 24px; font-family:${FONT}; font-size:12px; font-weight:600; letter-spacing:0.05em; color:#ffffff;">
              Ajman • Navi Mumbai • Piraeus • Panama
            </td>
          </tr>

          <!-- Privacy -->
          <tr>
            <td class="privacy-pad email-pad" style="padding:20px 40px 8px; background-color:#ffffff;">
              <p style="margin:0 0 10px; text-align:center; font-family:${FONT}; font-size:12px; font-weight:700; letter-spacing:0.06em; color:${BRAND};">
                ***** Privacy and Confidentiality Notice *****
              </p>
              <p style="margin:0; font-family:${FONT}; font-size:11px; line-height:1.65; color:#7b8794; text-align:left;">
                This email and any attachments are confidential and intended solely for the named recipient(s).
                If you have received this message in error, please notify the sender immediately and delete it from your system.
                Unauthorized disclosure, copying, or distribution is strictly prohibited.
                GR Class is a Classification Society and Recognized Organization providing maritime classification and statutory certification services.
                For information on how we process personal data, please read our
                <a href="https://grclass.com/legal/privacy" target="_blank" style="color:${ACCENT}; text-decoration:underline; font-weight:600;">Privacy Policy</a>
                at
                <a href="https://grclass.com/legal/privacy" target="_blank" style="color:${ACCENT}; text-decoration:underline;">https://grclass.com/legal/privacy</a>.
                Legal documents:
                <a href="https://grclass.com/legal/terms" target="_blank" style="color:${ACCENT}; text-decoration:underline;">Terms</a>
                ·
                <a href="https://grclass.com/legal/compliance" target="_blank" style="color:${ACCENT}; text-decoration:underline;">Compliance</a>.
              </p>
            </td>
          </tr>

          <tr>
            <td class="email-pad" style="padding:8px 40px 18px; background-color:#ffffff;">
              <p style="margin:0; font-family:${FONT}; font-size:11px; font-style:italic; color:#2f6b4f;">
                Please consider the environment before printing this email.
              </p>
            </td>
          </tr>

          <!-- Bottom bar -->
          <tr>
            <td align="center" class="bottom-pad" style="background-color:#0b2138; padding:18px 28px;">
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
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export const wrapEmailHtml = (opts) => wrapGrclassEmail(opts);
