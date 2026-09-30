import { User } from '../models/User.js';
import { hashPassword } from '../utils/password.js';
import { AppError } from '../middleware/error.middleware.js';
import { ERROR_CODES, ROLES } from '../constants/index.js';

export class StaffService {
  public static async createKitchenStaff(restaurantId: string, data: any) {
    const { name, email, phone, password } = data;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new AppError('An account with this email address already exists.', 400, ERROR_CODES.DUPLICATE_RESOURCE);
    }

    const hashedPassword = await hashPassword(password);
    const staff = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role: ROLES.KITCHEN_STAFF,
      restaurantId,
      isActive: true,
    });

    return {
      _id: staff._id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      restaurantId: staff.restaurantId,
    };
  }

  public static async getStaffMembers(restaurantId: string) {
    const staffMembers = await User.find({
      restaurantId,
      role: ROLES.KITCHEN_STAFF,
    }).select('-password');
    return staffMembers;
  }

  public static async deleteStaffMember(restaurantId: string, id: string) {
    const staff = await User.findOneAndDelete({ _id: id, restaurantId, role: ROLES.KITCHEN_STAFF });
    if (!staff) {
      throw new AppError('Kitchen staff member not found.', 404, ERROR_CODES.NOT_FOUND);
    }
    return true;
  }
}
