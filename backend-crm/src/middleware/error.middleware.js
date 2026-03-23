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
  //POSTGRESQL not null violation
  if (err.code === '23502') {
    return res.status(400).json({ message: 'A required field is missing.' });
  }
  //PostgreSQL invalid enum value
  if (err.code === '22P02') {
    return res.status(400).json({ message: 'Invalid value for field.' });
  }
  //Plain object throws from services:throw { status: 404, message: 'Not found.' };
  if (err.status && err.message && err.stack) {
    return res.status(err.status).json({ message: err.message });
  }

  //Standard Error instances 

  const status  = err.status  || err.statusCode || 500;
  const message = err.message || 'Internal server error.';
  res.status(status).json({ message });
};

module.exports = errorHandler;