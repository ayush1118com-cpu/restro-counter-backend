import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { ERROR_CODES } from '../constants/index.js';

export class AppError extends Error {
  public statusCode: number;
  public errorCode: string;
  public data?: any;

  constructor(message: string, statusCode: number = 400, errorCode: string = ERROR_CODES.BAD_REQUEST, data?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.data = data;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): any => {
  logger.error(`Error handling middleware caught: ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.errorCode, err.data);
  }

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return sendError(res, 'Validation failed', 422, ERROR_CODES.VALIDATION_ERROR, formattedErrors);
  }

  if (err.name === 'CastError') {
    return sendError(res, `Invalid resource ID format: ${err.value}`, 400, ERROR_CODES.BAD_REQUEST);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return sendError(res, `Duplicate value for ${field}`, 409, ERROR_CODES.DUPLICATE_RESOURCE);
  }

  return sendError(
    res,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    500,
    ERROR_CODES.INTERNAL_SERVER_ERROR
  );
};
