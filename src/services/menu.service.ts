import { MenuItem } from '../models/MenuItem.js';
import { Category } from '../models/Category.js';
import { AppError } from '../middleware/error.middleware.js';
import { ERROR_CODES } from '../constants/index.js';
import { ParsedPagination } from '../utils/pagination.js';
import { CloudinaryService } from './cloudinary.service.js';

export class MenuService {
  public static async createMenuItem(
    restaurantId: string,
    data: any,
    imageFile?: Express.Multer.File
  ) {
    const category = await Category.findOne({ _id: data.categoryId, restaurantId });
    if (!category) {
      throw new AppError('Specified Category not found in your restaurant menu.', 404, ERROR_CODES.NOT_FOUND);
    }

    let imageData = data.image; // Assume existing URL or base64
    if (imageFile) {
      imageData = await CloudinaryService.uploadImage(imageFile.buffer, 'restro-counter/menu');
    }

    const menuItem = await MenuItem.create({
      restaurantId,
      categoryId: data.categoryId,
      name: data.name,
      description: data.description,
      price: data.price,
      discountPrice: data.discountPrice,
      image: imageData,
      isAvailable: data.isAvailable ?? true,
      isActive: true,
    });

    return menuItem;
  }

  public static async getMenuItems(
    restaurantId: string,
    pagination: ParsedPagination,
    categoryId?: string,
    isAvailable?: boolean
  ) {
    const query: any = { restaurantId, isActive: true };

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable;
    }

    if (pagination.search) {
      query.$or = [
        { name: { $regex: pagination.search, $options: 'i' } },
        { description: { $regex: pagination.search, $options: 'i' } },
      ];
    }

    const total = await MenuItem.countDocuments(query);
    const items = await MenuItem.find(query)
      .populate('categoryId', 'name')
      .sort({ [pagination.sortBy]: pagination.sortOrder })
      .skip(pagination.skip)
      .limit(pagination.limit);

    return {
      data: items,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  public static async getMenuItemById(restaurantId: string, id: string) {
    const menuItem = await MenuItem.findOne({ _id: id, restaurantId }).populate('categoryId', 'name');
    if (!menuItem) {
      throw new AppError('Menu item not found or unauthorized access.', 404, ERROR_CODES.NOT_FOUND);
    }
    return menuItem;
  }

  public static async updateMenuItem(
    restaurantId: string,
    id: string,
    data: any,
    imageFile?: Express.Multer.File
  ) {
    const menuItem = await MenuItem.findOne({ _id: id, restaurantId });
    if (!menuItem) {
      throw new AppError('Menu item not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    if (data.categoryId) {
      const category = await Category.findOne({ _id: data.categoryId, restaurantId });
      if (!category) {
        throw new AppError('Target category not found in your restaurant.', 404, ERROR_CODES.NOT_FOUND);
      }
      menuItem.categoryId = data.categoryId;
    }

    if (imageFile) {
      if (menuItem.image?.public_id) {
        await CloudinaryService.deleteImage(menuItem.image.public_id);
      }
      const imageData = await CloudinaryService.uploadImage(imageFile.buffer, 'restro-counter/menu');
      menuItem.image = imageData;
    } else if (data.image !== undefined) {
      menuItem.image = data.image;
    }

    if (data.name) menuItem.name = data.name;
    if (data.description !== undefined) menuItem.description = data.description;
    if (data.price !== undefined) menuItem.price = data.price;
    if (data.discountPrice !== undefined) menuItem.discountPrice = data.discountPrice;
    if (data.isAvailable !== undefined) menuItem.isAvailable = data.isAvailable;
    if (data.isActive !== undefined) menuItem.isActive = data.isActive;

    await menuItem.save();
    return menuItem;
  }

  public static async updateMenuItemAvailability(restaurantId: string, id: string, isAvailable: boolean) {
    const menuItem = await MenuItem.findOne({ _id: id, restaurantId });
    if (!menuItem) {
      throw new AppError('Menu item not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    menuItem.isAvailable = isAvailable;
    await menuItem.save();
    return menuItem;
  }

  public static async deleteMenuItem(restaurantId: string, id: string) {
    const menuItem = await MenuItem.findOne({ _id: id, restaurantId });
    if (!menuItem) {
      throw new AppError('Menu item not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    if (menuItem.image?.public_id) {
      await CloudinaryService.deleteImage(menuItem.image.public_id);
    }

    await menuItem.deleteOne();
    return true;
  }
}
