'use strict';
require('dotenv').config();
const { Pool } = require('pg');

// Railway automatically injects DATABASE_URL when a Postgres service is linked
// to the same project. That URL uses Railway's private network (no public
// internet hop), so connections are fast and free of egress charges.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set. ' +
    'Link a Railway Postgres service to this project or add it to your .env file.');
}

// Railway Postgres requires SSL even on the private network.
// Keep min:2 so warm connections are ready before the first HTTP request.
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  min: 2,                        // pre-warm connections at startup
  max: 10,                       // cap concurrent connections
  idleTimeoutMillis: 30_000,     // release idle clients after 30 s
  connectionTimeoutMillis: 5_000 // fail fast if DB is unreachable
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Pre-warm the pool at startup so the first real request never waits for
// a fresh TCP + SSL + auth handshake.
pool.query('SELECT 1').catch((err) =>
  console.warn('DB pre-warm failed (will retry on first request):', err.message)
);

module.exports = {
  /**
   * Run a parameterized query.
   * @param {string} text   SQL string with $1 $2 … placeholders
   * @param {any[]}  params Parameter values
   */
  query: (text, params) => pool.query(text, params),
  pool,
};
