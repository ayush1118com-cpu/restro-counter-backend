import mongoose from 'mongoose';
import { Order, IOrderItem } from '../models/Order.js';
import { MenuItem } from '../models/MenuItem.js';
import { Payment } from '../models/Payment.js';
import { Restaurant } from '../models/Restaurant.js';
import { getNextOrderNumber } from '../utils/orderNumber.js';
import { SocketEventService } from '../sockets/socketEvents.js';
import { AppError } from '../middleware/error.middleware.js';
import {
  ALLOWED_ORDER_TRANSITIONS,
  ERROR_CODES,
  ORDER_STATUS,
  OrderStatus,
  PAYMENT_STATUS,
  SOCKET_EVENTS,
} from '../constants/index.js';
import { ParsedPagination } from '../utils/pagination.js';

export class OrderService {
  public static async createOrder(user: any, data: any) {
    const restaurantId = user.restaurantId;
    if (!restaurantId) {
      throw new AppError('Authenticated user is not assigned to a restaurant.', 400, ERROR_CODES.BAD_REQUEST);
    }

    const { items: requestItems, paymentMethod, discount = 0, tax = 0, confirmPayment = true, transactionReference, customerName, customerPhone } = data;

    const menuItemIds = requestItems.map((item: any) => item.menuItemId);
    const dbMenuItems = await MenuItem.find({
      _id: { $in: menuItemIds },
      restaurantId,
    });

    if (dbMenuItems.length !== menuItemIds.length) {
      throw new AppError(
        'One or more ordered menu items were not found or do not belong to your restaurant.',
        400,
        ERROR_CODES.BAD_REQUEST
      );
    }

    const dbMenuMap = new Map<string, any>();
    for (const item of dbMenuItems) {
      if (!item.isActive || !item.isAvailable) {
        throw new AppError(
          `Item '${item.name}' is currently unavailable for order.`,
          400,
          ERROR_CODES.BAD_REQUEST
        );
      }
      dbMenuMap.set((item._id as any).toString(), item);
    }

    const calculatedItems: IOrderItem[] = [];
    let subtotal = 0;

    let requiresKitchenAny = false;

    for (const reqItem of requestItems) {
      const dbItem = dbMenuMap.get(reqItem.menuItemId);
      const unitPrice = dbItem.discountPrice && dbItem.discountPrice > 0 ? dbItem.discountPrice : dbItem.price;
      const itemTotal = unitPrice * reqItem.quantity;
      const requiresKitchen = dbItem.requiresKitchen !== false;

      if (requiresKitchen) {
        requiresKitchenAny = true;
      }

      subtotal += itemTotal;
      calculatedItems.push({
        menuItemId: dbItem._id,
        name: dbItem.name,
        quantity: reqItem.quantity,
        price: unitPrice,
        total: itemTotal,
        requiresKitchen,
      });
    }

    const finalSubtotal = Math.max(0, subtotal);
    const finalDiscount = Math.max(0, discount);
    const finalTax = Math.max(0, tax);
    const grandTotal = Math.max(0, finalSubtotal - finalDiscount + finalTax);

    const orderNumber = await getNextOrderNumber(restaurantId);

    const initialPaymentStatus = confirmPayment ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PENDING;
    // If none of the items require kitchen preparation (e.g. Chai, Cigarette), auto-complete order!
    const initialOrderStatus = requiresKitchenAny ? ORDER_STATUS.NEW : ORDER_STATUS.COMPLETED;

    const order = await Order.create({
      restaurantId,
      orderNumber,
      items: calculatedItems,
      subtotal: finalSubtotal,
      discount: finalDiscount,
      tax: finalTax,
      grandTotal,
      paymentMethod,
      paymentStatus: initialPaymentStatus,
      orderStatus: initialOrderStatus,
      customerName,
      customerPhone,
      createdBy: user._id,
    });

    if (confirmPayment) {
      await Payment.create({
        restaurantId,
        orderId: order._id,
        amount: grandTotal,
        method: paymentMethod,
        status: PAYMENT_STATUS.PAID,
        transactionReference,
        paidAt: new Date(),
      });
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('createdBy', 'name email')
      .lean();

    SocketEventService.emitNewOrder(restaurantId, populatedOrder);

    return populatedOrder;
  }

  public static async getOrders(
    restaurantId: string,
    pagination: ParsedPagination,
    filters: {
      status?: string;
      paymentStatus?: string;
      paymentMethod?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    const query: any = { restaurantId };

    if (filters.status && Object.values(ORDER_STATUS).includes(filters.status as any)) {
      query.orderStatus = filters.status;
    }

    if (filters.paymentStatus && Object.values(PAYMENT_STATUS).includes(filters.paymentStatus as any)) {
      query.paymentStatus = filters.paymentStatus;
    }

    if (filters.paymentMethod) {
      query.paymentMethod = filters.paymentMethod;
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.createdAt.$lte = new Date(filters.endDate);
      }
    }

    if (pagination.search) {
      const searchNum = parseInt(pagination.search, 10);
      if (!isNaN(searchNum)) {
        query.orderNumber = searchNum;
      }
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('createdBy', 'name')
      .sort({ [pagination.sortBy]: pagination.sortOrder })
      .skip(pagination.skip)
      .limit(pagination.limit);

    return {
      data: orders,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  public static async getOrderById(restaurantId: string, id: string) {
    const order = await Order.findOne({ _id: id, restaurantId })
      .populate('createdBy', 'name email')
      .populate('restaurantId', 'name address phone logo city');

    if (!order) {
      throw new AppError('Order not found or unauthorized access.', 404, ERROR_CODES.NOT_FOUND);
    }

    const payment = await Payment.findOne({ orderId: id });
    return { order, payment };
  }

  public static async updateOrderStatus(restaurantId: string, id: string, newStatus: OrderStatus) {
    const order = await Order.findOne({ _id: id, restaurantId });
    if (!order) {
      throw new AppError('Order not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    const currentStatus = order.orderStatus;
    const allowedNext = ALLOWED_ORDER_TRANSITIONS[currentStatus] || [];

    if (!allowedNext.includes(newStatus)) {
      throw new AppError(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'.`,
        400,
        ERROR_CODES.INVALID_ORDER_TRANSITION
      );
    }

    order.orderStatus = newStatus;
    await order.save();

    let eventName: string = SOCKET_EVENTS.ORDER_ACCEPTED;
    switch (newStatus) {
      case ORDER_STATUS.ACCEPTED:
        eventName = SOCKET_EVENTS.ORDER_ACCEPTED;
        break;
      case ORDER_STATUS.PREPARING:
        eventName = SOCKET_EVENTS.ORDER_PREPARING;
        break;
      case ORDER_STATUS.READY:
        eventName = SOCKET_EVENTS.ORDER_READY;
        break;
      case ORDER_STATUS.COMPLETED:
        eventName = SOCKET_EVENTS.ORDER_COMPLETED;
        break;
      case ORDER_STATUS.CANCELLED:
        eventName = SOCKET_EVENTS.ORDER_CANCELLED;
        break;
    }

    SocketEventService.emitOrderStatusChange(restaurantId, eventName, order);

    return order;
  }

  public static async getOrderBill(restaurantId: string, id: string) {
    const order = await Order.findOne({ _id: id, restaurantId }).populate(
      'restaurantId',
      'name address phone city logo'
    );

    if (!order) {
      throw new AppError('Order not found.', 404, ERROR_CODES.NOT_FOUND);
    }

    const restaurant: any = order.restaurantId;

    return {
      billHeader: {
        restaurantName: restaurant?.name || 'Restro Counter',
        address: restaurant?.address || '',
        city: restaurant?.city || '',
        phone: restaurant?.phone || '',
        logo: restaurant?.logo?.secure_url,
      },
      orderInfo: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        date: order.createdAt.toISOString().split('T')[0],
        time: order.createdAt.toLocaleTimeString(),
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
      },
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      })),
      pricing: {
        subtotal: order.subtotal,
        discount: order.discount,
        tax: order.tax,
        grandTotal: order.grandTotal,
      },
    };
  }
}
