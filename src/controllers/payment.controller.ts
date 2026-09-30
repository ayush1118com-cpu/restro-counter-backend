import { Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service.js';
import { createPaymentSchema } from '../validators/payment.validator.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';
import { AuthRequest } from '../types/index.js';

export class PaymentController {
  public static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createPaymentSchema.parse(req.body);
      const payment = await PaymentService.createPayment(req.user!.restaurantId!, validatedData);
      sendSuccess(res, 'Payment recorded successfully', payment, 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const pagination = parsePagination(req);
      const filters = {
        method: req.query.method as string,
        status: req.query.status as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };

      const result = await PaymentService.getPayments(req.user!.restaurantId!, pagination, filters);
      sendPaginated(res, 'Payment records retrieved successfully', result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const payment = await PaymentService.getPaymentById(req.user!.restaurantId!, id);
      sendSuccess(res, 'Payment details retrieved', payment);
    } catch (error) {
      next(error);
    }
  }
}
