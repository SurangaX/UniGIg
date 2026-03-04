'use strict';
const db = require('../db');

// ── POST /api/reviews  (logged-in) ────────────────────────────────────
async function createReview(req, res, next) {
  try {
    const { jobId, toUserId, rating, comment } = req.body;
    const fromUserId = req.user.id;

    if (!jobId || !toUserId || rating === undefined) {
      return res.status(400).json({ error: 'jobId, toUserId, and rating are required' });
    }
    const rNum = Number(rating);
    if (!Number.isInteger(rNum) || rNum < 1 || rNum > 5) {
      return res.status(400).json({ error: 'Rating must be an integer 1–5' });
    }
    if (fromUserId === toUserId) {
      return res.status(400).json({ error: 'You cannot review yourself' });
    }

    // Must be an accepted application for this job involving both users
    const appRes = await db.query(
      `SELECT id FROM applications
       WHERE job_id=$1 AND status='accepted'
         AND (
               (student_id=$2 AND employer_id=$3)
            OR (student_id=$3 AND employer_id=$2)
         )`,
      [jobId, fromUserId, toUserId]
    );
    if (!appRes.rows.length) {
      return res.status(403).json({ error: 'No accepted application connects the two users on this job' });
    }

    const result = await db.query(
      `INSERT INTO reviews (job_id, from_user_id, to_user_id, rating, comment)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [jobId, fromUserId, toUserId, rNum, comment || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'You have already reviewed this person for this job' });
    }
    next(err);
  }
}

// ── GET /api/users/:id/reviews  (public) ──────────────────────────────
async function getUserReviews(req, res, next) {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT r.*, u.name AS author_name, u.role AS author_role, j.title AS job_title
       FROM reviews r
       JOIN users u ON u.id = r.from_user_id
       JOIN jobs  j ON j.id = r.job_id
       WHERE r.to_user_id = $1
       ORDER BY r.created_at DESC`,
      [id]
    );

    const avgRes = await db.query(
      `SELECT ROUND(AVG(rating)::numeric, 2) AS average_rating, COUNT(*) AS total_reviews
       FROM reviews WHERE to_user_id=$1`,
      [id]
    );

    res.json({
      reviews:        result.rows,
      average_rating: avgRes.rows[0].average_rating || null,
      total_reviews:  parseInt(avgRes.rows[0].total_reviews, 10),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createReview, getUserReviews };
