import { z } from 'zod';
import { RESTAURANT_STATUS } from '../constants/index.js';

const booleanCoerce = z.preprocess((val) => {
  if (val === undefined || val === null || val === '') return undefined;
  if (val === 'true' || val === true || val === '1' || val === 1) return true;
  if (val === 'false' || val === false || val === '0' || val === 0) return false;
  return Boolean(val);
}, z.boolean().optional());

const numberCoerce = z.preprocess((val) => {
  if (val === undefined || val === null || val === '') return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
}, z.number().min(0).optional());

const enumCoerce = <T extends [string, ...string[]]>(values: T) =>
  z.preprocess((val) => {
    if (val === undefined || val === null || val === '') return undefined;
    return val;
  }, z.enum(values).optional());

export const createRestaurantSchema = z.object({
  name: z.string().min(2, 'Restaurant name is required'),
  ownerName: z.string().min(2, 'Owner name is required'),
  email: z.string().email('Valid owner email is required'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  address: z.string().min(3, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  adminEmail: z.string().email('Valid admin login email is required'),
  adminPassword: z.string().min(6, 'Admin password must be at least 6 characters'),
  status: enumCoerce([RESTAURANT_STATUS.ACTIVE, RESTAURANT_STATUS.SUSPENDED, RESTAURANT_STATUS.BLOCKED]),
  posEnabled: booleanCoerce,
  tableQrEnabled: booleanCoerce,
  hasTableQrOrdering: booleanCoerce,
  subscriptionPlan: enumCoerce(['BOTH', 'POS_ONLY', 'SCANNER_ONLY']),
  subscriptionPrice: numberCoerce,
  paymentMode: enumCoerce(['CASH', 'UPI', 'BANK_TRANSFER', 'COMPLIMENTARY']),
  paymentReference: z.preprocess((v) => (v === undefined || v === null ? '' : String(v)), z.string().optional()),
  paymentStatus: enumCoerce(['PAID', 'PENDING']),
  kitchenEmail: z.string().email().optional(),
  kitchenPassword: z.string().min(6).optional(),
});

export const updateRestaurantSchema = z.object({
  name: z.string().min(2).optional(),
  ownerName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  address: z.string().min(3).optional(),
  city: z.string().min(2).optional(),
  gstin: z.string().optional(),
  gstRate: numberCoerce,
  receiptHeader: z.string().optional(),
  receiptFooter: z.string().optional(),
  posEnabled: booleanCoerce,
  tableQrEnabled: booleanCoerce,
  hasTableQrOrdering: booleanCoerce,
  subscriptionPlan: enumCoerce(['BOTH', 'POS_ONLY', 'SCANNER_ONLY']),
  subscriptionPrice: numberCoerce,
  paymentMode: enumCoerce(['CASH', 'UPI', 'BANK_TRANSFER', 'COMPLIMENTARY']),
  paymentReference: z.preprocess((v) => (v === undefined || v === null ? '' : String(v)), z.string().optional()),
  paymentStatus: enumCoerce(['PAID', 'PENDING']),
});

export const updateRestaurantStatusSchema = z.object({
  status: z.enum([RESTAURANT_STATUS.ACTIVE, RESTAURANT_STATUS.SUSPENDED, RESTAURANT_STATUS.BLOCKED]),
});

export const updateRestaurantPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
