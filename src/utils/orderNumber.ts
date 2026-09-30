import mongoose from 'mongoose';
import { Counter } from '../models/Counter.js';

export const getNextOrderNumber = async (restaurantId: string | mongoose.Types.ObjectId): Promise<number> => {
  const updatedCounter = await Counter.findOneAndUpdate(
    { restaurantId },
    { $inc: { orderSequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return updatedCounter.orderSequence;
};
