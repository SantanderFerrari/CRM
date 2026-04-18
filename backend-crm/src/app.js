const express = require('express');
const cors    = require('cors');

const authRoutes  = require('./modules/auth/auth.routes.js');
const usersRoutes = require('./modules/users/users.routes');
const customersRoutes = require('./modules/customers/customers.routes');
const devicesRoutes = require('./modules/devices/devices.routes');
const ticketsRoutes = require('./modules/tickets/tickets.routes'); 
const dashboardRoutes = require('./modules/dashboard/dashboard.routes'); 
const jobcardsRoutes = require('./modules/jobcards/jobcards.routes');
const leaveRoutes = require('./modules/leave/leave.routes');
const fundsRoutes = require('./modules/funds/funds.routes');
const errorHandler = require('./middleware/error.middleware');
const swaggerUi      = require('swagger-ui-express');
const swaggerSpec    = require('./swagger.js');

const app = express();

// ── Global middleware ------  CORS ────────────────────────────────────────────────────────
const rawOrigins = String(process.env.CLIENT_ORIGIN || 'http://localhost:3000');
const allowedOrigins = rawOrigins
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed.`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ── Swagger UI (for development) ───────────────────────────────────────
app.use('/api/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'CRM API Documentation',
    swaggerOptions: {
    persistAuthorization: true,  //Keeps token between page refreshes
    docExpansion: 'none',
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
  },
}));   

// Exposr raw swagger spec for external tools i.e POSTMAN, SWAGGER-UI, etc.
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(require(swaggerSpec));
});


// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date() }));

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/jobcards', jobcardsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/funds', fundsRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;