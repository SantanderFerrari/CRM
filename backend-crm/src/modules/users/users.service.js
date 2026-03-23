const bcrypt = require('bcryptjs');
const db = require('../../db');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;

// ── List all users (with optional role filter) ──────────────────────────────
const getAll = async ({ role, is_active, limit = 50, offset = 0 }) => {
  const conditions = [];
  const params     = [];

  if (role) {
    params.push(role);
    conditions.push(`role = $${params.length}`);
  }
  if (is_active !== undefined) {
    params.push(is_active);
    conditions.push(`is_active = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit, offset);

  const { rows } = await db.query(
    `SELECT user_id, name, email, role, is_active, created_at
     FROM users ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
};

// ── Get single user ─────────────────────────────────────────────────────────
const getById = async (userId) => {
  const { rows } = await db.query(
    `SELECT user_id, name, email, role, is_active, created_at, updated_at
     FROM users WHERE user_id = $1`,
    [userId]
  );
  if (!rows.length) throw { status: 404, message: 'User not found.' };
  return rows[0];
};

// ── Update user profile ─────────────────────────────────────────────────────
const update = async (userId, { name, email, role }) => {
  const fields = [];
  const params = [];

  if (name)  { params.push(name);  fields.push(`name  = $${params.length}`); }
  if (email) { params.push(email); fields.push(`email = $${params.length}`); }
  if (role)  { params.push(role);  fields.push(`role  = $${params.length}`); }

  if (!fields.length) throw { status: 400, message: 'No fields to update.' };

  params.push(userId);
  const { rows } = await db.query(
    `UPDATE users SET ${fields.join(', ')}
     WHERE user_id = $${params.length}
     RETURNING user_id, name, email, role, is_active, updated_at`,
    params
  );
  if (!rows.length) throw { status: 404, message: 'User not found.' };
  return rows[0];
};

// ── Change password ──────────────────────────────────────────────────────────
const changePassword = async (userId, { currentPassword, newPassword }) => {
  const { rows } = await db.query(
    `SELECT password_hash FROM users WHERE user_id = $1`,
    [userId]
  );
  if (!rows.length) throw { status: 404, message: 'User not found.' };

  const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!valid) throw { status: 401, message: 'Current password is incorrect.' };

  const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await db.query(`UPDATE users SET password_hash = $1 WHERE user_id = $2`, [hash, userId]);
};

// ── Deactivate / Activate user (soft delete) ────────────────────────────────
const setActive = async (userId, is_active) => {
  const { rows } = await db.query(
    `UPDATE users SET is_active = $1 WHERE user_id = $2
     RETURNING user_id, name, email, role, is_active`,
    [is_active, userId]
  );
  if (!rows.length) throw { status: 404, message: 'User not found.' };
  return rows[0];
};

module.exports = { getAll, getById, update, changePassword, setActive };