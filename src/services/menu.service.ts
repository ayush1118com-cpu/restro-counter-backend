import mongoose from 'mongoose';
import { MenuItem } from '../models/MenuItem.js';
import { Category } from '../models/Category.js';
import { Restaurant } from '../models/Restaurant.js';
import { AppError } from '../middleware/error.middleware.js';
import { ERROR_CODES } from '../constants/index.js';
import { ParsedPagination } from '../utils/pagination.js';
import { CloudinaryService } from './cloudinary.service.js';
import { logger } from '../utils/logger.js';

export class MenuService {
  public static async createMenuItem(
    restaurantId: string,
    data: any,
    imageFile?: Express.Multer.File
  ) {
    // Smart Category Resolution (by ObjectId, by Name, or Auto-Create)
    let category = null;
    if (data.categoryId && mongoose.Types.ObjectId.isValid(data.categoryId)) {
      category = await Category.findOne({ _id: data.categoryId, restaurantId });
    }

    if (!category && data.categoryId && typeof data.categoryId === 'string') {
      category = await Category.findOne({
        restaurantId,
        name: { $regex: new RegExp(`^${data.categoryId.trim()}$`, 'i') },
      });
    }

    if (!category && data.categoryName && typeof data.categoryName === 'string') {
      category = await Category.findOne({
        restaurantId,
        name: { $regex: new RegExp(`^${data.categoryName.trim()}$`, 'i') },
      });
    }

    if (!category) {
      const catName =
        (typeof data.categoryId === 'string' && !mongoose.Types.ObjectId.isValid(data.categoryId) && data.categoryId.trim()) ||
        data.categoryName ||
        'General';

      category = await Category.create({
        restaurantId,
        name: catName,
        description: `${catName} items`,
        isActive: true,
        sortOrder: 0,
      });
    }

    data.categoryId = category._id;

    let imageData: { secure_url: string; public_id?: string } | undefined = undefined;
    if (imageFile) {
      try {
        imageData = await CloudinaryService.uploadImage(imageFile.buffer, 'restro-counter/menu');
      } catch (err) {
        logger.warn('Cloudinary upload failed for file buffer, skipping upload');
      }
    } else if (typeof data.image === 'string' && data.image.startsWith('data:image')) {
      try {
        const base64Data = data.image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        imageData = await CloudinaryService.uploadImage(buffer, 'restro-counter/menu');
      } catch (err) {
        // Fallback: If Cloudinary fails, store the base64 data directly so user's image is retained
        imageData = { secure_url: data.image, public_id: '' };
      }
    } else if (typeof data.image === 'string' && data.image.trim()) {
      imageData = { secure_url: data.image.trim(), public_id: '' };
    } else if (data.image && typeof data.image === 'object' && data.image.secure_url) {
      imageData = { secure_url: data.image.secure_url, public_id: data.image.public_id || '' };
    }

    const menuItem = await MenuItem.create({
      restaurantId,
      categoryId: data.categoryId,
      name: data.name,
      description: data.description,
      price: data.price,
      discountPrice: data.discountPrice,
      image: imageData,
      requiresKitchen: data.requiresKitchen ?? true,
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
      let category = null;
      if (mongoose.Types.ObjectId.isValid(data.categoryId)) {
        category = await Category.findOne({ _id: data.categoryId, restaurantId });
      }

      if (!category && typeof data.categoryId === 'string') {
        category = await Category.findOne({
          restaurantId,
          name: { $regex: new RegExp(`^${data.categoryId.trim()}$`, 'i') },
        });
      }

      if (!category) {
        category = await Category.create({
          restaurantId,
          name: data.categoryId,
          description: `${data.categoryId} items`,
          isActive: true,
          sortOrder: 0,
        });
      }

      menuItem.categoryId = category._id;
    }

    if (imageFile) {
      if (menuItem.image?.public_id) {
        await CloudinaryService.deleteImage(menuItem.image.public_id).catch(() => {});
      }
      try {
        const imageData = await CloudinaryService.uploadImage(imageFile.buffer, 'restro-counter/menu');
        menuItem.image = imageData;
      } catch (err) {
        logger.warn('Cloudinary upload failed on update');
      }
    } else if (typeof data.image === 'string' && data.image.startsWith('data:image')) {
      if (menuItem.image?.public_id) {
        await CloudinaryService.deleteImage(menuItem.image.public_id).catch(() => {});
      }
      try {
        const base64Data = data.image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        const uploadResult = await CloudinaryService.uploadImage(buffer, 'restro-counter/menu');
        menuItem.image = uploadResult;
      } catch (err) {
        menuItem.image = { secure_url: data.image, public_id: '' };
      }
    } else if (typeof data.image === 'string' && data.image.trim()) {
      menuItem.image = { secure_url: data.image.trim(), public_id: '' };
    } else if (data.image && typeof data.image === 'object' && data.image.secure_url) {
      menuItem.image = { secure_url: data.image.secure_url, public_id: data.image.public_id || '' };
    } else if (data.image === '') {
      if (menuItem.image?.public_id) {
        await CloudinaryService.deleteImage(menuItem.image.public_id).catch(() => {});
      }
      menuItem.image = undefined;
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

  public static async getPublicMenu(restaurantId: string) {
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      throw new AppError('Invalid restaurant ID', 400, ERROR_CODES.BAD_REQUEST);
    }
    const restaurant = await Restaurant.findById(restaurantId).lean();
    const categories = await Category.find({ restaurantId, isActive: true }).sort({ sortOrder: 1 }).lean();
    const items = await MenuItem.find({ restaurantId, isActive: true, isAvailable: true }).populate('categoryId', 'name').lean();
    return {
      restaurant: restaurant
        ? {
            id: restaurant._id,
            name: restaurant.name,
            address: restaurant.address,
            city: restaurant.city,
            phone: restaurant.phone,
            gstRate: restaurant.gstRate,
            tableQrEnabled: restaurant.tableQrEnabled !== false,
            hasTableQrOrdering: restaurant.tableQrEnabled !== false,
          }
        : null,
      categories: categories.map((c) => ({
        id: c._id,
        name: c.name,
        description: c.description || '',
      })),
      items: items.map((i) => ({
        id: i._id,
        name: i.name,
        description: i.description || '',
        price: i.price,
        discountPrice: i.discountPrice,
        image: i.image?.secure_url || '',
        categoryId: (typeof i.categoryId === 'object' && (i.categoryId as any)?._id) ? (i.categoryId as any)._id : i.categoryId,
        categoryName: (typeof i.categoryId === 'object' && (i.categoryId as any)?.name) ? (i.categoryId as any).name : 'General',
        requiresKitchen: i.requiresKitchen !== false,
        isAvailable: i.isAvailable !== false,
      })),
    };
  }
}



