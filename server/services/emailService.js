/**
 * services/emailService.js — High-Reliability Email Delivery for OTP Verification
 * Uses Nodemailer with direct Gmail SMTP (Port 465 SSL with Port 587 STARTTLS Fallback).
 * Anti-Spam Optimized: Clean headers, no trigger emojis, RFC compliance.
 * CareerPath AI · Enterprise Backend Service
 */

const nodemailer = require('nodemailer');

function createTransporter(port = 465, secure = true) {
  const emailUser = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '';
  const emailPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '';

  if (!emailUser || !emailPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port,
    secure,
    auth: {
      user: emailUser,
      pass: emailPass, // Google 16-character App Password
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Sends a high-deliverability verification email containing the 6-digit OTP code.
 * Optimized against spam heuristics: clean subject, priority headers, and plain-text fallback.
 *
 * @param {string} toEmail - Recipient's email address
 * @param {string} name - Recipient's name
 * @param {string} otpCode - 6-digit numeric verification code
 * @returns {Promise<{success: boolean, messageId?: string, error?: string, reason?: string}>}
 */
async function sendOtpEmail(toEmail, name, otpCode) {
  const emailUser = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '';
  const emailPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '';

  if (!emailUser || !emailPass) {
    console.warn(`\n⚠️  [EMAIL CONFIG WARNING] EMAIL_USER or EMAIL_PASS not configured in .env.`);
    console.warn(`   👉 Add your Gmail & 16-digit Google App Password to .env to deliver real emails.`);
    console.log(`   🔑 [Console Backup] OTP Code for ${toEmail}: ${otpCode}\n`);
    return { success: false, reason: 'unconfigured' };
  }

  const recipientName = name ? name.trim() : 'Student';
  const cleanSubject = `CareerPath AI Account Verification Code: ${otpCode}`;

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CareerPath AI Verification Code</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; color: #0F172A; margin: 0; padding: 24px 16px; }
      .container { max-width: 520px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 32px 28px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
      .brand { font-size: 20px; font-weight: 800; color: #3B1A6E; margin-bottom: 20px; letter-spacing: -0.5px; }
      .brand span { color: #0D9488; }
      .title { font-size: 20px; font-weight: 700; color: #1E293B; margin-bottom: 12px; }
      .desc { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 22px; }
      .otp-card { background: #F8F7FC; border: 2px dashed #3B1A6E; border-radius: 10px; text-align: center; padding: 22px 16px; margin-bottom: 22px; }
      .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #3B1A6E; margin: 0; }
      .expiry { font-size: 12px; color: #64748B; margin-top: 8px; font-weight: 500; }
      .notice-box { background: #FEF3C7; border-left: 4px solid #D97706; padding: 10px 14px; font-size: 12px; color: #92400E; border-radius: 4px; margin-bottom: 20px; line-height: 1.5; }
      .footer { border-top: 1px solid #E2E8F0; padding-top: 18px; font-size: 11.5px; color: #94A3B8; text-align: center; line-height: 1.5; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="brand">
        CareerPath <span>AI</span>
      </div>
      <div class="title">Verify Your CareerPath AI Account</div>
      <p class="desc">
        Hi <strong>${recipientName}</strong>,<br>
        Welcome to CareerPath AI. Please enter the 6-digit verification code below to activate your account and start your personalized career assessment:
      </p>
      
      <div class="otp-card">
        <div class="otp-code">${otpCode}</div>
        <div class="expiry">Valid for 10 minutes · Do not share this code with anyone</div>
      </div>

      <div class="notice-box">
        <strong>💡 Note:</strong> If this email appears in your Spam or Junk folder, please click <strong>"Report Not Spam"</strong> to ensure you receive future assessment updates and placement alerts.
      </div>

      <p class="desc" style="font-size: 13px; color: #64748B; margin-bottom: 20px;">
        If you did not request this verification code, please ignore this email. No changes will be made to your account.
      </p>

      <div class="footer">
        CareerPath AI Technologies Inc. · Next-Gen Career Navigation Platform<br>
        Autonomous Career GPS &amp; Verified Talent Operating System
      </div>
    </div>
  </body>
  </html>
  `;

  const textContent = `
CareerPath AI - Account Verification Code

Hi ${recipientName},

Your 6-digit verification code is: ${otpCode}

This code is valid for 10 minutes. Please enter it to activate your CareerPath AI account.

If you did not request this code, you can safely ignore this email.

--
CareerPath AI Technologies Inc. · Next-Gen Career Navigation Platform
Autonomous Career GPS & Verified Talent Operating System
`;

  const mailOptions = {
    from: `"CareerPath AI" <${emailUser}>`,
    to: toEmail,
    replyTo: emailUser,
    subject: cleanSubject,
    html: htmlContent,
    text: textContent,
    priority: 'high',
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high',
    },
  };

  // Attempt 1: Port 465 (SSL Direct)
  try {
    const transporter465 = createTransporter(465, true);
    if (!transporter465) {
      throw new Error('Transporter configuration failed');
    }
    const info = await transporter465.sendMail(mailOptions);
    console.log(`\n📧 [EMAIL SENT - Port 465] OTP successfully delivered to ${toEmail} (ID: ${info.messageId})\n`);
    return { success: true, messageId: info.messageId };
  } catch (err465) {
    console.warn(`\n⚠️  [PORT 465 FAILED] Attempting Port 587 STARTTLS failover: ${err465.message}`);

    // Attempt 2: Port 587 (STARTTLS Failover)
    try {
      const transporter587 = createTransporter(587, false);
      if (!transporter587) {
        throw new Error('Port 587 transporter configuration failed');
      }
      const info = await transporter587.sendMail(mailOptions);
      console.log(`\n📧 [EMAIL SENT - Port 587] OTP successfully delivered to ${toEmail} (ID: ${info.messageId})\n`);
      return { success: true, messageId: info.messageId };
    } catch (err587) {
      console.error(`\n❌ [EMAIL SEND ERROR] Both ports (465 & 587) failed for ${toEmail}: ${err587.message}`);
      console.log(`   🔑 [Console Backup] OTP Code for ${toEmail}: ${otpCode}\n`);
      return { success: false, error: err587.message, code: err587.code };
    }
  }
}

module.exports = { sendOtpEmail };
