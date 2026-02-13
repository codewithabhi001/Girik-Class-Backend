/**
 * Password reset email template.
 * @param {{ userName: string, resetLink: string }} data
 * @returns {{ subject: string, text: string, html: string }}
 */
export const render = (data) => {
    const { userName, resetLink } = data;
    const subject = 'Reset your GIRIK password';
    const text = `Hi ${userName},\n\nYou requested a password reset. Click the link below to set a new password (valid for 1 hour):\n\n${resetLink}\n\nIf you did not request this, please ignore this email.\n\n— GIRIK`;
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Reset password</title></head>
<body style="font-family: sans-serif; line-height: 1.5;">
  <p>Hi ${userName},</p>
  <p>You requested a password reset. Click the link below to set a new password. This link expires in 1 hour.</p>
  <p><a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px;">Reset password</a></p>
  <p>Or copy this link: <br/><a href="${resetLink}">${resetLink}</a></p>
  <p>If you did not request this, please ignore this email.</p>
  <p>— GIRIK</p>
</body>
</html>`;
    return { subject, text, html };
};
