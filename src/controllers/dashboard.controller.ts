import { Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service.js';
import { sendSuccess } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';

export class DashboardController {
  public static async getSuperAdminMetrics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await DashboardService.getSuperAdminDashboardMetrics();
      sendSuccess(res, 'Super admin dashboard metrics retrieved', metrics);
    } catch (error) {
      next(error);
    }
  }

  public static async getRestaurantMetrics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await DashboardService.getRestaurantDashboardMetrics(req.user!.restaurantId!);
      sendSuccess(res, 'Restaurant dashboard metrics retrieved', metrics);
    } catch (error) {
      next(error);
    }
  }
}
