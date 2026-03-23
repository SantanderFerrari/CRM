require('dotenv').config();
const { query } = require('./index');

const migrations = [
  // ── ENUMS ──────────────────────────────────────────────────────────
  `
  DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
      'CUSTOMER_CARE',
      'TECHNICIAN',
      'SUPERVISOR',
      'SALES_REPRESENTATIVE',
      'HEAD_OF_DEPARTMENT',
      'HUMAN_RESOURCES',
      'ADMIN'
    );
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  `,

  // ── USERS TABLE ────────────────────────────────────────────────────
  `
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  CREATE TABLE IF NOT EXISTS users (
    user_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          user_role    NOT NULL,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );
  `,

  // ── REFRESH TOKENS TABLE ───────────────────────────────────────────
  `
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    token_id    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token       TEXT        NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
  `,

  // ── updated_at TRIGGER ─────────────────────────────────────────────
  `
  CREATE OR REPLACE FUNCTION set_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$;

  DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
  CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `,
];

(async () => {
  console.log('Running migrations...');
  for (const sql of migrations) {
    await query(sql);
  }
  console.log('✅ Migrations complete.');
  process.exit(0);
})().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});