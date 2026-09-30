import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { loginSchema, changePasswordSchema, refreshTokenSchema } from '../validators/auth.validator.js';
import { sendSuccess } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await AuthService.login(validatedData);
      sendSuccess(res, 'Login successful', result);
    } catch (error) {
      next(error);
    }
  }

  public static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = refreshTokenSchema.parse(req.body);
      const result = await AuthService.refreshAccessToken(validatedData.refreshToken);
      sendSuccess(res, 'Token refreshed successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AuthService.getCurrentUser(req.user!._id);
      sendSuccess(res, 'User profile retrieved', user);
    } catch (error) {
      next(error);
    }
  }

  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }

  public static async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = changePasswordSchema.parse(req.body);
      await AuthService.changePassword(req.user!._id, validatedData);
      sendSuccess(res, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }
}
