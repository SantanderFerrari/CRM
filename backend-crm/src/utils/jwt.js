const jwt = require('jsonwebtoken');

const ACCESS_SECRET  = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRY  = process.env.JWT_EXPIRES_IN      || '8h';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Sign an access token containing user identity.
 */
const signAccessToken = (payload) =>
  jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });

/**
 * Sign a refresh token (contains only user_id).
 */
const signRefreshToken = (userId) =>
  jwt.sign({ user_id: userId }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });

/**
 * Verify an access token. Returns decoded payload or throws.
 */
const verifyAccessToken = (token) =>
  jwt.verify(token, ACCESS_SECRET);

/**
 * Verify a refresh token. Returns decoded payload or throws.
 */
const verifyRefreshToken = (token) =>
  jwt.verify(token, REFRESH_SECRET);

/**
 * Calculate refresh token expiry as a Date (for DB storage).
 */
const refreshTokenExpiresAt = () => {
  const ms = parseDuration(REFRESH_EXPIRY);
  return new Date(Date.now() + ms);
};

// Simple duration parser: '7d' → ms, '8h' → ms
function parseDuration(str) {
  const unit = str.slice(-1);
  const val  = parseInt(str, 10);
  const map  = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return val * (map[unit] || 3_600_000);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  refreshTokenExpiresAt,
};