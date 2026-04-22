import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler so any unhandled rejection is
 * forwarded to Express next(err) instead of crashing the process.
 *
 * The generic <P, ResBody, ReqBody, ReqQuery> mirrors Express's own
 * RequestHandler signature so typed route handlers work without casting.
 */
const asyncHandler = <
  P  = Record<string, string>,
  ResBody  = unknown,
  ReqBody  = unknown,
  ReqQuery = Record<string, unknown>,
>(
  fn: (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction,
  ) => Promise<void>,
): RequestHandler<P, ResBody, ReqBody, ReqQuery> =>
  (req, res, next) => {
    Promise.resolve(fn(req as Request<P, ResBody, ReqBody, ReqQuery>, res, next)).catch(next);
  };

export { asyncHandler };