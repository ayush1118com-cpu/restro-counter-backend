import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const connectDB = async (): Promise<typeof mongoose> => {
  try {
    if (!env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is missing.');
    }

    logger.info('Attempting MongoDB connection...');
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(`MongoDB connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error: any) {
    logger.warn(`Primary MONGO_URI connection failed (${error.message}). Attempting local fallback...`);
    try {
      const localUri = 'mongodb://127.0.0.1:27017/restro_counter';
      const conn = await mongoose.connect(localUri, {
        serverSelectionTimeoutMS: 5000,
      });
      logger.info(`Local MongoDB connected successfully: ${conn.connection.host}`);
      return conn;
    } catch (fallbackError: any) {
      logger.error(`MongoDB connection failure: Could not connect to Atlas (${error.message}) or Local MongoDB (${fallbackError.message}).`);
      process.exit(1);
    }
  }
};
