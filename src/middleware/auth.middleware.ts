import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { Restaurant } from '../models/Restaurant.js';
import { AuthRequest } from '../types/index.js';
import { AppError } from './error.middleware.js';
import { ERROR_CODES, RESTAURANT_STATUS, ROLES } from '../constants/index.js';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Missing Bearer token.', 401, ERROR_CODES.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new AppError('User account not found or deactivated.', 401, ERROR_CODES.UNAUTHORIZED);
    }

    if ((user.role === ROLES.RESTAURANT_ADMIN || user.role === ROLES.KITCHEN_STAFF) && user.restaurantId) {
      const restaurant = await Restaurant.findById(user.restaurantId);
      if (!restaurant) {
        throw new AppError('Associated restaurant not found.', 404, ERROR_CODES.NOT_FOUND);
      }

      if (restaurant.status === RESTAURANT_STATUS.SUSPENDED) {
        throw new AppError(
          'Your restaurant account is suspended. Please contact Super Admin.',
          403,
          ERROR_CODES.RESTAURANT_SUSPENDED
        );
      }

      if (restaurant.status === RESTAURANT_STATUS.BLOCKED) {
        throw new AppError(
          'Your restaurant account is blocked. Access denied.',
          403,
          ERROR_CODES.RESTAURANT_BLOCKED
        );
      }
    }

    req.user = {
      _id: (user._id as any).toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      restaurantId: user.restaurantId ? (user.restaurantId as any).toString() : null,
      isActive: user.isActive,
    };

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new AppError('Invalid or expired authentication token.', 401, ERROR_CODES.UNAUTHORIZED));
    } else {
      next(error);
    }
  }
};
