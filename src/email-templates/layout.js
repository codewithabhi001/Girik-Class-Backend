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
      background-color: #f1f5f9;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    
    @media only screen and (max-width: 700px) {
      .container { width: 100% !important; border: none !important; border-radius: 0 !important; }
      .content { padding: 40px 25px !important; }
      .header { padding: 25px 25px !important; }
      .footer-links a { display: block !important; margin: 10px 0 !important; }
      .footer-links span { display: none !important; }
      .header-right { display: none !important; }
    }
  </style>
</head>
<body style="background-color: #f1f5f9; margin: 0; padding: 40px 0;">
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0">${pre}</span>
  <center>
    <!-- MAIN WRAPPER -->
    <table border="0" cellpadding="0" cellspacing="0" width="800" class="container" style="background-color: #ffffff; margin: 0 auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      
      <!-- HEADER -->
      <tr>
        <td class="header" style="background-color: #ffffff; padding: 35px 50px; border-bottom: 2px solid #f1f5f9;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="left" valign="middle">
                <a href="https://grclass.com" target="_blank" style="text-decoration:none;">
                  <img src="https://grclass.com/grclass-logo.webp" alt="GR Class" style="display:block; border:none; outline:none; height:48px; width:auto;" />
                </a>
              </td>
              <td align="right" valign="middle" class="header-right">
                <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">
                  Recognized Organization
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- CONTENT BODY -->
      <tr>
        <td class="content" style="padding: 50px; color: #334155; font-size: 16px; line-height: 1.7;">
          ${innerHtml}
          
          <!-- SPACIOUS SIGNATURE -->
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 40px;">
            <tr>
              <td align="left">
                <div style="font-size: 18px; font-weight: bold; color: #0B2443; margin-bottom: 4px; letter-spacing: -0.02em;">
                  GR Class Administration
                </div>
                <div style="font-size: 13px; color: #B5891F; font-weight: 600; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 0.05em;">
                  Automated Notification System
                </div>
                
                <div style="font-size: 13px; color: #475569; line-height: 1.8;">
                  <strong style="color: #0B2443;">UAE (HQ):</strong> B.C. 1304883, Ajman Free Zone C1 Building, Makani No – 4442612247.<br>
                  <strong style="color: #0B2443;">India:</strong> Office No 6, Hermes Atrium, Sector 11, CBD Belapur, Navi Mumbai.<br>
                  <strong style="color: #0B2443;">Panama:</strong> Edificio Global Plaza, Calle 50, Piso 21, Republic de Panama.
                </div>
                
                <div style="font-size: 13px; color: #475569; margin-top: 20px;">
                  <strong style="color: #0B2443;">Tel:</strong> +971 55 532 4087 &nbsp;&nbsp;|&nbsp;&nbsp; 
                  <strong style="color: #0B2443;">Email:</strong> <a href="mailto:info@grclass.com" style="color: #0B2443; text-decoration: none; font-weight: 500;">info@grclass.com</a> &nbsp;&nbsp;|&nbsp;&nbsp; 
                  <strong style="color: #0B2443;">Web:</strong> <a href="https://grclass.com" style="color: #0B2443; text-decoration: none; font-weight: 500;">grclass.com</a>
                </div>
              </td>
            </tr>
          </table>
          
        </td>
      </tr>

      <!-- FOOTER LINKS & LEGAL -->
      <tr>
        <td style="background-color: #f8fafc; padding: 40px 50px; border-top: 1px solid #e2e8f0; text-align: center;">
          
          <div class="footer-links" style="margin-bottom: 25px;">
            <a href="https://grclass.com/about" style="color: #0B2443; font-size: 12px; text-decoration: none; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">About</a>
            <span style="color: #cbd5e1; margin: 0 15px;">|</span>
            <a href="https://grclass.com/contact" style="color: #0B2443; font-size: 12px; text-decoration: none; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">Contact</a>
            <span style="color: #cbd5e1; margin: 0 15px;">|</span>
            <a href="https://grclass.com/legal/privacy" style="color: #0B2443; font-size: 12px; text-decoration: none; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">Privacy</a>
            <span style="color: #cbd5e1; margin: 0 15px;">|</span>
            <a href="https://grclass.com/legal/terms" style="color: #0B2443; font-size: 12px; text-decoration: none; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">Terms</a>
            <span style="color: #cbd5e1; margin: 0 15px;">|</span>
            <a href="https://grclass.com/legal/compliance" style="color: #0B2443; font-size: 12px; text-decoration: none; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">Compliance</a>
          </div>

          <div style="font-size: 11px; color: #64748b; line-height: 1.6; margin-bottom: 20px;">
            <strong>Privacy and Confidentiality Notice:</strong> This email may contain confidential and privileged information. It is intended solely for the use of the named recipient(s). If you have received this email in error, please notify us immediately and delete it from your system. GR Class is a Recognized Organization committed to strictly avoiding engagement in the inspection and certification process for any entities addressed under International Sanctions by the United Nations.
          </div>

          <p style="margin: 0; font-size: 11px; color: #94a3b8; letter-spacing: 0.05em;">
            © ${new Date().getFullYear()} GR Class. All Rights Reserved.
          </p>

        </td>
      </tr>
    </table>

    <!-- SYSTEM META INFO -->
    <table border="0" cellpadding="0" cellspacing="0" width="800" style="margin-top: 25px; margin-bottom: 40px; max-width: 800px;">
      <tr>
        <td align="center">
          <p style="font-size: 11px; color: #94a3b8; line-height: 1.6; max-width: 600px; text-align: center;">
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
