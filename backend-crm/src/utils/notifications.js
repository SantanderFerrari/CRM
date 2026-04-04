/**
 * Notification service — sends OTPs via email or SMS.
 *
 * Currently logs to console so you can test without a provider.
 * To go live, swap the console.log lines with real provider calls:
 *
 * EMAIL: Nodemailer + SMTP, SendGrid, Resend, etc.
 * SMS:   Africa's Talking (recommended for Kenya), Twilio, etc.
 */

const sendOtpEmail = async ({ email, otp, name }) => {
  // ── TODO: replace with real email provider ──────────────────────────
  // Example with Nodemailer:
  //   await transporter.sendMail({
  //     to: email,
  //     subject: 'Your CRM Password Reset OTP',
  //     text: `Hi ${name}, your OTP is: ${otp}. It expires in 10 minutes.`,
  //   });
  // ────────────────────────────────────────────────────────────────────
  console.log(`\n📧 [OTP EMAIL] To: ${email} | Name: ${name} | OTP: ${otp}\n`);
};

const sendOtpSms = async ({ phone, otp, name }) => {
  // ── TODO: replace with real SMS provider ────────────────────────────
  // Example with Africa's Talking:
  //   const AT = require('africastalking')({ apiKey, username });
  //   await AT.SMS.send({ to: [phone], message: `CRM OTP: ${otp}. Expires in 10 mins.` });
  // ────────────────────────────────────────────────────────────────────
  console.log(`\n📱 [OTP SMS]   To: ${phone} | Name: ${name} | OTP: ${otp}\n`);
};

module.exports = { sendOtpEmail, sendOtpSms };