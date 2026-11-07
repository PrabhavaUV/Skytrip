/**
 * Admin Role Verification Middleware
 * Requires that req.user is set by auth middleware first
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Admin access required'
  });
};

module.exports = admin;
