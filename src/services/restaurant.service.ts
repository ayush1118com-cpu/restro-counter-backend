import { Restaurant } from '../models/Restaurant.js';
import { User } from '../models/User.js';
import { Counter } from '../models/Counter.js';
import { hashPassword } from '../utils/password.js';
import { AppError } from '../middleware/error.middleware.js';
import { ERROR_CODES, RESTAURANT_STATUS, ROLES } from '../constants/index.js';
import { ParsedPagination } from '../utils/pagination.js';
import { CloudinaryService } from './cloudinary.service.js';

export class RestaurantService {
  public static async createRestaurant(data: any, logoFile?: Express.Multer.File) {
    const { name, ownerName, email, phone, address, city, adminEmail, adminPassword } = data;

    const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existingUser) {
      throw new AppError('An account with this admin email already exists.', 400, ERROR_CODES.DUPLICATE_RESOURCE);
    }

    let logoData;
    if (logoFile) {
      logoData = await CloudinaryService.uploadImage(logoFile.buffer, 'restro-counter/logos');
    }

    const restaurant = await Restaurant.create({
      name,
      ownerName,
      email,
      phone,
      address,
      city,
      logo: logoData,
      status: RESTAURANT_STATUS.ACTIVE,
    });

    await Counter.create({
      restaurantId: restaurant._id,
      orderSequence: 1000,
    });

    const hashedPassword = await hashPassword(adminPassword);
    const adminUser = await User.create({
      name: `${ownerName} (Counter Admin)`,
      email: adminEmail.toLowerCase(),
      phone,
      password: hashedPassword,
      role: ROLES.RESTAURANT_ADMIN,
      restaurantId: restaurant._id,
      isActive: true,
    });

    // Auto-create Kitchen Staff account for KDS station
    const kitchenEmail = data.kitchenEmail ? data.kitchenEmail.toLowerCase() : `kitchen.${adminEmail.toLowerCase()}`;
    const kitchenPassword = data.kitchenPassword ? data.kitchenPassword : adminPassword;
    const hashedKitchenPassword = await hashPassword(kitchenPassword);

    const kitchenUser = await User.create({
      name: `${name} (Kitchen Chef)`,
      email: kitchenEmail,
      phone,
      password: hashedKitchenPassword,
      role: ROLES.KITCHEN_STAFF,
      restaurantId: restaurant._id,
      isActive: true,
    });

    return {
      restaurant,
      admin: {
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      },
      kitchen: {
        _id: kitchenUser._id,
        name: kitchenUser.name,
        email: kitchenUser.email,
        role: kitchenUser.role,
      },
    };
  }

  public static async getAllRestaurants(pagination: ParsedPagination, statusFilter?: string) {
    const query: any = {};

    if (statusFilter && Object.values(RESTAURANT_STATUS).includes(statusFilter as any)) {
      query.status = statusFilter;
    }

    if (pagination.search) {
      query.$or = [
        { name: { $regex: pagination.search, $options: 'i' } },
        { ownerName: { $regex: pagination.search, $options: 'i' } },
        { city: { $regex: pagination.search, $options: 'i' } },
        { email: { $regex: pagination.search, $options: 'i' } },
      ];
    }

    const total = await Restaurant.countDocuments(query);
    const restaurants = await Restaurant.find(query)
      .sort({ [pagination.sortBy]: pagination.sortOrder })
      .skip(pagination.skip)
      .limit(pagination.limit);

    return {
      data: restaurants,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  public static async getRestaurantById(id: string) {
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      throw new AppError('Restaurant not found.', 404, ERROR_CODES.NOT_FOUND);
    }
    const adminUser = await User.findOne({ restaurantId: id, role: ROLES.RESTAURANT_ADMIN });
    return { restaurant, adminUser };
  }

  public static async updateRestaurant(id: string, data: any, logoFile?: Express.Multer.File) {
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      throw new AppError('Restaurant not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    if (logoFile) {
      if (restaurant.logo?.public_id) {
        await CloudinaryService.deleteImage(restaurant.logo.public_id);
      }
      const logoData = await CloudinaryService.uploadImage(logoFile.buffer, 'restro-counter/logos');
      restaurant.logo = logoData;
    }

    if (data.name) restaurant.name = data.name;
    if (data.ownerName) restaurant.ownerName = data.ownerName;
    if (data.email) restaurant.email = data.email;
    if (data.phone) restaurant.phone = data.phone;
    if (data.address) restaurant.address = data.address;
    if (data.city) restaurant.city = data.city;

    await restaurant.save();
    return restaurant;
  }

  public static async updateRestaurantStatus(id: string, status: string) {
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      throw new AppError('Restaurant not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    restaurant.status = status as any;
    await restaurant.save();

    if (status === RESTAURANT_STATUS.SUSPENDED || status === RESTAURANT_STATUS.BLOCKED) {
      await User.updateMany({ restaurantId: id }, { isActive: false });
    } else if (status === RESTAURANT_STATUS.ACTIVE) {
      await User.updateMany({ restaurantId: id }, { isActive: true });
    }

    return restaurant;
  }
}
