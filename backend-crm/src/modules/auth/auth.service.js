const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../../db');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshTokenExpiresAt,
} = require('../../utils/jwt');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;

// ── Register ────────────────────────────────────────────────────────────────
const register = async ({ name, email, password, role }) => {
  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const { rows } = await db.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING user_id, name, email, role, is_active, created_at`,
    [name, email, password_hash, role]
  );
  return rows[0];
};

// ── Login ───────────────────────────────────────────────────────────────────
const login = async ({ email, password }) => {
  const { rows } = await db.query(
    `SELECT user_id, name, email, role, is_active, password_hash
     FROM users WHERE email = $1`,
    [email]
  );

  const user = rows[0];
  if (!user) throw { status: 401, message: 'Invalid email or password.' };
  if (!user.is_active) throw { status: 403, message: 'Account is deactivated.' };

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw { status: 401, message: 'Invalid email or password.' };

  const payload = {
    user_id: user.user_id,
    name:    user.name,
    email:   user.email,
    role:    user.role,
  };

  const accessToken  = signAccessToken(payload);
  const refreshToken = signRefreshToken(user.user_id);

  // Persist refresh token
  await db.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)`,
    [user.user_id, refreshToken, refreshTokenExpiresAt()]
  );

  return {
    accessToken,
    refreshToken,
    user: { user_id: user.user_id, name: user.name, email: user.email, role: user.role },
  };
};

// ── Refresh ─────────────────────────────────────────────────────────────────
const refresh = async (refreshToken) => {
  // Validate JWT signature first
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw { status: 401, message: 'Invalid or expired refresh token.' };
  }

  // Check token exists and is not revoked
  const { rows } = await db.query(
    `SELECT token_id FROM refresh_tokens
     WHERE token = $1 AND revoked = FALSE AND expires_at > NOW()`,
    [refreshToken]
  );
  if (!rows.length) throw { status: 401, message: 'Refresh token revoked or expired.' };

  // Fetch latest user data
  const { rows: users } = await db.query(
    `SELECT user_id, name, email, role, is_active FROM users WHERE user_id = $1`,
    [decoded.user_id]
  );
  const user = users[0];
  if (!user || !user.is_active) throw { status: 403, message: 'Account unavailable.' };

  // Rotate: revoke old, issue new
  await db.query(`UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1`, [refreshToken]);

  const payload      = { user_id: user.user_id, name: user.name, email: user.email, role: user.role };
  const accessToken  = signAccessToken(payload);
  const newRefresh   = signRefreshToken(user.user_id);

  await db.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [user.user_id, newRefresh, refreshTokenExpiresAt()]
  );

  return { accessToken, refreshToken: newRefresh };
};

// ── Logout ──────────────────────────────────────────────────────────────────
const logout = async (refreshToken) => {
  await db.query(
    `UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1`,
    [refreshToken]
  );
};

// ── Logout all sessions ──────────────────────────────────────────────────────
const logoutAll = async (userId) => {
  await db.query(
    `UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1`,
    [userId]
  );
};

module.exports = { register, login, refresh, logout, logoutAll };