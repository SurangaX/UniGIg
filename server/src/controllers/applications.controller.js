'use strict';
const db = require('../db');

// ── POST /api/jobs/:id/apply  (STUDENT) ───────────────────────────────
async function applyToJob(req, res, next) {
  try {
    const jobId    = req.params.id;
    const studentId = req.user.id;
    const { message } = req.body;

    // Job must exist and be open
    const jobRes = await db.query('SELECT * FROM jobs WHERE id=$1', [jobId]);
    const job    = jobRes.rows[0];
    if (!job)                 return res.status(404).json({ error: 'Job not found' });
    if (job.status !== 'open') return res.status(400).json({ error: 'Job is no longer open' });

    // Prevent self-apply (employer applying to their own job)
    if (job.employer_id === studentId) {
      return res.status(400).json({ error: 'You cannot apply to your own job' });
    }

    const result = await db.query(
      `INSERT INTO applications (job_id, student_id, employer_id, message)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [jobId, studentId, job.employer_id, message || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {  // unique violation
      return res.status(409).json({ error: 'You have already applied to this job' });
    }
    next(err);
  }
}

// ── GET /api/student/applications  (STUDENT) ─────────────────────────
async function myApplications(req, res, next) {
  try {
    const result = await db.query(
      `SELECT a.*, j.title AS job_title, j.category, j.location, j.pay_amount, j.pay_type,
              u.name AS employer_name
       FROM applications a
       JOIN jobs  j ON j.id = a.job_id
       JOIN users u ON u.id = a.employer_id
       WHERE a.student_id = $1
       ORDER BY a.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// ── GET /api/employer/jobs/:id/applicants  (EMPLOYER owner) ──────────
async function getApplicants(req, res, next) {
  try {
    const jobId = req.params.id;

    // Verify ownership
    const jobRes = await db.query('SELECT * FROM jobs WHERE id=$1', [jobId]);
    const job    = jobRes.rows[0];
    if (!job)                      return res.status(404).json({ error: 'Job not found' });
    if (job.employer_id !== req.user.id) return res.status(403).json({ error: 'Not your job' });

    const result = await db.query(
      `SELECT a.*, u.name AS student_name, u.email AS student_email,
              u.university_or_business, u.skills
       FROM applications a
       JOIN users u ON u.id = a.student_id
       WHERE a.job_id = $1
       ORDER BY a.created_at ASC`,
      [jobId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/applications/:id  (EMPLOYER owner) {status} ───────────
async function updateApplication(req, res, next) {
  try {
    const appId     = req.params.id;
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be accepted or rejected' });
    }

    // Fetch application
    const appRes = await db.query('SELECT * FROM applications WHERE id=$1', [appId]);
    const app    = appRes.rows[0];
    if (!app) return res.status(404).json({ error: 'Application not found' });
    if (app.employer_id !== req.user.id) return res.status(403).json({ error: 'Not your job' });
    if (app.status !== 'pending') return res.status(400).json({ error: 'Application already decided' });

    // Accept/reject this application
    const result = await db.query(
      `UPDATE applications SET status=$1 WHERE id=$2 RETURNING *`,
      [status, appId]
    );

    if (status === 'accepted') {
      // Fetch job to get workers_needed
      const jobRes = await db.query('SELECT * FROM jobs WHERE id=$1', [app.job_id]);
      const job = jobRes.rows[0];

      // Count total accepted applications for this job (including the one just accepted)
      const countRes = await db.query(
        `SELECT COUNT(*) FROM applications WHERE job_id=$1 AND status='accepted'`,
        [app.job_id]
      );
      const acceptedCount = parseInt(countRes.rows[0].count, 10);

      if (acceptedCount >= job.workers_needed) {
        // Quota reached → close the job and reject remaining pending applications
        await db.query(
          `UPDATE applications SET status='rejected' WHERE job_id=$1 AND status='pending'`,
          [app.job_id]
        );
        await db.query(`UPDATE jobs SET status='closed' WHERE id=$1`, [app.job_id]);
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { applyToJob, myApplications, getApplicants, updateApplication };
