const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── WATSONX status must be declared before routes use it ──────────────────────
const WATSONX_STATUS = {
  available: !!(process.env.WATSONX_API_KEY && process.env.WATSONX_PROJECT_ID),
  mode: (process.env.WATSONX_API_KEY && process.env.WATSONX_PROJECT_ID)
    ? 'live' : 'mock'
};

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ── Routes ─────────────────────────────────────────────────────────────────────
const authRoutes       = require('./routes/auth');
const dashboardRoutes  = require('./routes/dashboard');
const industryRoutes   = require('./routes/industries');
const sensorRoutes     = require('./routes/sensors');
const readingRoutes    = require('./routes/readings');
const violationRoutes  = require('./routes/violations');
const alertRoutes      = require('./routes/alerts');
const riskRoutes       = require('./routes/risk');
const agentRoutes      = require('./routes/agents');
const aiRoutes         = require('./routes/ai');

app.use('/api/auth',       authRoutes);
app.use('/api/dashboard',  dashboardRoutes);
app.use('/api/industries', industryRoutes);
app.use('/api/sensors',    sensorRoutes);
app.use('/api/readings',   readingRoutes);
app.use('/api/violations', violationRoutes);
app.use('/api/alerts',     alertRoutes);
app.use('/api/risk',       riskRoutes);
app.use('/api/agents',     agentRoutes);
app.use('/api/ai',         aiRoutes);

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    watsonx: WATSONX_STATUS,
    version: '1.0.0',
    project: 'EcoGuard AI'
  });
});

// Expose WATSONX_STATUS for routes that need it
app.set('watsonxStatus', WATSONX_STATUS);

// ── Global error handler ───────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║     EcoGuard AI – Pollution Monitoring System    ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  Backend running on http://localhost:${PORT}         ║`);
  console.log(`║  WatsonX Mode : ${WATSONX_STATUS.mode.padEnd(32)}║`);
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
});

module.exports = { app, WATSONX_STATUS };
