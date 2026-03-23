const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, err);

  // express-validator passes arrays of errors via err.array()
  if (err.type === 'validation') {
    return res.status(422).json({ message: 'Validation failed.', errors: err.errors });
  }

  // PostgreSQL unique violation (e.g. duplicate email)
  if (err.code === '23505') {
    return res.status(409).json({ message: 'A record with that value already exists.' });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ message: 'Referenced record does not exist.' });
  }

  const status  = err.status  || 500;
  const message = err.message || 'Internal server error.';
  res.status(status).json({ message });
};

module.exports = errorHandler;