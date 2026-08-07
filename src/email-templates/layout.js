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

// --- Updated Brand Theme Colors ---
const FONT = theme.typography?.fontFamily || 'Arial, Helvetica, sans-serif';
const BRAND = '#0A2540'; // Navy Blue
const GOLD = '#C9A227';  // Gold
const MUTED = '#5b6472';
const LINE = '#e2e5ea';
const SOFT = '#eef1f5';

// Hosted Golden Icons for Signature (Consistent across all email clients)
const icons = {
  location: 'https://img.icons8.com/ios-filled/50/C9A227/marker.png',
  phone: 'https://img.icons8.com/ios-filled/50/C9A227/phone.png',
  email: 'https://img.icons8.com/ios-filled/50/C9A227/new-post.png',
  web: 'https://img.icons8.com/ios-filled/50/C9A227/domain.png',
  linkedin: 'https://img.icons8.com/ios-filled/50/C9A227/linkedin.png',
  twitter: 'https://img.icons8.com/ios-filled/50/C9A227/twitterx.png',
  facebook: 'https://img.icons8.com/ios-filled/50/C9A227/facebook-new.png'
};

const iconRow = (iconUrl, alt, labelHtml) => `
  <tr>
    <td valign="top" style="padding:3px 8px 3px 0; width:16px;">
      <img src="${iconUrl}" alt="${alt}" width="14" height="14" style="display:block; border:0; margin-top:2px;" />
    </td>
    <td style="padding:3px 0; font-size:12.5px; color:${MUTED}; line-height:18px;">
      ${labelHtml}
    </td>
  </tr>`;

/**
 * GR Class branded email shell — STRICT FIXED LAYOUT (Always renders like Desktop).
 * @param {{ title: string, innerHtml: string, preheader?: string, unsubscribeUrl?: string }} opts
 */
