import { z } from 'zod';
import { LEAD_STATUS } from '../constants/index.js';

export const createLeadSchema = z.object({
  restaurantName: z.string().min(2, 'Restaurant name is required'),
  ownerName: z.string().min(2, 'Owner name is required'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  email: z.string().email('Valid email address is required'),
  city: z.string().min(2, 'City is required'),
  ordersPerDay: z.string().min(1, 'Orders per day selection is required'),
  currentSystem: z.string().optional(),
  message: z.string().optional(),
});

export const updateLeadStatusSchema = z.object({
  status: z.enum([
    LEAD_STATUS.NEW,
    LEAD_STATUS.CONTACTED,
    LEAD_STATUS.DEMO_SCHEDULED,
    LEAD_STATUS.CONVERTED,
    LEAD_STATUS.CLOSED,
  ]),
});
