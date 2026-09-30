import { Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service.js';
import { createOrderSchema, updateOrderStatusSchema } from '../validators/order.validator.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';
import { AuthRequest } from '../types/index.js';

export class OrderController {
  public static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createOrderSchema.parse(req.body);
      const order = await OrderService.createOrder(req.user!, validatedData);
      sendSuccess(res, 'Order created successfully', order, 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const pagination = parsePagination(req);
      const filters = {
        status: req.query.status as string,
        paymentStatus: req.query.paymentStatus as string,
        paymentMethod: req.query.paymentMethod as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };

      const result = await OrderService.getOrders(req.user!.restaurantId!, pagination, filters);
      sendPaginated(res, 'Orders retrieved successfully', result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await OrderService.getOrderById(req.user!.restaurantId!, id);
      sendSuccess(res, 'Order details retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  public static async updateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const validatedData = updateOrderStatusSchema.parse(req.body);
      const order = await OrderService.updateOrderStatus(
        req.user!.restaurantId!,
        id,
        validatedData.status
      );
      sendSuccess(res, `Order status updated to ${validatedData.status}`, order);
    } catch (error) {
      next(error);
    }
  }

  public static async getBill(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const billData = await OrderService.getOrderBill(req.user!.restaurantId!, id);
      sendSuccess(res, 'Order bill data retrieved for printing', billData);
    } catch (error) {
      next(error);
    }
  }
}
