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
      background-color: #f3f4f6;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    
    @media only screen and (max-width: 700px) {
      .container { width: 100% !important; border: none !important; border-radius: 0 !important; }
      .content { padding: 30px 20px !important; }
      .header { padding: 25px 20px !important; }
      .footer-links a { display: inline-block !important; margin: 8px 10px !important; }
      .footer-links span { display: none !important; }
      .header-right { display: none !important; }
      .signature-card { display: block !important; width: 100% !important; text-align: center !important; }
      .signature-logo { margin: 0 auto 20px auto !important; }
      .signature-qr { margin-top: 20px !important; text-align: center !important; display: block !important; }
    }
  </style>
</head>
<body style="background-color: #f3f4f6; margin: 0; padding: 40px 0;">
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0">${pre}</span>
  <center>
    <!-- MAIN WRAPPER -->
    <table border="0" cellpadding="0" cellspacing="0" width="800" class="container" style="background-color: #ffffff; margin: 0 auto; border-radius: 6px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); border-top: 4px solid #0B2443;">
      
      <!-- HEADER -->
      <tr>
        <td class="header" style="background-color: #ffffff; padding: 35px 50px; border-bottom: 1px solid #f3f4f6;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="left" valign="middle">
                <a href="https://grclass.com" target="_blank" style="text-decoration:none;">
                  <img src="https://grclass.com/grclass-logo-transparent.png" alt="GR Class" style="display:block; border:none; outline:none; height:46px; width:auto;" />
                </a>
              </td>
              <td align="right" valign="middle" class="header-right">
                <div style="font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 600;">
                  Recognized Organization
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- CONTENT BODY -->
      <tr>
        <td class="content" style="padding: 45px 50px 30px 50px; color: #1f2937; font-size: 15px; line-height: 1.7;">
          ${innerHtml}
        </td>
      </tr>

      <!-- SIGNATURE / FOOTER -->
      <tr>
        <td style="padding: 0 50px 50px 50px;">
          <!-- Elegant Signature Card -->
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafafa; border: 1px solid #f3f4f6; border-radius: 8px; padding: 30px;">
            <tr>
              <td style="padding: 30px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <!-- LOGO AND ADMIN TEXT -->
                    <td class="signature-card" align="left" valign="top">
                      <img src="https://grclass.com/grclass-logo-transparent.png" alt="GR Class Logo" class="signature-logo" style="display:block; max-width:130px; height:auto; margin-bottom: 15px;" />
                      <div style="font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 2px; letter-spacing: -0.01em;">
                        GR Class Administration
                      </div>
                      <div style="font-size: 12px; color: #B5891F; font-weight: 600; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.05em;">
                        Automated Notification System
                      </div>
                      
                      <div style="font-size: 13px; color: #4b5563; line-height: 1.8;">
                        <strong style="color: #111827;">HQ:</strong> B.C. 1304883, Ajman Free Zone C1 Building, UAE.<br>
                        <strong style="color: #111827;">India:</strong> Hermes Atrium, Sector 11, CBD Belapur, Navi Mumbai.<br>
                        <strong style="color: #111827;">Panama:</strong> Edificio Global Plaza, Calle 50, Piso 21, Republic de Panama.
                      </div>
                      
                      <div style="font-size: 13px; color: #4b5563; margin-top: 15px;">
                        <strong style="color: #111827;">Tel:</strong> +971 55 532 4087 &nbsp;&nbsp;|&nbsp;&nbsp; 
                        <strong style="color: #111827;">Email:</strong> <a href="mailto:info@grclass.com" style="color: #0B2443; text-decoration: none; font-weight: 600;">info@grclass.com</a>
                      </div>
                    </td>

                    <!-- QR CODE -->
                    <td class="signature-card signature-qr" align="right" valign="top" width="110">
                      <div style="background-color: #ffffff; padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=https://grclass.com" alt="Verify QR Code" width="90" style="display: block; max-width: 90px; height: auto;" />
                      </div>
                      <div style="font-size: 10px; color: #9ca3af; font-weight: 700; margin-top: 8px; text-align: center; text-transform: uppercase; letter-spacing: 0.1em;">
                        Scan to Verify
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          
        </td>
      </tr>

      <!-- BOTTOM LEGAL LINKS -->
      <tr>
        <td style="background-color: #ffffff; padding: 0 50px 40px 50px; text-align: center;">
          
          <div class="footer-links" style="margin-bottom: 25px;">
            <a href="https://grclass.com/about" style="color: #6b7280; font-size: 12px; text-decoration: none; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">About</a>
            <span style="color: #e5e7eb; margin: 0 12px;">|</span>
            <a href="https://grclass.com/contact" style="color: #6b7280; font-size: 12px; text-decoration: none; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">Contact</a>
            <span style="color: #e5e7eb; margin: 0 12px;">|</span>
            <a href="https://grclass.com/legal/privacy" style="color: #6b7280; font-size: 12px; text-decoration: none; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">Privacy</a>
            <span style="color: #e5e7eb; margin: 0 12px;">|</span>
            <a href="https://grclass.com/legal/terms" style="color: #6b7280; font-size: 12px; text-decoration: none; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">Terms</a>
            <span style="color: #e5e7eb; margin: 0 12px;">|</span>
            <a href="https://grclass.com/legal/compliance" style="color: #6b7280; font-size: 12px; text-decoration: none; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">Compliance</a>
          </div>

          <div style="font-size: 11px; color: #9ca3af; line-height: 1.6; margin-bottom: 20px; max-width: 600px; margin-left: auto; margin-right: auto;">
            <strong>Privacy and Confidentiality Notice:</strong> This email may contain confidential and privileged information. It is intended solely for the use of the named recipient(s). If you have received this email in error, please notify us immediately and delete it from your system. GR Class is a Recognized Organization committed to strictly avoiding engagement in the inspection and certification process for any entities addressed under International Sanctions by the United Nations.
          </div>

          <div style="font-size: 11px; color: #4b5563; font-weight: 500;">
            © ${new Date().getFullYear()} GR Class. All Rights Reserved.
          </div>

        </td>
      </tr>
    </table>

    <!-- SYSTEM META INFO -->
    <table border="0" cellpadding="0" cellspacing="0" width="800" style="margin-top: 20px; margin-bottom: 40px; max-width: 800px;">
      <tr>
        <td align="center">
          <p style="font-size: 11px; color: #9ca3af; line-height: 1.6; max-width: 600px; text-align: center;">
            This is an automated diagnostic message from the GR Class Notification System.<br>
            Please do not reply directly to this email address.
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
