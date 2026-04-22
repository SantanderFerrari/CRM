import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      message: 'Validation failed.',
      errors: errors.array().map((e: ValidationError) => ({
        field:   (e as ValidationError & { path?: string }).path ?? e.type,
        message: e.msg,
      })),
    });
    return;
  }
  next();
};