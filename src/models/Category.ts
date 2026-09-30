import mongoose, { Schema, Document } from 'mongoose';

export interface ICategoryImage {
  secure_url: string;
  public_id: string;
}

export interface ICategory extends Document {
  restaurantId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  image?: ICategoryImage;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
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
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

CategorySchema.index({ restaurantId: 1, name: 1 }, { unique: true });

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
