import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGO_URI: process.env.MONGO_URI || '',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_2026',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_2026',
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '1d',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || 'localhost',
  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL || 'admin@restrocounter.com',
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD || 'SuperAdmin123!',
  SEED_RESTAURANT_ADMIN_EMAIL: process.env.SEED_RESTAURANT_ADMIN_EMAIL || 'restaurant@restrocounter.com',
  SEED_RESTAURANT_ADMIN_PASSWORD: process.env.SEED_RESTAURANT_ADMIN_PASSWORD || 'RestroAdmin123!',
};
