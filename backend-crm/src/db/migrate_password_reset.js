require('dotenv').config();
const { query } = require('../db');

const migrations = [
  `
  CREATE TABLE IF NOT EXISTS password_reset_otps (
    otp_id      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    otp_hash    VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used        BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_otp_user_id ON password_reset_otps(user_id);
  `,
];

(async () => {
  console.log('Running password reset migration...');
  for (const sql of migrations) await query(sql);
  console.log('✅ Password reset migration complete.');
  process.exit(0);
})().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});