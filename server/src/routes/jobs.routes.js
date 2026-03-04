'use strict';
const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/jobs.controller');
const { authenticate }  = require('../middleware/auth');
const { requireRole }   = require('../middleware/role');
const { validate }      = require('../middleware/validate');
const { JWT_SECRET }    = require('../config');

// Public (optional auth for closed-job visibility)
router.get('/',    (req, res, next) => {
  // Optionally attach user if token present, but don't block unauthenticated
  const header = req.headers['authorization'] || '';
  if (header.startsWith('Bearer ')) {
    const jwt = require('jsonwebtoken');
    try { req.user = jwt.verify(header.slice(7), JWT_SECRET); } catch (_) {}
  }
  controller.listJobs(req, res, next);
});

router.get('/:id', (req, res, next) => {
  const header = req.headers['authorization'] || '';
  if (header.startsWith('Bearer ')) {
    const jwt = require('jsonwebtoken');
    try { req.user = jwt.verify(header.slice(7), JWT_SECRET); } catch (_) {}
  }
  controller.getJob(req, res, next);
});

// Employer-only
router.post('/',
  authenticate, requireRole('EMPLOYER'),
  validate(['title','category','description','location','pay_amount','pay_type']),
  controller.createJob
);

router.put('/:id',
  authenticate, requireRole('EMPLOYER'),
  controller.updateJob
);

router.patch('/:id/close',
  authenticate, requireRole('EMPLOYER'),
  controller.closeJob
);

module.exports = router;
