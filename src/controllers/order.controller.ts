import { Response, NextFunction, Request } from 'express';
import { OrderService } from '../services/order.service.js';
import { createOrderSchema, updateOrderStatusSchema, addOrderItemsSchema, createPublicTableOrderSchema } from '../validators/order.validator.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';
import { AuthRequest } from '../types/index.js';

export class OrderController {
  public static async createTableOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createPublicTableOrderSchema.parse(req.body);
      const order = await OrderService.createPublicTableOrder(validatedData.restaurantId, validatedData);
      sendSuccess(res, 'Table order placed successfully', order, 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getActiveTableOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const restaurantId = req.query.restaurantId as string;
      const tableNumber = req.query.tableNumber as string;
      const activeOrder = await OrderService.getActiveTableOrder(restaurantId, tableNumber);
      sendSuccess(res, 'Active table order retrieved', activeOrder);
    } catch (error) {
      next(error);
    }
  }

  public static async getPublicTrack(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const order = await OrderService.getPublicTrack(id);
      sendSuccess(res, 'Order tracking details retrieved', order);
    } catch (error) {
      next(error);
    }
  }

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

      const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
      const explicitRestId = (req.headers['x-restaurant-id'] as string) || (req.query.restaurantId as string);
      const targetRestId: string | undefined = isSuperAdmin && !explicitRestId ? undefined : (explicitRestId || req.user?.restaurantId || undefined);

      const result = await OrderService.getOrders(targetRestId, pagination, filters);
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

  public static async addItems(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const validatedData = addOrderItemsSchema.parse(req.body);
      const order = await OrderService.addItemsToOrder(
        req.user!.restaurantId!,
        id,
        validatedData.items as any,
        validatedData.paymentMethod
      );
      sendSuccess(res, 'Items added to order successfully', order);
    } catch (error) {
      next(error);
    }
  }
}
