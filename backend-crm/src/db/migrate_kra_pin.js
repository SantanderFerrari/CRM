require('dotenv').config();
const { query } = require('./index');

const migrations = [
  // ── ADD kra_pin COLUMN TO customers TABLE ─────────────────────────
  `
  ALTER TABLE IF EXISTS customers
  ADD COLUMN IF NOT EXISTS kra_pin VARCHAR(11);
  `,
];

(async () => {
  console.log('Running kra_pin migration...');
  try {
    for (const sql of migrations) {
      await query(sql);
      console.log('✓ Migration executed successfully.');
    }
    console.log('✅ kra_pin migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('✗ Migration failed:', err.message);
    process.exit(1);
  }
})();
