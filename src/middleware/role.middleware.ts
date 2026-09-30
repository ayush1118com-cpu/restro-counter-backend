import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { UserRole, ERROR_CODES } from '../constants/index.js';
import { AppError } from './error.middleware.js';

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('User authentication context missing.', 401, ERROR_CODES.UNAUTHORIZED));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access forbidden. Role '${req.user.role}' does not have sufficient permissions.`,
          403,
          ERROR_CODES.FORBIDDEN
        )
      );
    }

    next();
  };
};
