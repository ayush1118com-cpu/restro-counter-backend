import { Response } from 'express';
import { ApiResponse } from '../types/index.js';

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
};

export const sendPaginated = <T>(
  res: Response,
  message: string,
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T[]> = {
    success: true,
    message,
    data,
    pagination,
  };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 400,
  errorCode?: string,
  data?: any
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    errorCode,
    data,
  };
  return res.status(statusCode).json(response);
};
