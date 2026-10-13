import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { AppError } from './error.middleware.js';
import { ERROR_CODES, ROLES } from '../constants/index.js';
import { Restaurant } from '../models/Restaurant.js';

export const requireRestaurant = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    return next(new AppError('User authentication required.', 401, ERROR_CODES.UNAUTHORIZED));
  }

  // If SUPER_ADMIN is operating on menu/categories/orders, resolve to target or first restaurant
  if (req.user.role === ROLES.SUPER_ADMIN) {
    try {
      const targetId =
        (req.headers['x-restaurant-id'] as string) ||
        (req.headers['restaurantid'] as string) ||
        (req.query?.restaurantId as string) ||
        (req.body?.restaurantId as string);

      if (targetId) {
        req.user.restaurantId = targetId;
      } else if (!req.user.restaurantId) {
        const firstRest = await Restaurant.findOne();
        if (firstRest) {
          req.user.restaurantId = firstRest._id.toString();
        }
      }
    } catch {
      // Non-blocking fallback
    }
  }

  if ((req.user.role === ROLES.RESTAURANT_ADMIN || req.user.role === ROLES.KITCHEN_STAFF) && !req.user.restaurantId) {
    return next(
      new AppError('Restaurant Admin account is not assigned to a restaurant.', 400, ERROR_CODES.BAD_REQUEST)
    );
  }

  next();
};
