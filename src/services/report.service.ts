import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { PAYMENT_STATUS } from '../constants/index.js';

export class ReportService {
  public static async getSalesReport(restaurantId: string | null, startDate?: string, endDate?: string) {
    const match: any = { status: PAYMENT_STATUS.PAID };
    if (restaurantId) {
      match.restaurantId = new mongoose.Types.ObjectId(restaurantId);
    }

    if (startDate || endDate) {
      match.paidAt = {};
      if (startDate) match.paidAt.$gte = new Date(startDate);
      if (endDate) match.paidAt.$lte = new Date(endDate);
    }

    const salesTrend = await Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
          totalRevenue: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totalRevenue = salesTrend.reduce((acc, curr) => acc + curr.totalRevenue, 0);
    const totalTransactions = salesTrend.reduce((acc, curr) => acc + curr.transactionCount, 0);

    return {
      totalRevenue,
      totalTransactions,
      trend: salesTrend,
    };
  }

  public static async getOrdersReport(restaurantId: string | null, startDate?: string, endDate?: string) {
    const match: any = {};
    if (restaurantId) {
      match.restaurantId = new mongoose.Types.ObjectId(restaurantId);
    }

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const statusBreakdown = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
          totalValue: { $sum: '$grandTotal' },
        },
      },
    ]);

    const totalOrders = statusBreakdown.reduce((acc, curr) => acc + curr.count, 0);

    return {
      totalOrders,
      breakdown: statusBreakdown,
    };
  }

  public static async getPaymentReport(restaurantId: string | null, startDate?: string, endDate?: string) {
    const match: any = {};
    if (restaurantId) {
      match.restaurantId = new mongoose.Types.ObjectId(restaurantId);
    }

    if (startDate || endDate) {
      match.paidAt = {};
      if (startDate) match.paidAt.$gte = new Date(startDate);
      if (endDate) match.paidAt.$lte = new Date(endDate);
    }

    const methodBreakdown = await Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$method',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      breakdown: methodBreakdown,
    };
  }
}
