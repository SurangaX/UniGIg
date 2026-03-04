'use strict';
const express    = require('express');
const router     = express.Router();
const usersCtrl  = require('../controllers/users.controller');
const reviewsCtrl = require('../controllers/reviews.controller');
const { authenticate } = require('../middleware/auth');
const { requireRole }  = require('../middleware/role');

// GET  /api/users/:id
router.get('/users/:id', usersCtrl.getUser);

// PUT  /api/users/me
router.put('/users/me', authenticate, usersCtrl.updateMe);

// GET  /api/users/:id/reviews
router.get('/users/:id/reviews', reviewsCtrl.getUserReviews);

// GET  /api/employer/jobs  (employer sees all their jobs)
router.get('/employer/jobs', authenticate, requireRole('EMPLOYER'), usersCtrl.employerJobs);

module.exports = router;
