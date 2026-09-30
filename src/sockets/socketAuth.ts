import { Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { Restaurant } from '../models/Restaurant.js';
import { RESTAURANT_STATUS, ROLES } from '../constants/index.js';
import { logger } from '../utils/logger.js';

export interface AuthenticatedSocket extends Socket {
  user?: {
    userId: string;
    email: string;
    role: string;
    restaurantId: string | null;
  };
}

export const socketAuthMiddleware = async (
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication token missing for socket connection.'));
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return next(new Error('User account not found or deactivated.'));
    }

    if ((user.role === ROLES.RESTAURANT_ADMIN || user.role === ROLES.KITCHEN_STAFF) && user.restaurantId) {
      const restaurant = await Restaurant.findById(user.restaurantId);
      if (!restaurant || restaurant.status !== RESTAURANT_STATUS.ACTIVE) {
        return next(
          new Error(`Restaurant is not active (Status: ${restaurant?.status || 'NOT_FOUND'}).`)
        );
      }
    }

    socket.user = {
      userId: (user._id as any).toString(),
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId ? (user.restaurantId as any).toString() : null,
    };

    next();
  } catch (error: any) {
    logger.error(`Socket authentication failed: ${error.message}`);
    next(new Error('Invalid or expired socket authentication token.'));
  }
};
