import { Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service.js';
import { sendSuccess } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import { ROLES } from '../constants/index.js';

export class ReportController {
  public static async getSalesReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const isSuperAdmin = req.user!.role === ROLES.SUPER_ADMIN;
      const targetRestaurantId = isSuperAdmin
        ? (req.query.restaurantId as string) || null
        : req.user!.restaurantId;

      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      const report = await ReportService.getSalesReport(targetRestaurantId, startDate, endDate);
      sendSuccess(res, 'Sales report retrieved successfully', report);
    } catch (error) {
      next(error);
    }
  }

  public static async getOrdersReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const isSuperAdmin = req.user!.role === ROLES.SUPER_ADMIN;
      const targetRestaurantId = isSuperAdmin
        ? (req.query.restaurantId as string) || null
        : req.user!.restaurantId;

      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      const report = await ReportService.getOrdersReport(targetRestaurantId, startDate, endDate);
      sendSuccess(res, 'Orders report retrieved successfully', report);
    } catch (error) {
      next(error);
    }
  }

  public static async getPaymentReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const isSuperAdmin = req.user!.role === ROLES.SUPER_ADMIN;
      const targetRestaurantId = isSuperAdmin
        ? (req.query.restaurantId as string) || null
        : req.user!.restaurantId;

      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      const report = await ReportService.getPaymentReport(targetRestaurantId, startDate, endDate);
      sendSuccess(res, 'Payments report retrieved successfully', report);
    } catch (error) {
      next(error);
    }
  }
}
