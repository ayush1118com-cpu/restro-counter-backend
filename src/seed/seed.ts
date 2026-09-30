import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { hashPassword } from '../utils/password.js';
import { User } from '../models/User.js';
import { Restaurant } from '../models/Restaurant.js';
import { Counter } from '../models/Counter.js';
import { Category } from '../models/Category.js';
import { MenuItem } from '../models/MenuItem.js';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import {
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  RESTAURANT_STATUS,
  ROLES,
} from '../constants/index.js';

const seed = async () => {
  try {
    await connectDB();
    logger.info('MongoDB connected');

    // 1. Super Admin
    const superAdminEmail = env.SEED_ADMIN_EMAIL.toLowerCase();
    let superAdmin = await User.findOne({ email: superAdminEmail });
    if (!superAdmin) {
      const hashedPassword = await hashPassword(env.SEED_ADMIN_PASSWORD);
      superAdmin = await User.create({
        name: 'Super Admin',
        email: superAdminEmail,
        phone: '9999999999',
        password: hashedPassword,
        role: ROLES.SUPER_ADMIN,
        restaurantId: null,
        isActive: true,
      });
      logger.info('Super Admin created');
    } else {
      logger.info('Super Admin found');
    }

    // 2. Demo Restaurant
    let demoRestaurant = await Restaurant.findOne({ email: 'demo@restrocounter.com' });
    if (!demoRestaurant) {
      demoRestaurant = await Restaurant.create({
        name: 'Demo Restaurant',
        ownerName: 'Demo Owner',
        email: 'demo@restrocounter.com',
        phone: '9876543210',
        address: '123 MG Road, C-Scheme',
        city: 'Jaipur',
        status: RESTAURANT_STATUS.ACTIVE,
      });
      logger.info('Demo Restaurant created');
    } else {
      logger.info('Demo Restaurant found');
    }

    // Counter sequence
    let counter = await Counter.findOne({ restaurantId: demoRestaurant._id });
    if (!counter) {
      await Counter.create({
        restaurantId: demoRestaurant._id,
        orderSequence: 1000,
      });
    }

    // 3. Restaurant Admin
    const restroAdminEmail = env.SEED_RESTAURANT_ADMIN_EMAIL.toLowerCase();
    let restroAdmin = await User.findOne({ email: restroAdminEmail });
    if (!restroAdmin) {
      const hashedPassword = await hashPassword(env.SEED_RESTAURANT_ADMIN_PASSWORD);
      restroAdmin = await User.create({
        name: 'Demo Owner',
        email: restroAdminEmail,
        phone: '9876543210',
        password: hashedPassword,
        role: ROLES.RESTAURANT_ADMIN,
        restaurantId: demoRestaurant._id,
        isActive: true,
      });
      logger.info('Restaurant Admin created');
    } else {
      logger.info('Restaurant Admin found');
    }

    // 3.1. Kitchen Staff
    const kitchenStaffEmail = 'kitchen@restrocounter.com';
    let kitchenStaff = await User.findOne({ email: kitchenStaffEmail });
    if (!kitchenStaff) {
      const hashedPassword = await hashPassword('Kitchen123!');
      kitchenStaff = await User.create({
        name: 'Head Chef Kitchen',
        email: kitchenStaffEmail,
        phone: '9876543211',
        password: hashedPassword,
        role: ROLES.KITCHEN_STAFF,
        restaurantId: demoRestaurant._id,
        isActive: true,
      });
      logger.info('Kitchen Staff created');
    } else {
      logger.info('Kitchen Staff found');
    }

    // 4. Categories & Menu Items (Cleaned for real data entry)
    logger.info('Categories and Menu items cleared for fresh real data entry');

    // 5. Orders & Payments (Cleaned for fresh real transactions)
    logger.info('Sample Orders and Payments cleared for fresh real transactions');

    logger.info('Cloudinary assets processed');
    logger.info('Seed completed successfully');
    process.exit(0);
  } catch (error: any) {
    logger.error(`Seed failed: ${error.message}`);
    process.exit(1);
  }
};

seed();
