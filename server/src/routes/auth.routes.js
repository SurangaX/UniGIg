'use strict';
const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validate }     = require('../middleware/validate');

// POST /api/auth/register
router.post('/register',
  validate(['role', 'name', 'email', 'password']),
  controller.register
);

// POST /api/auth/login
router.post('/login',
  validate(['email', 'password']),
  controller.login
);

// GET /api/auth/me
router.get('/me', authenticate, controller.me);

module.exports = router;
