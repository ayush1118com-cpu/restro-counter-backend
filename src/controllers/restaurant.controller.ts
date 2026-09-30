import { Request, Response, NextFunction } from 'express';
import { RestaurantService } from '../services/restaurant.service.js';
import {
  createRestaurantSchema,
  updateRestaurantSchema,
  updateRestaurantStatusSchema,
} from '../validators/restaurant.validator.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';

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

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await RestaurantService.getRestaurantById(id);
      sendSuccess(res, 'Restaurant details retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
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
}
