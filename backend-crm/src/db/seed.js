require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query, pool } = require('./db');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;

// ── Read credentials from environment — never hardcoded ───────────────────
const ADMIN_NAME     = process.env.SEED_ADMIN_NAME;
const ADMIN_EMAIL    = process.env.SEED_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
const ADMIN_PHONE    = process.env.SEED_ADMIN_PHONE || null;

const seed = async () => {
  // ── Guard: require all three to be explicitly set ──────────────────────
  const missing = [];
  if (!ADMIN_NAME)     missing.push('SEED_ADMIN_NAME');
  if (!ADMIN_EMAIL)    missing.push('SEED_ADMIN_EMAIL');
  if (!ADMIN_PASSWORD) missing.push('SEED_ADMIN_PASSWORD');

  if (missing.length) {
    console.error('❌ Seed aborted. Missing required environment variables:');
    missing.forEach((v) => console.error(`   • ${v}`));
    console.error('\nSet them in your .env file or pass them inline:');
    console.error('  SEED_ADMIN_NAME="Jane Doe" SEED_ADMIN_EMAIL="admin@example.com" SEED_ADMIN_PASSWORD="StrongPass1" node src/db/seed.js');
    process.exit(1);
  }

  // ── Validate password strength before touching the DB ─────────────────
  if (ADMIN_PASSWORD.length < 8) {
    console.error('❌ SEED_ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }
  if (!/[A-Z]/.test(ADMIN_PASSWORD)) {
    console.error('❌ SEED_ADMIN_PASSWORD must contain at least one uppercase letter.');
    process.exit(1);
  }
  if (!/[0-9]/.test(ADMIN_PASSWORD)) {
    console.error('❌ SEED_ADMIN_PASSWORD must contain at least one number.');
    process.exit(1);
  }

  // ── Check if an admin already exists ──────────────────────────────────
  const { rows: existing } = await query(
    `SELECT user_id, email FROM users WHERE role = 'ADMIN' LIMIT 1`
  );

  if (existing.length) {
    console.log(`ℹ️  Admin already exists: ${existing[0].email}`);
    console.log('   Seed skipped — no changes made.');
    process.exit(0);
  }

  // ── Check if email is already taken by a non-admin ────────────────────
  const { rows: emailCheck } = await query(
    `SELECT user_id FROM users WHERE email = $1`, [ADMIN_EMAIL.toLowerCase()]
  );

  if (emailCheck.length) {
    console.error(`❌ Email ${ADMIN_EMAIL} is already registered as a different user.`);
    process.exit(1);
  }

  // ── Hash password and insert ───────────────────────────────────────────
  console.log('🔐 Hashing password...');
  const password_hash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, role, phone)
     VALUES ($1, $2, $3, 'ADMIN', $4)
     RETURNING user_id, name, email, role, created_at`,
    [ADMIN_NAME, ADMIN_EMAIL.toLowerCase(), password_hash, ADMIN_PHONE]
  );

  const admin = rows[0];

  console.log('');
  console.log('✅ Admin account created successfully.');
  console.log('─────────────────────────────────────');
  console.log(`   Name:    ${admin.name}`);
  console.log(`   Email:   ${admin.email}`);
  console.log(`   Role:    ${admin.role}`);
  console.log(`   User ID: ${admin.user_id}`);
  console.log(`   Created: ${admin.created_at}`);
  console.log('─────────────────────────────────────');
  console.log('⚠️  Store these credentials securely.');
  console.log('   Remove SEED_ADMIN_PASSWORD from .env after first login.');
  console.log('');
};

seed()
  .catch((err) => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  })
  .finally(() => pool.end());