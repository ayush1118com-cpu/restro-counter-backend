import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name is required'),
  description: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});
