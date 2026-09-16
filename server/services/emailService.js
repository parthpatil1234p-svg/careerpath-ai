/**
 * services/emailService.js — Automated Email Delivery for OTP Verification
 * Uses Nodemailer with Gmail SMTP.
 * Team 404 Brain Not Found · Hack2Ignite 2026–27
 */

const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass, // Google 16-character App Password
    },
  });

  return transporter;
}

/**
 * Sends a high-tech verification email containing the 6-digit OTP code
 * @param {string} toEmail - Recipient's email address
 * @param {string} name - Recipient's name
 * @param {string} otpCode - 6-digit numeric verification code
 */
async function sendOtpEmail(toEmail, name, otpCode) {
  const mailer = getTransporter();

  if (!mailer) {
    console.warn(`\n⚠️  [EMAIL CONFIG WARNING] EMAIL_USER or EMAIL_PASS not configured in .env.`);
    console.warn(`   👉 Add your Gmail & 16-digit Google App Password to .env to deliver real emails.`);
    console.log(`   🔑 [Console Backup] OTP Code for ${toEmail}: ${otpCode}\n`);
    return { success: false, reason: 'unconfigured' };
  }

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0A0F1D; color: #E2E8F0; margin: 0; padding: 20px; }
      .container { max-width: 520px; margin: 0 auto; background: #101828; border: 1px solid #1E293B; border-radius: 12px; padding: 32px; box-shadow: 0 8px 30px rgba(0,0,0,0.5); }
      .brand { display: flex; align-items: center; gap: 8px; font-size: 20px; font-weight: 700; color: #FFFFFF; margin-bottom: 24px; }
      .brand span { color: #00F2FE; }
      .title { font-size: 22px; font-weight: 700; color: #FFFFFF; margin-bottom: 12px; }
      .desc { font-size: 14px; line-height: 1.6; color: #94A3B8; margin-bottom: 24px; }
      .otp-box { background: rgba(0, 242, 254, 0.08); border: 2px dashed #00F2FE; border-radius: 10px; text-align: center; padding: 20px; margin-bottom: 24px; }
      .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #00F2FE; margin: 0; }
      .expiry { font-size: 12px; color: #64748B; margin-top: 8px; }
      .footer { border-top: 1px solid #1E293B; padding-top: 16px; font-size: 12px; color: #64748B; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="brand">
        🧭 CareerPath <span>AI</span>
      </div>
      <div class="title">Verify Your Student Account</div>
      <p class="desc">
        Hi <strong>${name || 'Student'}</strong>,<br>
        Thank you for joining CareerPath AI. Use the verification code below to activate your account and start your structured career assessment:
      </p>
      
      <div class="otp-box">
        <div class="otp-code">${otpCode}</div>
        <div class="expiry">Valid for 10 minutes · Do not share this code with anyone</div>
      </div>

      <p class="desc" style="font-size: 13px;">
        If you did not request this verification code, you can safely ignore this email.
      </p>

      <div class="footer">
        CareerPath AI · Team 404 Brain Not Found · Hack2Ignite 2026–27
      </div>
    </div>
  </body>
  </html>
  `;

  try {
    const info = await mailer.sendMail({
      from: `"CareerPath AI" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `🔐 ${otpCode} is your CareerPath AI verification code`,
      html: htmlContent,
      text: `Your CareerPath AI verification code is: ${otpCode}. It is valid for 10 minutes.`,
    });

    console.log(`\n📧 [EMAIL SENT] OTP successfully sent to ${toEmail} (Message ID: ${info.messageId})\n`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`\n❌ [EMAIL SEND ERROR] Could not send email to ${toEmail}: ${err.message}`);
    console.log(`   🔑 [Console Backup] OTP Code for ${toEmail}: ${otpCode}\n`);
    return { success: false, error: err.message };
  }
}

module.exports = { sendOtpEmail };
