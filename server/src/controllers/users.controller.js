'use strict';
const db = require('../db');

// ── GET /api/users/:id  (public – safe fields only) ──────────────────
async function getUser(req, res, next) {
  try {
    const result = await db.query(
      `SELECT id, role, name, university_or_business, skills, created_at
       FROM users WHERE id=$1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// ── PUT /api/users/me  (update own profile) ───────────────────────────
async function updateMe(req, res, next) {
  try {
    const { name, university_or_business, skills } = req.body;
    const skillsArray = Array.isArray(skills) ? skills : undefined;

    const result = await db.query(
      `UPDATE users
       SET name=$1, university_or_business=$2, skills=COALESCE($3, skills)
       WHERE id=$4
       RETURNING id, role, name, email, university_or_business, skills, created_at`,
      [name || null, university_or_business || null, skillsArray || null, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// ── GET /api/employer/jobs  (EMPLOYER – list their own jobs) ──────────
async function employerJobs(req, res, next) {
  try {
    const result = await db.query(
      `SELECT j.*,
              (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS application_count
       FROM jobs j
       WHERE j.employer_id = $1
       ORDER BY j.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { getUser, updateMe, employerJobs };
