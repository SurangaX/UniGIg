'use strict';
const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/reviews.controller');
const { authenticate } = require('../middleware/auth');

// POST /api/reviews
router.post('/', authenticate, controller.createReview);

module.exports = router;
