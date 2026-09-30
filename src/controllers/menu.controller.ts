import { Response, NextFunction } from 'express';
import { MenuService } from '../services/menu.service.js';
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  updateMenuAvailabilitySchema,
} from '../validators/menu.validator.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';
import { AuthRequest } from '../types/index.js';

export class MenuController {
  public static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createMenuItemSchema.parse(req.body);
      const menuItem = await MenuService.createMenuItem(req.user!.restaurantId!, validatedData, req.file);
      sendSuccess(res, 'Menu item created successfully', menuItem, 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const pagination = parsePagination(req);
      const categoryId = req.query.categoryId as string;
      const isAvailable = req.query.isAvailable ? req.query.isAvailable === 'true' : undefined;

      const result = await MenuService.getMenuItems(
        req.user!.restaurantId!,
        pagination,
        categoryId,
        isAvailable
      );
      sendPaginated(res, 'Menu items retrieved successfully', result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const menuItem = await MenuService.getMenuItemById(req.user!.restaurantId!, id);
      sendSuccess(res, 'Menu item retrieved', menuItem);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const validatedData = updateMenuItemSchema.parse(req.body);
      const menuItem = await MenuService.updateMenuItem(req.user!.restaurantId!, id, validatedData, req.file);
      sendSuccess(res, 'Menu item updated successfully', menuItem);
    } catch (error) {
      next(error);
    }
  }

  public static async updateAvailability(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const validatedData = updateMenuAvailabilitySchema.parse(req.body);
      const menuItem = await MenuService.updateMenuItemAvailability(
        req.user!.restaurantId!,
        id,
        validatedData.isAvailable
      );
      sendSuccess(res, `Menu item availability set to ${validatedData.isAvailable}`, menuItem);
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await MenuService.deleteMenuItem(req.user!.restaurantId!, id);
      sendSuccess(res, 'Menu item deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
