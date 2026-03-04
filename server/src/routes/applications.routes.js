'use strict';
const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/applications.controller');
const { authenticate } = require('../middleware/auth');
const { requireRole }  = require('../middleware/role');

// POST /api/jobs/:id/apply
router.post('/jobs/:id/apply',
  authenticate, requireRole('STUDENT'),
  controller.applyToJob
);

// GET /api/student/applications
router.get('/student/applications',
  authenticate, requireRole('STUDENT'),
  controller.myApplications
);

// GET /api/employer/jobs/:id/applicants
router.get('/employer/jobs/:id/applicants',
  authenticate, requireRole('EMPLOYER'),
  controller.getApplicants
);

// PATCH /api/applications/:id
router.patch('/applications/:id',
  authenticate, requireRole('EMPLOYER'),
  controller.updateApplication
);

module.exports = router;
