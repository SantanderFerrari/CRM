import { Request, Response, NextFunction } from 'express';

interface PgError extends Error {
  code?:   string;
  column?: string;
}

interface ApiError {
  status?:     number;
  statusCode?: number;
  message?:    string;
  stack?:      string;
}

const errorHandler = (
  err: PgError & ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} →`, err);

  if (err.code === '23505') {
    res.status(409).json({ message: 'A record with that value already exists.' });
    return;
  }
  if (err.code === '23503') {
    res.status(400).json({ message: 'Referenced record does not exist.' });
    return;
  }
  if (err.code === '23502') {
    res.status(400).json({ message: `Missing required field: ${err.column ?? 'unknown'}.` });
    return;
  }
  if (err.code === '22P02') {
    res.status(400).json({ message: 'Invalid value for an enum field.' });
    return;
  }

  // Plain object throws from services: throw { status: 404, message: '...' }
  if (err.status && err.message && !err.stack) {
    res.status(err.status).json({ message: err.message });
    return;
  }

  const status  = err.status ?? err.statusCode ?? 500;
  const message = err.message ?? 'Internal server error.';
  res.status(status).json({ message });
};

export default errorHandler;