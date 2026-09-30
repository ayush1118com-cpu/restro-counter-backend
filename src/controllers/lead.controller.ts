import { Request, Response, NextFunction } from 'express';
import { LeadService } from '../services/lead.service.js';
import { createLeadSchema, updateLeadStatusSchema } from '../validators/lead.validator.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';

export class LeadController {
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createLeadSchema.parse(req.body);
      const lead = await LeadService.createLead(validatedData);
      sendSuccess(res, 'Thank you! Your demo request has been submitted successfully.', lead, 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pagination = parsePagination(req);
      const statusFilter = req.query.status as string;
      const cityFilter = req.query.city as string;
      const result = await LeadService.getAllLeads(pagination, statusFilter, cityFilter);
      sendPaginated(res, 'Leads retrieved successfully', result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const lead = await LeadService.getLeadById(id);
      sendSuccess(res, 'Lead details retrieved', lead);
    } catch (error) {
      next(error);
    }
  }

  public static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const validatedData = updateLeadStatusSchema.parse(req.body);
      const lead = await LeadService.updateLeadStatus(id, validatedData.status);
      sendSuccess(res, 'Lead status updated successfully', lead);
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await LeadService.deleteLead(id);
      sendSuccess(res, 'Lead deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
