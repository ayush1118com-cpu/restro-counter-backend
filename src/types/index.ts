import { Request } from 'express';
import { UserRole } from '../constants/index.js';

export interface JwtPayload {
  userId: string;
  role: UserRole;
  restaurantId: string | null;
  email: string;
}

export interface AuthenticatedUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  restaurantId: string | null;
  isActive: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  errorCode?: string;
}

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}
