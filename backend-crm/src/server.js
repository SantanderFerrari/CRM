require('dotenv').config();
const app = require('./app');
const { pool } = require('./db');
 
const PORT = process.env.PORT || 5000;
 
// ── Process-level safety nets ─────────────────────────────────────────────
// These catch anything that slips past Express's error handler.
// They log the error but do NOT crash the server.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
 
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
  // uncaughtException means the process is in an unknown state —
  // exit and let your process manager (PM2 / Docker) restart it.
  process.exit(1);
});
 
const start = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connected.');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
 
  app.listen(PORT, () => {
    console.log(`🚀 CRM API running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};
 
start();
 