'use strict';
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRoutes        = require('./routes/auth.routes');
const usersRoutes       = require('./routes/users.routes');
const jobsRoutes        = require('./routes/jobs.routes');
const applicationsRoutes = require('./routes/applications.routes');
const reviewsRoutes     = require('./routes/reviews.routes');

const app = express();

// ── Middleware ────────────────────────────────────────────────
// CLIENT_ORIGIN can be a comma-separated list e.g. "http://localhost:5500,https://unigig.netlify.app"
const allowedOrigins = (process.env.CLIENT_ORIGIN || '*')
  .split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, cb) => {
    // allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api',              usersRoutes);
app.use('/api/jobs',         jobsRoutes);
app.use('/api',              applicationsRoutes);
app.use('/api/reviews',      reviewsRoutes);

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── Central error handler ─────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  const status  = err.status  || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: message });
});

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`UniGig API listening on http://localhost:${PORT}`));

module.exports = app;
