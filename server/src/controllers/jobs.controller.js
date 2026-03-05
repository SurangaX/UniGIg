'use strict';
const db = require('../db');

// ── GET /api/jobs  (public – open jobs + optional filters) ─────────────
async function listJobs(req, res, next) {
  try {
    const { search = '', category = '', location = '', payMin, payMax } = req.query;

    let idx    = 1;
    const cond = ["j.status = 'open'"];
    const vals = [];

    if (search) {
      cond.push(`(j.title ILIKE $${idx} OR j.description ILIKE $${idx})`);
      vals.push(`%${search}%`);
      idx++;
    }
    if (category) {
      cond.push(`j.category ILIKE $${idx}`);
      vals.push(`%${category}%`);
      idx++;
    }
    if (location) {
      cond.push(`j.location ILIKE $${idx}`);
      vals.push(`%${location}%`);
      idx++;
    }
    if (payMin !== undefined && payMin !== '') {
      cond.push(`j.pay_amount >= $${idx}`);
      vals.push(Number(payMin));
      idx++;
    }
    if (payMax !== undefined && payMax !== '') {
      cond.push(`j.pay_amount <= $${idx}`);
      vals.push(Number(payMax));
      idx++;
    }

    const sql = `
      SELECT j.*, u.name AS employer_name, u.university_or_business
      FROM jobs j
      JOIN users u ON u.id = j.employer_id
      WHERE ${cond.join(' AND ')}
      ORDER BY j.created_at DESC
    `;

    const result = await db.query(sql, vals);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// ── GET /api/jobs/:id  (public if open; employer owner can see closed) ──
async function getJob(req, res, next) {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT j.*, u.name AS employer_name, u.university_or_business, u.email AS employer_email
       FROM jobs j
       JOIN users u ON u.id = j.employer_id
       WHERE j.id = $1`,
      [id]
    );
    const job = result.rows[0];
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // Enforce visibility: closed jobs visible only to owner
    if (job.status === 'closed') {
      if (!req.user || req.user.id !== job.employer_id) {
        return res.status(404).json({ error: 'Job not found' });
      }
    }

    res.json(job);
  } catch (err) {
    next(err);
  }
}

// ── POST /api/jobs  (EMPLOYER) ─────────────────────────────────────────
async function createJob(req, res, next) {
  try {
    const { title, category, description, location, pay_amount, pay_type, schedule_text, workers_needed } = req.body;

    if (!['hour', 'day', 'job'].includes(pay_type)) {
      return res.status(400).json({ error: 'pay_type must be hour, day or job' });
    }

    const wn = workers_needed !== undefined ? parseInt(workers_needed, 10) : 1;
    if (isNaN(wn) || wn < 1) {
      return res.status(400).json({ error: 'workers_needed must be a positive integer' });
    }

    // Verify employer account still exists in DB (guards against stale JWTs after DB resets)
    const employerCheck = await db.query(
      'SELECT id FROM users WHERE id = $1 AND role = $2',
      [req.user.id, 'EMPLOYER']
    );
    if (!employerCheck.rows.length) {
      return res.status(401).json({ error: 'Employer account not found. Please log out and log in again.' });
    }

    const result = await db.query(
      `INSERT INTO jobs (employer_id, title, category, description, location, pay_amount, pay_type, schedule_text, workers_needed)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [req.user.id, title, category, description, location, pay_amount, pay_type, schedule_text || null, wn]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    // PostgreSQL FK violation – employer_id not in users table
    if (err.code === '23503') {
      return res.status(401).json({ error: 'Employer account not found. Please log out and log in again.' });
    }
    next(err);
  }
}

// ── PUT /api/jobs/:id  (EMPLOYER owner) ───────────────────────────────
async function updateJob(req, res, next) {
  try {
    const { id } = req.params;
    const job = await _ownerGuard(id, req.user.id, res);
    if (!job) return;

    const { title, category, description, location, pay_amount, pay_type, schedule_text, workers_needed } = req.body;

    if (pay_type && !['hour', 'day', 'job'].includes(pay_type)) {
      return res.status(400).json({ error: 'pay_type must be hour, day or job' });
    }

    let wn = job.workers_needed;
    if (workers_needed !== undefined) {
      wn = parseInt(workers_needed, 10);
      if (isNaN(wn) || wn < 1)
        return res.status(400).json({ error: 'workers_needed must be a positive integer' });
    }

    const result = await db.query(
      `UPDATE jobs
       SET title=$1, category=$2, description=$3, location=$4,
           pay_amount=$5, pay_type=$6, schedule_text=$7, workers_needed=$8
       WHERE id=$9
       RETURNING *`,
      [
        title         ?? job.title,
        category      ?? job.category,
        description   ?? job.description,
        location      ?? job.location,
        pay_amount    ?? job.pay_amount,
        pay_type      ?? job.pay_type,
        schedule_text !== undefined ? schedule_text : job.schedule_text,
        wn,
        id
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/jobs/:id/close  (EMPLOYER owner) ───────────────────────
async function closeJob(req, res, next) {
  try {
    const { id } = req.params;
    const job = await _ownerGuard(id, req.user.id, res);
    if (!job) return;

    const result = await db.query(
      `UPDATE jobs SET status='closed' WHERE id=$1 RETURNING *`,
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// ── Helper: verify job ownership ─────────────────────────────────────
async function _ownerGuard(jobId, userId, res) {
  const r = await db.query('SELECT * FROM jobs WHERE id=$1', [jobId]);
  const job = r.rows[0];
  if (!job) { res.status(404).json({ error: 'Job not found' }); return null; }
  if (job.employer_id !== userId) { res.status(403).json({ error: 'Not your job' }); return null; }
  return job;
}

module.exports = { listJobs, getJob, createJob, updateJob, closeJob };
