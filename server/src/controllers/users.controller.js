'use strict';
const bcrypt = require('bcryptjs');
const db = require('../db');

const SALT_ROUNDS = 10;

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
    const { name, email, university_or_business, skills, password, current_password } = req.body;
    const skillsArray = Array.isArray(skills) ? skills : undefined;

    // If changing email, check it's not already taken by another user
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      const conflict = await db.query(
        'SELECT id FROM users WHERE email=$1 AND id<>$2',
        [normalizedEmail, req.user.id]
      );
      if (conflict.rows.length) {
        return res.status(409).json({ error: 'Email already in use by another account.' });
      }
    }

    // If changing password, verify current password first
    let newHash = null;
    if (password) {
      if (!current_password) {
        return res.status(400).json({ error: 'Current password is required to set a new password.' });
      }
      const row = await db.query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
      const match = await bcrypt.compare(current_password, row.rows[0].password_hash);
      if (!match) {
        return res.status(400).json({ error: 'Current password is incorrect.' });
      }
      newHash = await bcrypt.hash(password, SALT_ROUNDS);
    }

    const result = await db.query(
      `UPDATE users
       SET name=COALESCE($1, name),
           email=COALESCE($2, email),
           university_or_business=COALESCE($3, university_or_business),
           skills=COALESCE($4, skills),
           password_hash=COALESCE($5, password_hash)
       WHERE id=$6
       RETURNING id, role, name, email, university_or_business, skills, created_at`,
      [
        name ? name.trim() : null,
        email ? email.toLowerCase().trim() : null,
        university_or_business ? university_or_business.trim() : null,
        skillsArray || null,
        newHash,
        req.user.id,
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/users/me  (delete own account) ───────────────────────
async function deleteMe(req, res, next) {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password is required to delete your account.' });
    }
    const row = await db.query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
    if (!row.rows.length) return res.status(404).json({ error: 'User not found.' });
    const match = await bcrypt.compare(password, row.rows[0].password_hash);
    if (!match) {
      return res.status(400).json({ error: 'Incorrect password.' });
    }
    await db.query('DELETE FROM users WHERE id=$1', [req.user.id]);
    res.status(204).end();
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

module.exports = { getUser, updateMe, deleteMe, employerJobs };
