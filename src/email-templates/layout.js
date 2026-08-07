export const wrapGrclassEmail = ({
  title,
  innerHtml,
  previewText = 'Important update from GR Class'
}) => {
  const safeTitle = title ? title.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'GR Class Notification';
  const pre = previewText.replace(/</g, '&lt;').replace(/>/g, '&gt;');

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
      background-color: #f4f6f8;
      font-family: Arial, sans-serif;
    }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    
    /* Responsive stacking for smaller screens */
    @media only screen and (max-width: 700px) {
      .container { width: 100% !important; border: none !important; }
      .content { padding: 30px 20px !important; }
      .header { padding: 25px 20px !important; }
      .footer-cell { display: block !important; width: 100% !important; text-align: center !important; border-right: none !important; padding-right: 0 !important; padding-left: 0 !important; padding-bottom: 20px !important; }
      .footer-contact table { margin: 0 auto !important; text-align: left !important; }
      .qr-block { margin: 0 auto !important; padding-top: 10px !important; }
      .logo-block { padding-bottom: 25px !important; border-bottom: 1px solid #e2e8f0 !important; margin-bottom: 20px !important; }
      .hide-mobile { display: none !important; }
    }
  </style>
</head>
<body style="background-color: #f4f6f8; margin: 0; padding: 40px 0;">
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0">${pre}</span>
  <center>
    <!-- MAIN WRAPPER -->
    <table border="0" cellpadding="0" cellspacing="0" width="800" class="container" style="background-color: #ffffff; border: 1px solid #e2e8f0; margin: 0 auto;">
      
      <!-- HEADER -->
      <tr>
        <td align="left" class="header" style="background-color: #ffffff; padding: 30px 50px; border-bottom: 3px solid #B5891F;">
          <a href="https://grclass.com" target="_blank" style="text-decoration:none;">
            <img src="https://grclass.com/grclass-logo.webp" alt="GR Class" style="display:block; border:none; outline:none; height:50px; width:auto;" />
          </a>
        </td>
      </tr>

      <!-- CONTENT BODY -->
      <tr>
        <td class="content" style="padding: 50px 50px 40px 50px; color: #334155; font-size: 15px; line-height: 1.6;">
          ${innerHtml}
        </td>
      </tr>

      <!-- SIGNATURE / FOOTER -->
      <tr>
        <td style="padding: 0 50px 50px 50px;">
          
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top: 2px solid #f1f5f9; padding-top: 35px;">
            <tr>
              <!-- LEFT SIDE: LOGO -->
              <td class="footer-cell logo-block" width="220" valign="top" style="padding-right: 25px; border-right: 2px solid #0B2443; text-align: left;">
                <img src="https://grclass.com/grclass-logo.webp" alt="GR Class Logo" width="140" style="max-width: 140px; height: auto; display: block; margin-bottom: 15px;">
                <div style="background-color: #0B2443; color: #ffffff; font-size: 11px; font-weight: bold; padding: 6px 8px; text-transform: uppercase; display: inline-block; letter-spacing: 0.05em;">
                  GR CLASS
                </div>
                <div style="font-size: 10px; color: #B5891F; font-weight: bold; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.02em;">
                  Classified for Standards
                </div>
                <div style="font-size: 9px; color: #64748b; margin-top: 4px; text-transform: uppercase;">
                  Recognized Organization (RO)
                </div>
              </td>

              <!-- MIDDLE SIDE: CONTACT INFO -->
              <td class="footer-cell footer-contact" valign="top" style="padding-left: 25px; padding-right: 15px;">
                <div style="font-size: 18px; font-weight: bold; color: #0B2443; margin-bottom: 4px;">
                  GR Class Administration
                </div>
                <div style="font-size: 12px; font-weight: bold; color: #B5891F; margin-bottom: 18px; text-transform: uppercase; letter-spacing: 0.05em;">
                  Automated Notification System
                </div>
                
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size: 11px; color: #475569; line-height: 1.5;">
                  <tr>
                    <td width="60" valign="top" style="color: #0B2443; font-weight: bold; padding-bottom: 8px;">HQ:</td>
                    <td valign="top" style="padding-bottom: 8px;">
                      B.C. 1304883, Ajman Free Zone C1 Building, Ajman District Business, Makani No – 4442612247, UAE.
                    </td>
                  </tr>
                  <tr>
                    <td width="60" valign="top" style="color: #0B2443; font-weight: bold; padding-bottom: 8px;">India:</td>
                    <td valign="top" style="padding-bottom: 8px;">
                      Office No - 6, Hermes Atrium, Sector -11, CBD Belapur, Navi Mumbai, Maharashtra, India.
                    </td>
                  </tr>
                  <tr>
                    <td width="60" valign="top" style="color: #0B2443; font-weight: bold; padding-bottom: 12px;">Panama:</td>
                    <td valign="top" style="padding-bottom: 12px;">
                      Edificio Global Plaza, Calle 50, Piso 21, Republic de Panama.
                    </td>
                  </tr>
                  <tr>
                    <td width="60" valign="top" style="color: #0B2443; font-weight: bold; padding-bottom: 6px;">Tel:</td>
                    <td valign="top" style="padding-bottom: 6px;">
                      +971 55 532 4087
                    </td>
                  </tr>
                  <tr>
                    <td width="60" valign="top" style="color: #0B2443; font-weight: bold; padding-bottom: 6px;">Email:</td>
                    <td valign="top" style="padding-bottom: 6px;">
                      <a href="mailto:info@grclass.com" style="color: #0B2443; text-decoration: none; font-weight: 600;">info@grclass.com</a> &nbsp;<span class="hide-mobile">|</span>&nbsp; 
                      <a href="mailto:operation@grclass.com" style="color: #0B2443; text-decoration: none; font-weight: 600;">operation@grclass.com</a>
                    </td>
                  </tr>
                  <tr>
                    <td width="60" valign="top" style="color: #0B2443; font-weight: bold;">Web:</td>
                    <td valign="top">
                      <a href="https://grclass.com" style="color: #0B2443; text-decoration: none; font-weight: bold;">www.grclass.com</a>
                    </td>
                  </tr>
                </table>
              </td>

              <!-- RIGHT SIDE: QR CODE -->
              <td class="footer-cell qr-block" width="90" valign="bottom" style="text-align: right;">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=https://grclass.com" alt="Website QR Code" width="90" style="max-width: 90px; height: auto; border: 1px solid #cbd5e1; padding: 4px; background-color: #ffffff;">
                <div style="font-size: 9px; color: #0B2443; font-weight: bold; margin-top: 6px; text-align: center; text-transform: uppercase; letter-spacing: 0.05em;">
                  Website
                </div>
              </td>
            </tr>
          </table>

          <!-- REGIONAL LOCATIONS BAR -->
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 30px;">
            <tr>
              <td style="background-color: #f8fafc; color: #334155; font-size: 11px; font-weight: bold; text-align: center; padding: 12px; border-bottom: 3px solid #B5891F; border-top: 1px solid #e2e8f0; letter-spacing: 0.05em; text-transform: uppercase;">
                UAE &nbsp;&nbsp;&bull;&nbsp;&nbsp; India &nbsp;&nbsp;&bull;&nbsp;&nbsp; Greece &nbsp;&nbsp;&bull;&nbsp;&nbsp; Panama &nbsp;&nbsp;&bull;&nbsp;&nbsp; Singapore &nbsp;&nbsp;&bull;&nbsp;&nbsp; Turkey
              </td>
            </tr>
          </table>

          <!-- PRIVACY NOTICE -->
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 15px;">
            <tr>
              <td style="font-size: 10px; color: #64748b; line-height: 1.5; text-align: justify;">
                <strong>Privacy and Confidentiality Notice:</strong> This email may contain confidential and privileged information. It is intended solely for the use of the named recipient(s). If you are not an intended recipient, you must not distribute, copy, or disclose the information herein, nor should you act in reliance upon it. If you have received this email in error, please notify us immediately at the email address above and delete it from your system. GR Class is a Recognized Organization committed to strictly avoiding engagement in the inspection and certification process for any entities addressed under International Sanctions by the United Nations. Please consider the environment before printing this email.
              </td>
            </tr>
          </table>

        </td>
      </tr>

      <!-- FOOTER LINKS (LEGAL) -->
      <tr>
        <td align="center" style="background-color: #f8fafc; padding: 25px 50px; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 11px; color: #64748b; letter-spacing: 0.1em; font-weight: 700; text-transform: uppercase; margin-bottom: 12px;">
            © ${new Date().getFullYear()} GR Class. All Rights Reserved.
          </p>
          <div>
            <a href="https://grclass.com/legal/privacy" style="color: #0B2443; font-size: 11px; text-decoration: none; margin: 0 12px; font-weight: 600;">Privacy Policy</a>
            <span style="color: #cbd5e1; font-size: 11px;">|</span>
            <a href="https://grclass.com/legal/terms" style="color: #0B2443; font-size: 11px; text-decoration: none; margin: 0 12px; font-weight: 600;">Terms of Service</a>
            <span style="color: #cbd5e1; font-size: 11px;">|</span>
            <a href="https://grclass.com/legal/compliance" style="color: #0B2443; font-size: 11px; text-decoration: none; margin: 0 12px; font-weight: 600;">Compliance</a>
          </div>
        </td>
      </tr>
    </table>

    <!-- SYSTEM META INFO -->
    <table border="0" cellpadding="0" cellspacing="0" width="800" style="margin-top: 25px; margin-bottom: 40px; max-width: 800px;">
      <tr>
        <td align="center">
          <p style="font-size: 11px; color: #94a3b8; line-height: 1.6; max-width: 600px; text-align: center;">
            You are receiving this automated diagnostic message because you are a registered professional on the GR Class Maritime Portal.<br>
            Please do not reply directly to this automated email address.
          </p>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`;
};

export const wrapEmailHtml = (opts) => wrapGrclassEmail(opts);

export const escapeHtml = (unsafe) => {
  if (!unsafe) return '';
  return unsafe
      .toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
};
