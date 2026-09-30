import mongoose, { Schema, Document } from 'mongoose';
import {
  ORDER_STATUS,
  OrderStatus,
  PAYMENT_METHOD,
  PaymentMethod,
  PAYMENT_STATUS,
  PaymentStatus,
} from '../constants/index.js';

export interface IOrderItem {
  menuItemId: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  total: number;
  requiresKitchen?: boolean;
}

export interface IOrder extends Document {
  restaurantId: mongoose.Types.ObjectId;
  orderNumber: number;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  customerName?: string;
  customerPhone?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    menuItemId: {
      type: Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    requiresKitchen: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    orderNumber: {
      type: Number,
      required: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: [(val: IOrderItem[]) => val.length > 0, 'Order must contain at least one item'],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    orderStatus: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.NEW,
    },
    customerName: {
      type: String,
      trim: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

OrderSchema.index({ restaurantId: 1, createdAt: -1 });
OrderSchema.index({ restaurantId: 1, orderStatus: 1 });
OrderSchema.index({ restaurantId: 1, paymentStatus: 1 });
OrderSchema.index({ restaurantId: 1, orderNumber: 1 }, { unique: true });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
