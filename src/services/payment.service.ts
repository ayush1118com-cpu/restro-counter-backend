import { Payment } from '../models/Payment.js';
import { Order } from '../models/Order.js';
import { AppError } from '../middleware/error.middleware.js';
import { ERROR_CODES, PAYMENT_STATUS } from '../constants/index.js';
import { ParsedPagination } from '../utils/pagination.js';
import { SocketEventService } from '../sockets/socketEvents.js';

export class PaymentService {
  public static async createPayment(restaurantId: string, data: any) {
    const { orderId, amount, method, status = PAYMENT_STATUS.PAID, transactionReference } = data;

    const order = await Order.findOne({ _id: orderId, restaurantId });
    if (!order) {
      throw new AppError('Order not found or unauthorized access.', 404, ERROR_CODES.NOT_FOUND);
    }

    const payment = await Payment.create({
      restaurantId,
      orderId,
      amount,
      method,
      status,
      transactionReference,
      paidAt: new Date(),
    });

    if (status === PAYMENT_STATUS.PAID) {
      order.paymentStatus = PAYMENT_STATUS.PAID;
      await order.save();
    }

    SocketEventService.emitPaymentUpdate(restaurantId, payment);

    return payment;
  }

  public static async getPayments(
    restaurantId: string,
    pagination: ParsedPagination,
    filters: { method?: string; status?: string; startDate?: string; endDate?: string }
  ) {
    const query: any = { restaurantId };

    if (filters.method) query.method = filters.method;
    if (filters.status) query.status = filters.status;

    if (filters.startDate || filters.endDate) {
      query.paidAt = {};
      if (filters.startDate) query.paidAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.paidAt.$lte = new Date(filters.endDate);
    }

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('orderId', 'orderNumber grandTotal orderStatus')
      .sort({ [pagination.sortBy]: pagination.sortOrder })
      .skip(pagination.skip)
      .limit(pagination.limit);

    return {
      data: payments,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  public static async getPaymentById(restaurantId: string, id: string) {
    const payment = await Payment.findOne({ _id: id, restaurantId }).populate('orderId');
    if (!payment) {
      throw new AppError('Payment record not found.', 404, ERROR_CODES.NOT_FOUND);
    }
    return payment;
  }
}
