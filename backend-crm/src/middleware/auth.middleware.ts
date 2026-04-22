import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import type { UserRole } from '../types';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided.' });
    return;
  }

  const token = header.split(' ')[1];
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err: unknown) {
    const isExpired = err instanceof Error && err.name === 'TokenExpiredError';
    res.status(401).json({ message: isExpired ? 'Token expired.' : 'Invalid token.' });
  }
};

export const authorize = (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated.' });
      return;
    }
    if (!roles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        message: `Access denied. Required roles: ${roles.join(', ')}.`,
      });
      return;
    }
    next();
  };