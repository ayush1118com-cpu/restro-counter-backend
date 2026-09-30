import cloudinary from '../config/cloudinary.js';
import { CloudinaryUploadResult } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class CloudinaryService {
  public static async uploadImage(
    fileBuffer: Buffer,
    folder: string = 'restro-counter'
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          format: 'webp',
          transformation: [{ width: 1000, height: 1000, crop: 'limit', quality: 'auto' }],
        },
        (error, result) => {
          if (error || !result) {
            logger.error(`Cloudinary upload failed: ${error?.message || 'Unknown error'}`);
            return reject(error || new Error('Cloudinary upload result missing'));
          }

          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        }
      );

      uploadStream.end(fileBuffer);
    });
  }

  public static async deleteImage(publicId?: string): Promise<boolean> {
    if (!publicId) return false;
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      logger.info(`Cloudinary image deleted: ${publicId} (result: ${result.result})`);
      return result.result === 'ok';
    } catch (error: any) {
      logger.error(`Failed to delete Cloudinary asset ${publicId}: ${error.message}`);
      return false;
    }
  }
}
