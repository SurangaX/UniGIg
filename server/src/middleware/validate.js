'use strict';

/**
 * Validates that required fields are present and non-empty in req.body.
 * Usage: validate(['email','password'])
 */
function validate(fields) {
  return (req, res, next) => {
    const missing = fields.filter(
      (f) => req.body[f] === undefined || req.body[f] === null || req.body[f] === ''
    );
    if (missing.length) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }
    next();
  };
}

/**
 * Ensures req.body contains no unexpected keys outside of allowedKeys.
 * Non-blocking – just strips unknown keys.
 */
function stripUnknown(allowedKeys) {
  return (req, _res, next) => {
    if (req.body && typeof req.body === 'object') {
      Object.keys(req.body).forEach((k) => {
        if (!allowedKeys.includes(k)) delete req.body[k];
      });
    }
    next();
  };
}

module.exports = { validate, stripUnknown };
