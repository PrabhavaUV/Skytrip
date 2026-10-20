const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware — Verifies incoming JWT token in Authorization header.
 * Attaches decoded user payload (id, role) to req.user.
 * Returns 401 Unauthorized if missing, malformed, or expired (ERR-004).
 */
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.'
    });
  }
};

module.exports = auth;
