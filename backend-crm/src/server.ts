import 'dotenv/config';
import app from './app.js';
import { pool } from './db';

const PORT = parseInt(process.env.PORT ?? '5000', 10);

process.on('unhandledRejection', (reason: unknown) => {
  console.error('[unhandledRejection]', reason);
});

process.on('uncaughtException', (err: Error) => {
  console.error('[uncaughtException]', err);
  process.exit(1);
});

const start = async (): Promise<void> => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connected.');
  } catch (err) {
    console.error('❌ Database connection failed:', (err as Error).message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 CRM API running on http://localhost:${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV ?? 'development'}`);
    console.log(`   API Docs    : http://localhost:${PORT}/api/docs`);
  });
};

start();