export const wrapGrclassEmail = ({ title, innerHtml, preheader = '', unsubscribeUrl }) => {
  const safeTitle = escapeHtml(title);
  const pre = escapeHtml(preheader).slice(0, 200);
  const year = new Date().getFullYear();
  const safeUnsubscribe = unsubscribeUrl ? escapeHtml(unsubscribeUrl) : '#';

  const unsubscribeLine = unsubscribeUrl
    ? `<a href="${safeUnsubscribe}" style="color:#7f92b3; text-decoration:underline;">Unsubscribe</a>`
    : `<a href="#" style="color:#7f92b3; text-decoration:underline;">Unsubscribe</a>`;

  // Left side signature block with Golden Icons
  const contactBlock = `
    <span style="display:block; font-size:17px; font-weight:900; color:${BRAND};">GR Class Administration</span>
    <span style="display:block; font-size:10px; letter-spacing:1px; color:${GOLD}; text-transform:uppercase; font-weight:bold; padding-top:4px; padding-bottom:18px;">Maritime Classification &amp; Certification</span>

    <span style="display:block; font-size:10px; letter-spacing:1.5px; color:#8a94a3; text-transform:uppercase; font-weight:bold; padding-bottom:10px;">Regional Offices</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${iconRow(icons.location, 'Address', `<strong style="color:${BRAND};">HQ:</strong> B.C. 1304883, C1 Building, Ajman District Business, UAE`)}
      ${iconRow(icons.location, 'Address', `<strong style="color:${BRAND};">India:</strong> Office No‑6, Hermes Atrium, Navi Mumbai, Maharashtra`)}
      ${iconRow(icons.location, 'Address', `<strong style="color:${BRAND};">Greece:</strong> Notara Str. 110, Piraeus, 18535`)}
      ${iconRow(icons.location, 'Address', `<strong style="color:${BRAND};">Panama:</strong> Edificio Global Plaza, Calle 50, Piso 21`)}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${LINE}; padding-top:12px; margin-top:14px;">
      <tr>
        <td valign="middle" style="padding:5px 8px 5px 0; width:16px;">
          <img src="${icons.phone}" alt="Phone" width="14" height="14" style="display:block; border:0;" />
        </td>
        <td style="padding:5px 0; font-size:12.5px;">
          <span style="color:${GOLD}; font-weight:bold; letter-spacing:0.5px;">TEL&nbsp;&nbsp;</span><a href="tel:+971555324087" style="color:${BRAND}; text-decoration:none; font-weight:bold;">+971 55 532 4087</a>
        </td>
      </tr>
      <tr>
        <td valign="middle" style="padding:5px 8px 5px 0; width:16px;">
          <img src="${icons.email}" alt="Email" width="14" height="14" style="display:block; border:0;" />
        </td>
        <td style="padding:5px 0; font-size:12.5px;">
          <span style="color:${GOLD}; font-weight:bold; letter-spacing:0.5px;">EMAIL&nbsp;</span><a href="mailto:info@grclass.com" style="color:${BRAND}; text-decoration:none; font-weight:bold;">info@grclass.com</a>
        </td>
      </tr>
      <tr>
        <td valign="middle" style="padding:5px 8px 5px 0; width:16px;">
          <img src="${icons.web}" alt="Web" width="14" height="14" style="display:block; border:0;" />
        </td>
        <td style="padding:5px 0; font-size:12.5px;">
          <span style="color:${GOLD}; font-weight:bold; letter-spacing:0.5px;">WEB&nbsp;&nbsp;</span><a href="https://www.grclass.com" style="color:${BRAND}; text-decoration:none; font-weight:bold;">www.grclass.com</a>
        </td>
      </tr>
    </table>`;

  // Right side signature block (Logo + dynamic CID QR)
  const qrBlock = (size = 95) => `
    <table role="presentation" cellpadding="0" cellspacing="0" align="right">
      <tr>
        <td align="center" style="padding-bottom:20px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:38px; height:38px; background-color:${BRAND}; text-align:center; vertical-align:middle; border-radius:3px;">
                <span style="color:${GOLD}; font-family:Georgia, serif; font-weight:bold; font-size:16px; line-height:38px;">GR</span>
              </td>
              <td style="padding-left:10px; font-size:16px; font-weight:900; color:${BRAND}; letter-spacing: 0.5px;">CLASS</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center" style="border:1px dashed ${GOLD}; padding:10px; background-color:#fafbfc;">
          <img src="cid:grclass-qr" alt="Scan to Verify" width="${size}" height="${size}" style="display:block; border:0; width:${size}px; height:${size}px;" />
          <span style="display:block; font-size:9px; letter-spacing:1px; color:${BRAND}; font-weight:bold; text-transform:uppercase; padding-top:8px;">Scan to Verify</span>
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
    /* Strictly resetting for fixed layout. NO media queries for mobile stacking. */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    html, body { margin:0 !important; padding:0 !important; width:100% !important; background-color:${SOFT}; }
    table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    a { text-decoration: none; }
    a:hover { text-decoration: underline !important; }
  </style>
</head>
<body style="margin:0; padding:0; background-color:${SOFT}; font-family:${FONT};">

  <!-- Preheader -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; font-size:0; color:${SOFT};">
    ${pre} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${SOFT}; padding:32px 0;">
    <tr>
      <td align="center">

        <!-- Main container - strictly fixed at 620px to allow zooming out on mobile -->
        <table role="presentation" width="620" cellpadding="0" cellspacing="0" style="width:620px; max-width:620px; background-color:#ffffff; border:1px solid #d8dde5; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">

          <!-- Top rule -->
          <tr>
            <td style="height:5px; background-color:${GOLD}; font-size:0; line-height:0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding:28px 40px 24px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle" style="width:60%;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:40px; height:40px; background-color:${BRAND}; text-align:center; vertical-align:middle; border-radius:3px;">
                          <span style="color:${GOLD}; font-family:Georgia, 'Times New Roman', serif; font-weight:bold; font-size:17px; line-height:40px;">GR</span>
                        </td>
                        <td style="padding-left:12px;">
                          <span style="display:block; font-size:18px; font-weight:900; color:${BRAND}; letter-spacing:0.5px;">GR CLASS</span>
                          <span style="display:block; font-size:9.5px; color:#8a94a3; letter-spacing:1.5px; text-transform:uppercase; padding-top:2px;">Classification &amp; Certification</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td valign="middle" align="right" style="width:40%;">
                    <table role="presentation" cellpadding="0" cellspacing="0" align="right" style="border:1px solid ${GOLD}; background-color:#fdfbf7;">
                      <tr>
                        <td style="padding:7px 12px;">
                          <span style="display:inline-block; width:6px; height:6px; background-color:${GOLD}; margin-right:7px; border-radius:50%;"></span>
                          <span style="font-size:9px; letter-spacing:1.2px; color:${BRAND}; text-transform:uppercase; font-weight:bold;">Recognized Organization</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Dynamic Body Content Row -->
          <tr>
            <td style="padding:0;">
              ${innerHtml}
            </td>
          </tr>

          <tr><td style="padding:0 40px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid ${LINE}; font-size:0; line-height:0;">&nbsp;</td></tr></table></td></tr>

          <!-- Signature block -->
          <tr>
            <td style="padding:32px 40px 10px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Left: Contact Details -->
                  <td valign="top" style="width:66%;">
                    ${contactBlock}
                  </td>
                  <!-- Right: Logo & QR -->
                  <td valign="top" align="right" style="width:34%;">
                    ${qrBlock(95)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Locations strip -->
          <tr>
            <td style="padding:30px 0 0 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND}; border-top: 3px solid ${GOLD};">
                <tr>
                  <td align="center" style="padding:15px; font-size:11px; letter-spacing:1.5px; color:${GOLD}; text-transform:uppercase; font-weight:bold;">
                    Ajman &nbsp;•&nbsp; Navi Mumbai &nbsp;•&nbsp; Piraeus &nbsp;•&nbsp; Panama
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Privacy notice -->
          <tr>
            <td style="padding:25px 40px 10px 40px; background-color:#f4f6f9;">
              <span style="display:block; font-size:10px; letter-spacing:1.5px; color:${BRAND}; text-transform:uppercase; font-weight:bold; padding-bottom:8px;">Privacy &amp; Confidentiality Notice</span>
              <span style="display:block; font-size:11px; line-height:18px; color:#6b7685;">
                This email and any attachments are confidential and intended solely for the named recipient(s). If you received this message in error, please notify the sender and delete it immediately. Unauthorized disclosure or distribution is strictly prohibited. This bulletin is provided for general guidance only and does not constitute a survey, audit or certification action. Read our
                <a href="https://www.grclass.com/privacy" style="color:${BRAND}; font-weight:bold;">Privacy Policy</a>, <a href="https://www.grclass.com/terms" style="color:${BRAND}; font-weight:bold;">Terms</a> and <a href="https://www.grclass.com/compliance" style="color:${BRAND}; font-weight:bold;">Compliance</a>.
              </span>
              <span style="display:block; font-size:11px; line-height:18px; color:#2e7d32; padding-top:10px; font-style:italic; font-weight:bold;">
                Please consider the environment before printing this email.
              </span>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#081a30;">
                <tr>
                  <td align="center" style="padding:25px 20px 10px 20px;">
                    <a href="#" style="display:inline-block; margin:0 8px;"><img src="${icons.linkedin}" alt="LinkedIn" width="24" height="24" style="display:block; border:0;" /></a>
                    <a href="#" style="display:inline-block; margin:0 8px;"><img src="${icons.twitter}" alt="Twitter" width="24" height="24" style="display:block; border:0;" /></a>
                    <a href="#" style="display:inline-block; margin:0 8px;"><img src="${icons.facebook}" alt="Facebook" width="24" height="24" style="display:block; border:0;" /></a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:10px 20px 15px 20px; font-size:11.5px;">
                    <a href="https://www.grclass.com/about" style="color:#c7cede; text-decoration:none; padding:0 10px; font-weight:bold;">About</a>
                    <span style="color:#3a4b63;">|</span>
                    <a href="https://www.grclass.com/contact" style="color:#c7cede; text-decoration:none; padding:0 10px; font-weight:bold;">Contact</a>
                    <span style="color:#3a4b63;">|</span>
                    <a href="https://www.grclass.com/privacy" style="color:#c7cede; text-decoration:none; padding:0 10px; font-weight:bold;">Privacy</a>
                    <span style="color:#3a4b63;">|</span>
                    <a href="https://www.grclass.com/terms" style="color:#c7cede; text-decoration:none; padding:0 10px; font-weight:bold;">Terms</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:2px 20px 6px 20px; font-size:13px; font-weight:bold; letter-spacing:1px;">
                    <a href="https://www.grclass.com" style="color:#ffffff; text-decoration:none;">www.grclass.com</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:4px 20px 4px 20px; font-size:11px; color:#5b6c85;">
                    © ${year} GR Class. All Rights Reserved.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:12px 30px 30px 30px; font-size:10px; line-height:16px; color:#3f5170;">
                    You are receiving this technical bulletin as a registered maritime professional or GR Class contact. <br>
                    <a href="#" style="color:#7f92b3; text-decoration:underline;">Manage preferences</a> &nbsp;|&nbsp; ${unsubscribeLine}
                  </td>
                </tr>
              </table>
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