const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db     = require('../../db');
const { sendOtpEmail, sendOtpSms } = require('../../utils/notifications');

const BCRYPT_ROUNDS   = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
const OTP_EXPIRY_MINS = 10;

// ── Generate a 6-digit OTP ─────────────────────────────────────────────────
const generateOtp = () =>
  String(crypto.randomInt(100000, 999999));

// ── Request OTP (by email or phone) ──────────────────────────────────────
const requestOtp = async ({ email, phone }) => {
  if (!email && !phone) {
    throw { status: 400, message: 'Provide either email or phone number.' };
  }

  // Find user by email or phone
  let userRow;
  if (email) {
    const { rows } = await db.query(
      `SELECT user_id, name, email, phone FROM users
       WHERE email = $1 AND is_active = TRUE`,
      [email.toLowerCase().trim()]
    );
    userRow = rows[0];
  } else {
    const { rows } = await db.query(
      `SELECT user_id, name, email, phone FROM users
       WHERE phone = $1 AND is_active = TRUE`,
      [phone.trim()]
    );
    userRow = rows[0];
  }

  // Always return success even if user not found — prevents user enumeration
  if (!userRow) {
    console.log(`[Password Reset] No active user found for ${email || phone}`);
    return { message: 'If that account exists, an OTP has been sent.' };
  }

  // Invalidate any existing unused OTPs for this user
  await db.query(
    `UPDATE password_reset_otps SET used = TRUE
     WHERE user_id = $1 AND used = FALSE`,
    [userRow.user_id]
  );

  // Generate OTP and hash it before storing
  const otp      = generateOtp();
  const otpHash  = await bcrypt.hash(otp, 10); // lower rounds — OTPs are short-lived
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINS * 60 * 1000);

  await db.query(
    `INSERT INTO password_reset_otps (user_id, otp_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userRow.user_id, otpHash, expiresAt]
  );

  // Send via appropriate channel
  if (email) {
    await sendOtpEmail({ email: userRow.email, otp, name: userRow.name });
  } else {
    await sendOtpSms({ phone: userRow.phone, otp, name: userRow.name });
  }

  return { message: 'If that account exists, an OTP has been sent.' };
};

// ── Verify OTP + reset password ───────────────────────────────────────────
const resetPassword = async ({ email, phone, otp, newPassword }) => {
  if (!email && !phone) {
    throw { status: 400, message: 'Provide either email or phone number.' };
  }
  if (!otp)         throw { status: 400, message: 'OTP is required.' };
  if (!newPassword) throw { status: 400, message: 'New password is required.' };

  // Find user
  let userRow;
  if (email) {
    const { rows } = await db.query(
      `SELECT user_id FROM users WHERE email = $1 AND is_active = TRUE`,
      [email.toLowerCase().trim()]
    );
    userRow = rows[0];
  } else {
    const { rows } = await db.query(
      `SELECT user_id FROM users WHERE phone = $1 AND is_active = TRUE`,
      [phone.trim()]
    );
    userRow = rows[0];
  }

  if (!userRow) {
    throw { status: 400, message: 'Invalid or expired OTP.' };
  }

  // Fetch latest valid OTP for this user
  const { rows: otpRows } = await db.query(
    `SELECT otp_id, otp_hash FROM password_reset_otps
     WHERE user_id = $1
       AND used      = FALSE
       AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [userRow.user_id]
  );

  if (!otpRows.length) {
    throw { status: 400, message: 'Invalid or expired OTP.' };
  }

  // Verify OTP against stored hash
  const valid = await bcrypt.compare(otp, otpRows[0].otp_hash);
  if (!valid) {
    throw { status: 400, message: 'Invalid or expired OTP.' };
  }

  // Mark OTP as used
  await db.query(
    `UPDATE password_reset_otps SET used = TRUE WHERE otp_id = $1`,
    [otpRows[0].otp_id]
  );

  // Hash and save new password
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await db.query(
    `UPDATE users SET password_hash = $1 WHERE user_id = $2`,
    [passwordHash, userRow.user_id]
  );

  // Revoke all refresh tokens — force re-login on all devices
  await db.query(
    `UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1`,
    [userRow.user_id]
  );

  return { message: 'Password reset successfully. Please log in with your new password.' };
};

module.exports = { requestOtp, resetPassword };