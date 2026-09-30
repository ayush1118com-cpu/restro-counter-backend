import mongoose, { Schema, Document } from 'mongoose';
import {
  PAYMENT_METHOD,
  PaymentMethod,
  PAYMENT_STATUS,
  PaymentStatus,
} from '../constants/index.js';

export interface IPayment extends Document {
  restaurantId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionReference?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    method: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PAID,
    },
    transactionReference: {
      type: String,
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

PaymentSchema.index({ restaurantId: 1, createdAt: -1 });
PaymentSchema.index({ orderId: 1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
