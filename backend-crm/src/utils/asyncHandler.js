/**
 * Wraps an async route handler so any unhandled rejection is
 * forwarded to Express's next(err) instead of crashing the process.
 *
 * Usage:
 *   router.get('/', asyncHandler(async (req, res) => { ... }))
 *
 * This means you never need try/catch in a controller — just throw
 * or let the service throw, and Express will catch it here and pass
 * it to the global error handler.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { asyncHandler };