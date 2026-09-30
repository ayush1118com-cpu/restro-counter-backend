import { z } from 'zod';

export const createMenuItemSchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),
  name: z.string().min(2, 'Item name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  discountPrice: z.coerce.number().min(0).optional(),
  requiresKitchen: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
  isAvailable: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
  image: z.string().optional(),
});

export const updateMenuItemSchema = z.object({
  categoryId: z.string().optional(),
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  discountPrice: z.coerce.number().min(0).optional(),
  requiresKitchen: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
  isAvailable: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
  isActive: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
  image: z.string().optional(),
});

export const updateMenuAvailabilitySchema = z.object({
  isAvailable: z.preprocess((val) => val === 'true' || val === true, z.boolean()),
});
