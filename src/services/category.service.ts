import { Category } from '../models/Category.js';
import { MenuItem } from '../models/MenuItem.js';
import { AppError } from '../middleware/error.middleware.js';
import { ERROR_CODES } from '../constants/index.js';
import { CloudinaryService } from './cloudinary.service.js';

export class CategoryService {
  public static async createCategory(restaurantId: string, data: any, imageFile?: Express.Multer.File) {
    const existing = await Category.findOne({ restaurantId, name: data.name });
    if (existing) {
      throw new AppError(`Category '${data.name}' already exists in your menu.`, 400, ERROR_CODES.DUPLICATE_RESOURCE);
    }

    let imageData;
    if (imageFile) {
      imageData = await CloudinaryService.uploadImage(imageFile.buffer, 'restro-counter/categories');
    }

    const category = await Category.create({
      restaurantId,
      name: data.name,
      description: data.description,
      sortOrder: data.sortOrder || 0,
      image: imageData,
      isActive: true,
    });

    return category;
  }

  public static async getCategories(restaurantId: string) {
    const categories = await Category.find({ restaurantId, isActive: true }).sort({ sortOrder: 1, createdAt: 1 });
    return categories;
  }

  public static async getCategoryById(restaurantId: string, id: string) {
    const category = await Category.findOne({ _id: id, restaurantId });
    if (!category) {
      throw new AppError('Category not found or does not belong to your restaurant.', 404, ERROR_CODES.NOT_FOUND);
    }
    return category;
  }

  public static async updateCategory(
    restaurantId: string,
    id: string,
    data: any,
    imageFile?: Express.Multer.File
  ) {
    const category = await Category.findOne({ _id: id, restaurantId });
    if (!category) {
      throw new AppError('Category not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    if (imageFile) {
      if (category.image?.public_id) {
        await CloudinaryService.deleteImage(category.image.public_id);
      }
      const imageData = await CloudinaryService.uploadImage(imageFile.buffer, 'restro-counter/categories');
      category.image = imageData;
    }

    if (data.name) category.name = data.name;
    if (data.description !== undefined) category.description = data.description;
    if (data.sortOrder !== undefined) category.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) category.isActive = data.isActive;

    await category.save();
    return category;
  }

  public static async deleteCategory(restaurantId: string, id: string) {
    const category = await Category.findOne({ _id: id, restaurantId });
    if (!category) {
      throw new AppError('Category not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    const linkedItemsCount = await MenuItem.countDocuments({ categoryId: id });
    if (linkedItemsCount > 0) {
      throw new AppError(
        `Cannot delete category containing ${linkedItemsCount} menu items. Reassign or remove items first.`,
        400,
        ERROR_CODES.BAD_REQUEST
      );
    }

    if (category.image?.public_id) {
      await CloudinaryService.deleteImage(category.image.public_id);
    }

    await category.deleteOne();
    return true;
  }
}
