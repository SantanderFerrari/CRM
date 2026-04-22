import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import {swaggerSpec} from './swagger';

// Routes — still .js during migration, TS picks them up via allowJs
const authRoutes      = require('./modules/auth/auth.routes');
const usersRoutes     = require('./modules/users/users.routes');
const customersRoutes = require('./modules/customers/customers.routes');
const devicesRoutes   = require('./modules/devices/devices.routes');
const ticketsRoutes   = require('./modules/tickets/tickets.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const jobcardsRoutes  = require('./modules/jobcards/jobcards.routes');
const leaveRoutes     = require('./modules/leave/leave.routes');
const fundsRoutes     = require('./modules/funds/funds.routes');

import errorHandler from './middleware/error.middleware';
import { options } from './modules/auth/auth.routes';

const app: Application = express();

// ── CORS ──────────────────────────────────────────────────────────────────
const rawOrigins     = process.env.CLIENT_ORIGIN ?? 'http://localhost:3000';
const allowedOrigins = rawOrigins.split(',').map((o) => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed.`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Swagger ────────────────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'CRM API Docs',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
  },
}));

app.get('/api/docs.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ── Health ─────────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', ts: new Date() });
});

// ── API routes ─────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/users',     usersRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/devices',   devicesRoutes);
app.use('/api/tickets',   ticketsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/job-cards', jobcardsRoutes);
app.use('/api/leave',     leaveRoutes);
app.use('/api/funds',     fundsRoutes);

// ── 404 ────────────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.use(errorHandler);

export default app;