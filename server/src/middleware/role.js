'use strict';

/**
 * Factory that returns middleware allowing only specific roles.
 * Must be used AFTER authenticate middleware.
 * @param  {...string} roles  e.g. requireRole('EMPLOYER') or requireRole('STUDENT','EMPLOYER')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Requires role: ${roles.join(' or ')}` });
    }
    next();
  };
}

module.exports = { requireRole };
