import { Restaurant } from '../models/Restaurant.js';
import { User } from '../models/User.js';
import { Counter } from '../models/Counter.js';
import { Category } from '../models/Category.js';
import { MenuItem } from '../models/MenuItem.js';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { hashPassword } from '../utils/password.js';
import { AppError } from '../middleware/error.middleware.js';
import { ERROR_CODES, RESTAURANT_STATUS, ROLES } from '../constants/index.js';
import { ParsedPagination } from '../utils/pagination.js';
import { CloudinaryService } from './cloudinary.service.js';
import { EmailService } from './email.service.js';

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

    // Send Onboarding Credentials Email via Brevo asynchronously (non-blocking)
    EmailService.sendRestaurantOnboardingEmail({
      toEmail: email || adminEmail,
      recipientName: ownerName,
      restaurantName: name,
      adminEmail: adminEmail.toLowerCase(),
      adminPassword,
      kitchenEmail,
      kitchenPassword,
    }).catch((err) => {
      console.error('Failed to dispatch onboarding email:', err);
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

    if (data.name !== undefined) restaurant.name = data.name;
    if (data.ownerName !== undefined) restaurant.ownerName = data.ownerName;
    if (data.email !== undefined) restaurant.email = data.email;
    if (data.phone !== undefined) restaurant.phone = data.phone;
    if (data.address !== undefined) restaurant.address = data.address;
    if (data.city !== undefined) restaurant.city = data.city;
    if (data.gstin !== undefined) restaurant.gstin = data.gstin;
    if (data.gstRate !== undefined) restaurant.gstRate = Number(data.gstRate);
    if (data.receiptHeader !== undefined) restaurant.receiptHeader = data.receiptHeader;
    if (data.receiptFooter !== undefined) restaurant.receiptFooter = data.receiptFooter;

    await restaurant.save();

    // Sync admin user profile name/phone if updated
    if (data.ownerName || data.phone) {
      await User.updateMany(
        { restaurantId: id, role: ROLES.RESTAURANT_ADMIN },
        {
          ...(data.ownerName ? { name: `${data.ownerName} (Counter Admin)` } : {}),
          ...(data.phone ? { phone: data.phone } : {}),
        }
      );
    }

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

  public static async deleteRestaurant(id: string) {
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      throw new AppError('Restaurant not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    if (restaurant.logo?.public_id) {
      try {
        await CloudinaryService.deleteImage(restaurant.logo.public_id);
      } catch (err) {
        console.error('Failed to delete restaurant logo from Cloudinary:', err);
      }
    }

    // Delete related entities for this restaurant
    await Promise.all([
      Restaurant.findByIdAndDelete(id),
      User.deleteMany({ restaurantId: id }),
      Category.deleteMany({ restaurantId: id }),
      MenuItem.deleteMany({ restaurantId: id }),
      Order.deleteMany({ restaurantId: id }),
      Payment.deleteMany({ restaurantId: id }),
      Counter.deleteMany({ restaurantId: id }),
    ]);

    return { id, name: restaurant.name };
  }

  public static async updateRestaurantAdminPassword(id: string, newPassword: string) {
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      throw new AppError('Restaurant not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    const hashedPassword = await hashPassword(newPassword);
    const updatedUser = await User.findOneAndUpdate(
      { restaurantId: id, role: ROLES.RESTAURANT_ADMIN },
      { password: hashedPassword },
      { new: true }
    );

    // Also synchronize password for Kitchen Staff account of this restaurant
    await User.updateMany(
      { restaurantId: id, role: ROLES.KITCHEN_STAFF },
      { password: hashedPassword }
    );

    if (!updatedUser) {
      throw new AppError('Admin user account for this restaurant was not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    return { success: true, email: updatedUser.email, restaurantName: restaurant.name };
  }
}
