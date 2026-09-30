import { Response, NextFunction } from 'express';
import { StaffService } from '../services/staff.service.js';
import { sendSuccess } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import { z } from 'zod';

const createStaffSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export class StaffController {
  public static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createStaffSchema.parse(req.body);
      const staff = await StaffService.createKitchenStaff(req.user!.restaurantId!, validatedData);
      sendSuccess(res, 'Kitchen Staff user account created successfully', staff, 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const staff = await StaffService.getStaffMembers(req.user!.restaurantId!);
      sendSuccess(res, 'Kitchen Staff members retrieved', staff);
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await StaffService.deleteStaffMember(req.user!.restaurantId!, id);
      sendSuccess(res, 'Kitchen Staff member deleted');
    } catch (error) {
      next(error);
    }
  }
}
