require('dotenv').config();
const { query } = require('../db');

(async () => {
  console.log('Adding phone column to users if missing...');
  await query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
  `);
  console.log('✅ Done.');
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});