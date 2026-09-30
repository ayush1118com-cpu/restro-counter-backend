import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { AppError } from './error.middleware.js';
import { ERROR_CODES, ROLES } from '../constants/index.js';

export const requireRestaurant = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new AppError('User authentication required.', 401, ERROR_CODES.UNAUTHORIZED));
  }

  if ((req.user.role === ROLES.RESTAURANT_ADMIN || req.user.role === ROLES.KITCHEN_STAFF) && !req.user.restaurantId) {
    return next(
      new AppError('Restaurant Admin account is not assigned to a restaurant.', 400, ERROR_CODES.BAD_REQUEST)
    );
  }

  next();
};
