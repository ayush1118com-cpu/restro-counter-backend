import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const initCloudinary = (): void => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, NODE_ENV } = env;

  if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    });
    logger.info('Cloudinary initialized successfully.');
  } else {
    if (NODE_ENV === 'production') {
      logger.error('Cloudinary credentials missing in production mode.');
    } else {
      logger.warn('Cloudinary credentials missing. File uploads will fallback gracefully.');
    }
  }
};

export default cloudinary;
