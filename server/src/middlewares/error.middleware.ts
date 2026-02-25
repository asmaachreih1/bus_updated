import { NextFunction, Request, Response } from 'express';

type HttpError = Error & { status?: number };

export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error: HttpError = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

export function errorHandler(error: HttpError, req: Request, res: Response, next: NextFunction): void {
  const status = error.status || 500;
  const message = error.message || 'Internal server error';

  if (status >= 500) {
    console.error(error);
  }

  res.status(status).json({
    success: false,
    error: message,
  });
}
