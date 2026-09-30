import { Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service.js';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validator.js';
import { sendSuccess } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';

export class CategoryController {
  public static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createCategorySchema.parse(req.body);
      const category = await CategoryService.createCategory(req.user!.restaurantId!, validatedData, req.file);
      sendSuccess(res, 'Category created successfully', category, 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await CategoryService.getCategories(req.user!.restaurantId!);
      sendSuccess(res, 'Categories retrieved successfully', categories);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const category = await CategoryService.getCategoryById(req.user!.restaurantId!, id);
      sendSuccess(res, 'Category retrieved', category);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const validatedData = updateCategorySchema.parse(req.body);
      const category = await CategoryService.updateCategory(req.user!.restaurantId!, id, validatedData, req.file);
      sendSuccess(res, 'Category updated successfully', category);
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await CategoryService.deleteCategory(req.user!.restaurantId!, id);
      sendSuccess(res, 'Category deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
