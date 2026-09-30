import { z } from 'zod';
import { RESTAURANT_STATUS } from '../constants/index.js';

export const createRestaurantSchema = z.object({
  name: z.string().min(2, 'Restaurant name is required'),
  ownerName: z.string().min(2, 'Owner name is required'),
  email: z.string().email('Valid owner email is required'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  address: z.string().min(3, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  adminEmail: z.string().email('Valid admin login email is required'),
  adminPassword: z.string().min(6, 'Admin password must be at least 6 characters'),
});

export const updateRestaurantSchema = z.object({
  name: z.string().min(2).optional(),
  ownerName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  address: z.string().min(3).optional(),
  city: z.string().min(2).optional(),
});

export const updateRestaurantStatusSchema = z.object({
  status: z.enum([RESTAURANT_STATUS.ACTIVE, RESTAURANT_STATUS.SUSPENDED, RESTAURANT_STATUS.BLOCKED]),
});
