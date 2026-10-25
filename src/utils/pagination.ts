import { Request } from 'express';

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
  search: string;
  sortBy: string;
  sortOrder: 1 | -1;
}

export const parsePagination = (req: Request): ParsedPagination => {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit as string, 10) || 100));
  const skip = (page - 1) * limit;
  const search = (req.query.search as string) || '';
  const sortBy = (req.query.sortBy as string) || 'createdAt';
  const sortOrder = (req.query.sortOrder as string) === 'desc' ? -1 : 1;

  return { page, limit, skip, search, sortBy, sortOrder };
};
