'use strict';
require('dotenv').config();
const { Pool } = require('pg');

const rawUrl = process.env.DATABASE_URL;

if (!rawUrl) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

// The pg driver does not understand channel_binding or sslmode query params –
// strip them and enforce SSL via the pool config instead.
const connectionString = rawUrl
  .replace(/[?&]sslmode=[^&]*/g, '')
  .replace(/[?&]channel_binding=[^&]*/g, '')
  .replace(/\?&/, '?')
  .replace(/[?&]$/, '');

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,                        // cap concurrent connections
  idleTimeoutMillis: 30_000,      // release idle clients after 30 s
  connectionTimeoutMillis: 10_000 // wait up to 10 s for a connection
});

// Log pool errors but do NOT exit – let the request fail gracefully instead.
pool.on('error', (err) => {
  console.error('Unexpected error on idle DB client:', err.message);
});

module.exports = {
  /**
   * Run a parameterized query.
   * @param {string} text   SQL string with $1 $2 … placeholders
   * @param {any[]}  params Parameter values
   */
  query: (text, params) => pool.query(text, params),
  pool,
};
