import multer from 'multer';
import { AppError } from './error.middleware.js';
import { ERROR_CODES } from '../constants/index.js';

const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files (JPEG, PNG, WEBP) are allowed!', 400, ERROR_CODES.BAD_REQUEST));
  }
};

export const uploadSingleImage = (fieldName: string) => {
  return multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
  }).single(fieldName);
};
