/**
 * Central Error Handler Middleware
 * Mounted last in server.js — catches any error passed via next(err)
 * Returns a consistent JSON error shape: { success: false, message: "..." }
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[ERROR] ${statusCode} — ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
