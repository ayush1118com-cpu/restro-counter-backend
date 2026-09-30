import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuItemImage {
  secure_url: string;
  public_id: string;
}

export interface IMenuItem extends Document {
  restaurantId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  image?: IMenuItemImage;
  price: number;
  discountPrice?: number;
  requiresKitchen: boolean;
  isAvailable: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    image: {
      secure_url: { type: String },
      public_id: { type: String },
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPrice: {
      type: Number,
      min: 0,
    },
    requiresKitchen: {
      type: Boolean,
      default: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

MenuItemSchema.index({ restaurantId: 1, categoryId: 1, isAvailable: 1 });

export const MenuItem = mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);
