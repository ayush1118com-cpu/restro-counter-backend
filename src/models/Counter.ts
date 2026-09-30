import mongoose, { Schema, Document } from 'mongoose';

export interface ICounter extends Document {
  restaurantId: mongoose.Types.ObjectId;
  orderSequence: number;
  createdAt: Date;
  updatedAt: Date;
}

const CounterSchema = new Schema<ICounter>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      unique: true,
    },
    orderSequence: {
      type: Number,
      default: 1000,
    },
  },
  { timestamps: true }
);

export const Counter = mongoose.model<ICounter>('Counter', CounterSchema);
