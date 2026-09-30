import { z } from 'zod';
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from '../constants/index.js';

export const createOrderItemSchema = z.object({
  menuItemId: z.string().min(1, 'Menu Item ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const createOrderSchema = z.object({
  items: z.array(createOrderItemSchema).min(1, 'Order must contain at least one item'),
  paymentMethod: z.enum([PAYMENT_METHOD.CASH, PAYMENT_METHOD.UPI, PAYMENT_METHOD.CARD]),
  discount: z.number().min(0).optional().default(0),
  tax: z.number().min(0).optional().default(0),
  confirmPayment: z.boolean().optional().default(true),
  transactionReference: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    ORDER_STATUS.NEW,
    ORDER_STATUS.ACCEPTED,
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.READY,
    ORDER_STATUS.COMPLETED,
    ORDER_STATUS.CANCELLED,
  ]),
});
