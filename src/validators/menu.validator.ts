import { z } from 'zod';

export const createMenuItemSchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),
  name: z.string().min(2, 'Item name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  discountPrice: z.number().min(0).optional(),
  requiresKitchen: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
});

export const updateMenuItemSchema = z.object({
  categoryId: z.string().optional(),
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  discountPrice: z.number().min(0).optional(),
  requiresKitchen: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const updateMenuAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});
