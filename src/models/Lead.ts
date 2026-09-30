import mongoose, { Schema, Document } from 'mongoose';
import { LEAD_STATUS, LeadStatus } from '../constants/index.js';

export interface ILead extends Document {
  restaurantName: string;
  ownerName: string;
  phone: string;
  email: string;
  city: string;
  ordersPerDay: string;
  currentSystem?: string;
  message?: string;
  status: LeadStatus;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    restaurantName: {
      type: String,
      required: true,
      trim: true,
    },
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    ordersPerDay: {
      type: String,
      required: true,
    },
    currentSystem: {
      type: String,
    },
    message: {
      type: String,
    },
    status: {
      type: String,
      enum: Object.values(LEAD_STATUS),
      default: LEAD_STATUS.NEW,
      index: true,
    },
  },
  { timestamps: true }
);

LeadSchema.index({ createdAt: -1 });

export const Lead = mongoose.model<ILead>('Lead', LeadSchema);
