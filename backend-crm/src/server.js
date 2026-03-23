require('dotenv').config();
const app = require('./app');
const { pool } = require('./db');

const PORT = process.env.PORT || 5000;

const start = async () => {
  // Verify DB connection before starting
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