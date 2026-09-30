import { User } from '../models/User.js';
import { Restaurant } from '../models/Restaurant.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { AppError } from '../middleware/error.middleware.js';
import { ERROR_CODES, RESTAURANT_STATUS, ROLES } from '../constants/index.js';

export class AuthService {
  public static async login(data: any) {
    const { email, password } = data;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      throw new AppError('Invalid email or password.', 401, ERROR_CODES.UNAUTHORIZED);
    }

    if (!user.isActive) {
      throw new AppError('User account has been deactivated.', 401, ERROR_CODES.UNAUTHORIZED);
    }

    const isMatch = await comparePassword(password, user.password!);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401, ERROR_CODES.UNAUTHORIZED);
    }

    let restaurantInfo = null;
    if ((user.role === ROLES.RESTAURANT_ADMIN || user.role === ROLES.KITCHEN_STAFF) && user.restaurantId) {
      const restaurant = await Restaurant.findById(user.restaurantId);
      if (!restaurant) {
        throw new AppError('Associated restaurant profile not found.', 404, ERROR_CODES.NOT_FOUND);
      }

      if (restaurant.status === RESTAURANT_STATUS.SUSPENDED) {
        throw new AppError(
          'Your restaurant subscription is suspended. Please contact support.',
          403,
          ERROR_CODES.RESTAURANT_SUSPENDED
        );
      }

      if (restaurant.status === RESTAURANT_STATUS.BLOCKED) {
        throw new AppError(
          'Your restaurant account is blocked.',
          403,
          ERROR_CODES.RESTAURANT_BLOCKED
        );
      }

      restaurantInfo = {
        _id: restaurant._id,
        name: restaurant.name,
        city: restaurant.city,
        status: restaurant.status,
        logo: restaurant.logo?.secure_url,
      };
    }

    const tokenPayload = {
      userId: (user._id as any).toString(),
      role: user.role,
      restaurantId: user.restaurantId ? (user.restaurantId as any).toString() : null,
      email: user.email,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        restaurantId: user.restaurantId,
        restaurant: restaurantInfo,
      },
      accessToken,
      refreshToken,
    };
  }

  public static async refreshAccessToken(refreshToken: string) {
    const { verifyRefreshToken } = await import('../utils/jwt.js');
    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new AppError('Invalid or inactive user account.', 401, ERROR_CODES.UNAUTHORIZED);
    }

    const tokenPayload = {
      userId: (user._id as any).toString(),
      role: user.role,
      restaurantId: user.restaurantId ? (user.restaurantId as any).toString() : null,
      email: user.email,
    };

    const accessToken = generateAccessToken(tokenPayload);
    return { accessToken };
  }

  public static async getCurrentUser(userId: string) {
    const user = await User.findById(userId).populate('restaurantId');
    if (!user) {
      throw new AppError('User profile not found.', 404, ERROR_CODES.NOT_FOUND);
    }
    return user;
  }

  public static async changePassword(userId: string, data: any) {
    const { currentPassword, newPassword } = data;

    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new AppError('User account not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    const isMatch = await comparePassword(currentPassword, user.password!);
    if (!isMatch) {
      throw new AppError('Current password provided is incorrect.', 400, ERROR_CODES.BAD_REQUEST);
    }

    user.password = await hashPassword(newPassword);
    await user.save();
    return true;
  }
}
