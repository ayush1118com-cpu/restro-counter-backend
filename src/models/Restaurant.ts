import mongoose, { Schema, Document } from 'mongoose';
import { RESTAURANT_STATUS, RestaurantStatus } from '../constants/index.js';

export interface IRestaurantImage {
  secure_url: string;
  public_id: string;
}

export interface IRestaurant extends Document {
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  logo?: IRestaurantImage;
  status: RestaurantStatus;
  createdAt: Date;
  updatedAt: Date;
}

const RestaurantSchema = new Schema<IRestaurant>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    logo: {
      secure_url: { type: String },
      public_id: { type: String },
    },
    status: {
      type: String,
      enum: Object.values(RESTAURANT_STATUS),
      default: RESTAURANT_STATUS.ACTIVE,
      index: true,
    },
  },
  { timestamps: true }
);

export const Restaurant = mongoose.model<IRestaurant>('Restaurant', RestaurantSchema);
