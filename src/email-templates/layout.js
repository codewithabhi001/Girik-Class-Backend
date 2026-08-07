export const wrapGrclassEmail = ({
  title,
  innerHtml,
  previewText = 'Important update from GR Class'
}) => {
  const safeTitle = title ? title.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'GR Class Notification';
  const pre = previewText.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
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
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      background-color: #f3f4f6;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    
    /* Media queries for clients that support them */
    @media only screen and (max-width: 600px) {
      .container { 
        width: 100% !important; 
        border-radius: 0 !important; 
        border-left: 0 !important;
        border-right: 0 !important;
      }
      .content-padding { padding: 30px 20px !important; }
      .header-padding { padding: 25px 20px !important; }
      .footer-padding { padding: 30px 20px !important; }
      .signature-padding { padding: 25px 20px !important; }
      
      .mobile-stack { 
        display: block !important; 
        width: 100% !important; 
        max-width: 100% !important; 
        text-align: center !important; 
      }
      .mobile-center { text-align: center !important; }
      .mobile-margin-top { margin-top: 25px !important; }
      .hide-mobile { display: none !important; }
      
      .footer-links a { display: inline-block !important; margin: 8px 10px !important; }
      .footer-links span { display: none !important; }
    }
  </style>
</head>
<body style="background-color: #f3f4f6; margin: 0; padding: 0;">
  <!-- PREHEADER TEXT -->
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;line-height:0;">${pre} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</span>
  
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center" valign="top">
        
        <!-- MSO GHOST TABLE FOR OUTLOOK -->
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
        <tr>
        <td align="center" valign="top" width="600">
        <![endif]-->
        
        <!-- MAIN WRAPPER -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="container" style="background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 6px; border-top: 4px solid #0B2443; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);">
          
          <!-- HEADER -->
          <tr>
            <td align="center" class="header-padding" style="background-color: #ffffff; padding: 35px 40px; border-bottom: 1px solid #f3f4f6;">
              <!-- Fluid Header Layout -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" valign="middle" class="mobile-stack mobile-center">
                    <a href="https://grclass.com" target="_blank" style="text-decoration:none;">
                      <img src="https://grclass.com/grclass-logo-transparent.png" alt="GR Class" style="display:inline-block; border:none; outline:none; height:46px; width:auto;" />
                    </a>
                  </td>
                  <td align="right" valign="middle" class="hide-mobile">
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
            <td align="left" class="content-padding" style="padding: 45px 40px 30px 40px; color: #1f2937; font-size: 15px; line-height: 1.7;">
              ${innerHtml}
            </td>
          </tr>

          <!-- SIGNATURE / FOOTER CARD -->
          <tr>
            <td align="center" class="content-padding" style="padding: 0 40px 40px 40px;">
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafafa; border: 1px solid #f3f4f6; border-radius: 8px;">
                <tr>
                  <td align="center" class="signature-padding" style="padding: 30px;">
                    
                    <!-- TWO COLUMN STACK FOR SIGNATURE -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <!-- LEFT SIDE: LOGO & CONTACT -->
                        <td align="left" valign="top" class="mobile-stack mobile-center">
                          <img src="https://grclass.com/grclass-logo-transparent.png" alt="GR Class Logo" class="mobile-center" style="display:block; max-width:130px; height:auto; margin-bottom: 15px;" />
                          <div style="font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 2px; letter-spacing: -0.01em;">
                            GR Class Administration
                          </div>
                          <div style="font-size: 12px; color: #B5891F; font-weight: 600; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.05em;">
                            Automated Notification System
                          </div>
                          
                          <div style="font-size: 13px; color: #4b5563; line-height: 1.8; margin-bottom: 15px;">
                            <strong style="color: #111827;">HQ:</strong> B.C. 1304883, Ajman Free Zone, UAE.<br>
                            <strong style="color: #111827;">India:</strong> CBD Belapur, Navi Mumbai, India.<br>
                            <strong style="color: #111827;">Panama:</strong> Edificio Global Plaza, Republic de Panama.
                          </div>
                          
                          <div style="font-size: 13px; color: #4b5563;">
                            <strong style="color: #111827;">Tel:</strong> +971 55 532 4087 &nbsp;|&nbsp; 
                            <strong style="color: #111827;">Email:</strong> <a href="mailto:info@grclass.com" style="color: #0B2443; text-decoration: none; font-weight: 600;">info@grclass.com</a>
                          </div>
                        </td>

                        <!-- RIGHT SIDE: QR CODE -->
                        <!-- Wrap in a fixed width block that will drop down if screen is too small -->
                        <td align="right" valign="top" class="mobile-stack mobile-center mobile-margin-top" width="110">
                          <!--[if (gte mso 9)|(IE)]>
                          <table align="right" border="0" cellspacing="0" cellpadding="0" width="110"><tr><td align="right">
                          <![endif]-->
                          <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td align="center">
                                <div style="background-color: #ffffff; padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=https://grclass.com" alt="Verify QR Code" width="90" style="display: block; max-width: 90px; height: auto;" />
                                </div>
                                <div style="font-size: 10px; color: #9ca3af; font-weight: 700; margin-top: 8px; text-align: center; text-transform: uppercase; letter-spacing: 0.1em;">
                                  Scan to Verify
                                </div>
                              </td>
                            </tr>
                          </table>
                          <!--[if (gte mso 9)|(IE)]>
                          </td></tr></table>
                          <![endif]-->
                        </td>
                      </tr>
                    </table>
                    <!-- END TWO COLUMN STACK -->
                    
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>

          <!-- BOTTOM LEGAL LINKS -->
          <tr>
            <td align="center" class="footer-padding" style="background-color: #ffffff; padding: 0 40px 40px 40px; text-align: center;">
              
              <div class="footer-links" style="margin-bottom: 25px;">
                <a href="https://grclass.com/about" style="color: #6b7280; font-size: 12px; text-decoration: none; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">About</a>
                <span style="color: #e5e7eb; margin: 0 8px;">|</span>
                <a href="https://grclass.com/contact" style="color: #6b7280; font-size: 12px; text-decoration: none; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">Contact</a>
                <span style="color: #e5e7eb; margin: 0 8px;">|</span>
                <a href="https://grclass.com/legal/privacy" style="color: #6b7280; font-size: 12px; text-decoration: none; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">Privacy</a>
                <span style="color: #e5e7eb; margin: 0 8px;">|</span>
                <a href="https://grclass.com/legal/terms" style="color: #6b7280; font-size: 12px; text-decoration: none; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">Terms</a>
                <span style="color: #e5e7eb; margin: 0 8px;">|</span>
                <a href="https://grclass.com/legal/compliance" style="color: #6b7280; font-size: 12px; text-decoration: none; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">Compliance</a>
              </div>

              <div style="font-size: 11px; color: #9ca3af; line-height: 1.6; margin-bottom: 20px; max-width: 500px; margin-left: auto; margin-right: auto;">
                <strong>Privacy and Confidentiality Notice:</strong> This email may contain confidential and privileged information. It is intended solely for the use of the named recipient(s). If you have received this email in error, please notify us immediately and delete it from your system. GR Class is a Recognized Organization committed to strictly avoiding engagement in the inspection and certification process for any entities addressed under International Sanctions by the United Nations.
              </div>

              <div style="font-size: 11px; color: #4b5563; font-weight: 500;">
                © ${new Date().getFullYear()} GR Class. All Rights Reserved.
              </div>

            </td>
          </tr>
        </table>
        
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
        
        <!-- SYSTEM META INFO -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 20px; margin-bottom: 40px; max-width: 600px;">
          <tr>
            <td align="center" style="padding: 0 20px;">
              <p style="font-size: 11px; color: #9ca3af; line-height: 1.6; text-align: center;">
                This is an automated diagnostic message from the GR Class Notification System.<br>
                Please do not reply directly to this email address.
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
