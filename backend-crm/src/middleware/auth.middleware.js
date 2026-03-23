const { verifyAccessToken } = require('../utils/jwt');

/**
 * Protect a route — requires a valid Bearer token.
 * Attaches decoded user to req.user.
 */
const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided.' });
  }

  const token = header.split(' ')[1];
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError' ? 'Token expired.' : 'Invalid token.';
    return res.status(401).json({ message });
  }
};

/**
 * Restrict access to specific roles.
 * Usage: authorize('ADMIN', 'SUPERVISOR')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access denied. Required roles: ${roles.join(', ')}.`,
    });
  }
  next();
};

module.exports = { authenticate, authorize };