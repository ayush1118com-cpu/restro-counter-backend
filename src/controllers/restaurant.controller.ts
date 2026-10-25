import { Request, Response, NextFunction } from 'express';
import { RestaurantService } from '../services/restaurant.service.js';
import {
  createRestaurantSchema,
  updateRestaurantSchema,
  updateRestaurantStatusSchema,
  updateRestaurantPasswordSchema,
} from '../validators/restaurant.validator.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';
import { AuthRequest } from '../types/index.js';
import { AppError } from '../middleware/error.middleware.js';
import { ERROR_CODES, ROLES } from '../constants/index.js';

export class RestaurantController {
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createRestaurantSchema.parse(req.body);
      const result = await RestaurantService.createRestaurant(validatedData, req.file);
      sendSuccess(res, 'Restaurant and Admin account created successfully', result, 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pagination = parsePagination(req);
      const statusFilter = req.query.status as string;
      const result = await RestaurantService.getAllRestaurants(pagination, statusFilter);
      sendPaginated(res, 'Restaurants retrieved successfully', result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  public static async getMyRestaurant(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.user?.restaurantId;
      if (!id) {
        throw new AppError('User is not assigned to a restaurant.', 400, ERROR_CODES.BAD_REQUEST);
      }
      const result = await RestaurantService.getRestaurantById(id);
      sendSuccess(res, 'Restaurant details retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async updateMyRestaurant(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.user?.restaurantId;
      if (!id) {
        throw new AppError('User is not assigned to a restaurant.', 400, ERROR_CODES.BAD_REQUEST);
      }
      const validatedData = updateRestaurantSchema.parse(req.body);
      const result = await RestaurantService.updateRestaurant(id, validatedData, req.file);
      sendSuccess(res, 'Restaurant settings updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      if (req.user?.role !== ROLES.SUPER_ADMIN && req.user?.restaurantId !== id) {
        throw new AppError('Unauthorized access to this restaurant.', 403, ERROR_CODES.FORBIDDEN);
      }
      const result = await RestaurantService.getRestaurantById(id);
      sendSuccess(res, 'Restaurant details retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      if (req.user?.role !== ROLES.SUPER_ADMIN && req.user?.restaurantId !== id) {
        throw new AppError('Unauthorized to update this restaurant.', 403, ERROR_CODES.FORBIDDEN);
      }
      const validatedData = updateRestaurantSchema.parse(req.body);
      const result = await RestaurantService.updateRestaurant(id, validatedData, req.file);
      sendSuccess(res, 'Restaurant updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const validatedData = updateRestaurantStatusSchema.parse(req.body);
      const result = await RestaurantService.updateRestaurantStatus(id, validatedData.status);
      sendSuccess(res, `Restaurant status updated to ${validatedData.status}`, result);
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await RestaurantService.deleteRestaurant(id);
      sendSuccess(res, 'Restaurant deleted successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async updatePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const validatedData = updateRestaurantPasswordSchema.parse(req.body);
      const result = await RestaurantService.updateRestaurantAdminPassword(id, validatedData.password);
      sendSuccess(res, 'Restaurant Admin password updated successfully', result);
    } catch (error) {
      next(error);
    }
  }
}
