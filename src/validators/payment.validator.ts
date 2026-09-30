import { z } from 'zod';
import { PAYMENT_METHOD, PAYMENT_STATUS } from '../constants/index.js';

export const createPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  method: z.enum([PAYMENT_METHOD.CASH, PAYMENT_METHOD.UPI, PAYMENT_METHOD.CARD]),
  status: z.enum([
    PAYMENT_STATUS.PENDING,
    PAYMENT_STATUS.PAID,
    PAYMENT_STATUS.FAILED,
    PAYMENT_STATUS.REFUNDED,
  ]).optional().default(PAYMENT_STATUS.PAID),
  transactionReference: z.string().optional(),
});
