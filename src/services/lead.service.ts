import { Lead } from '../models/Lead.js';
import { AppError } from '../middleware/error.middleware.js';
import { ERROR_CODES, LEAD_STATUS } from '../constants/index.js';
import { ParsedPagination } from '../utils/pagination.js';

export class LeadService {
  public static async createLead(data: any) {
    const lead = await Lead.create({
      ...data,
      status: LEAD_STATUS.NEW,
    });
    return lead;
  }

  public static async getAllLeads(pagination: ParsedPagination, statusFilter?: string, cityFilter?: string) {
    const query: any = {};

    if (statusFilter && Object.values(LEAD_STATUS).includes(statusFilter as any)) {
      query.status = statusFilter;
    }

    if (cityFilter) {
      query.city = { $regex: cityFilter, $options: 'i' };
    }

    if (pagination.search) {
      query.$or = [
        { restaurantName: { $regex: pagination.search, $options: 'i' } },
        { ownerName: { $regex: pagination.search, $options: 'i' } },
        { email: { $regex: pagination.search, $options: 'i' } },
        { phone: { $regex: pagination.search, $options: 'i' } },
        { city: { $regex: pagination.search, $options: 'i' } },
      ];
    }

    const total = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .sort({ [pagination.sortBy]: pagination.sortOrder })
      .skip(pagination.skip)
      .limit(pagination.limit);

    return {
      data: leads,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  public static async getLeadById(id: string) {
    const lead = await Lead.findById(id);
    if (!lead) {
      throw new AppError('Lead record not found.', 404, ERROR_CODES.NOT_FOUND);
    }
    return lead;
  }

  public static async updateLeadStatus(id: string, status: string) {
    const lead = await Lead.findById(id);
    if (!lead) {
      throw new AppError('Lead record not found.', 404, ERROR_CODES.NOT_FOUND);
    }
    lead.status = status as any;
    await lead.save();
    return lead;
  }

  public static async deleteLead(id: string) {
    const lead = await Lead.findByIdAndDelete(id);
    if (!lead) {
      throw new AppError('Lead record not found.', 404, ERROR_CODES.NOT_FOUND);
    }
    return true;
  }
}
