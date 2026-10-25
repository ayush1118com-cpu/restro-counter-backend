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
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  SOCKET_EVENTS,
} from '../constants/index.js';
import { ParsedPagination } from '../utils/pagination.js';

export class OrderService {
  public static async createOrder(user: any, data: any) {
    const restaurantId = user?.restaurantId || data.restaurantId;
    if (!restaurantId) {
      throw new AppError('Authenticated user is not assigned to a restaurant.', 400, ERROR_CODES.BAD_REQUEST);
    }

    const {
      items: requestItems,
      paymentMethod,
      discount = 0,
      tax = 0,
      confirmPayment = true,
      transactionReference,
      customerName,
      customerPhone,
      vehicleNumber,
      orderType = 'COUNTER',
      tableNumber,
      notes,
    } = data;

    // Resolve Menu Items (by ObjectId or name or direct payload)
    const validObjectIds = requestItems
      .map((it: any) => it.menuItemId)
      .filter((id: any) => id && mongoose.Types.ObjectId.isValid(id));

    const dbMenuItems = validObjectIds.length > 0
      ? await MenuItem.find({ _id: { $in: validObjectIds }, restaurantId })
      : [];

    const dbMenuMap = new Map<string, any>();
    for (const item of dbMenuItems) {
      dbMenuMap.set((item._id as any).toString(), item);
    }

    const calculatedItems: IOrderItem[] = [];
    let subtotal = 0;
    let requiresKitchenAny = false;

    for (const reqItem of requestItems) {
      let dbItem = reqItem.menuItemId ? dbMenuMap.get(reqItem.menuItemId.toString()) : null;
      if (!dbItem && reqItem.name) {
        dbItem = await MenuItem.findOne({ restaurantId, name: reqItem.name });
      }

      const unitPrice = dbItem
        ? (dbItem.discountPrice && dbItem.discountPrice > 0 ? dbItem.discountPrice : dbItem.price)
        : (Number(reqItem.price) || 0);

      const quantity = Number(reqItem.quantity) || 1;
      const itemTotal = unitPrice * quantity;
      const requiresKitchen = dbItem ? (dbItem.requiresKitchen !== false) : (reqItem.requiresKitchen !== false);

      if (requiresKitchen) {
        requiresKitchenAny = true;
      }

      subtotal += itemTotal;
      calculatedItems.push({
        menuItemId: dbItem ? dbItem._id : (mongoose.Types.ObjectId.isValid(reqItem.menuItemId) ? reqItem.menuItemId : undefined),
        name: dbItem ? dbItem.name : (reqItem.name || 'Menu Item'),
        quantity,
        price: unitPrice,
        total: itemTotal,
        requiresKitchen,
        notes: reqItem.notes,
      });
    }

    const finalSubtotal = Math.max(0, subtotal);
    const finalDiscount = Math.max(0, discount);
    const finalTax = Math.max(0, tax);
    const grandTotal = Math.max(0, finalSubtotal - finalDiscount + finalTax);

    const orderNumber = await getNextOrderNumber(restaurantId);

    const initialPaymentStatus = confirmPayment ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PENDING;
    const initialOrderStatus = (orderType === 'TABLE_QR')
      ? ORDER_STATUS.NEW
      : (requiresKitchenAny ? ORDER_STATUS.NEW : ORDER_STATUS.COMPLETED);

    const order = await Order.create({
      restaurantId,
      orderNumber,
      items: calculatedItems,
      subtotal: finalSubtotal,
      discount: finalDiscount,
      tax: finalTax,
      grandTotal,
      paymentMethod: paymentMethod || PAYMENT_METHOD.CASH,
      paymentStatus: initialPaymentStatus,
      orderStatus: initialOrderStatus,
      orderType,
      tableNumber,
      notes,
      customerName,
      customerPhone,
      vehicleNumber,
      createdBy: user?._id || undefined,
    });

    if (confirmPayment) {
      await Payment.create({
        restaurantId,
        orderId: order._id,
        amount: grandTotal,
        method: paymentMethod || PAYMENT_METHOD.CASH,
        status: PAYMENT_STATUS.PAID,
        transactionReference,
        paidAt: new Date(),
      });
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('createdBy', 'name email')
      .lean();

    SocketEventService.emitNewOrder(restaurantId.toString(), populatedOrder);

    return populatedOrder;
  }

  public static async createPublicTableOrder(restaurantId: string, data: any): Promise<any> {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new AppError('Restaurant not found.', 404, ERROR_CODES.NOT_FOUND);
    }
    if (restaurant.status !== 'ACTIVE') {
      throw new AppError('Restaurant is currently inactive.', 400, ERROR_CODES.BAD_REQUEST);
    }
    if (restaurant.tableQrEnabled === false) {
      throw new AppError('Table QR ordering is currently disabled for this restaurant.', 403, ERROR_CODES.FORBIDDEN);
    }

    const gstRate = restaurant.gstRate !== undefined ? Number(restaurant.gstRate) : 5;
    const items = data.items || [];
    let subtotal = 0;
    let requiresKitchenAny = false;

    const calculatedItems: IOrderItem[] = [];
    for (const item of items) {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 1;
      const total = price * quantity;
      const requiresKitchen = item.requiresKitchen !== false;
      if (requiresKitchen) requiresKitchenAny = true;

      subtotal += total;
      calculatedItems.push({
        menuItemId: item.menuItemId || undefined,
        name: item.name,
        price,
        quantity,
        total,
        requiresKitchen,
        notes: item.notes,
      });
    }

    // Check if there is an active running order for this table
    const activeOrder = !data.forceNewOrder
      ? await Order.findOne({
          restaurantId,
          tableNumber: { $regex: new RegExp(`^${data.tableNumber.trim()}$`, 'i') },
          orderStatus: { $in: [ORDER_STATUS.NEW, ORDER_STATUS.ACCEPTED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY] },
        })
      : null;

    if (activeOrder) {
      // Append / merge items into existing active table order (Single Consolidated Bill)
      for (const newItem of calculatedItems) {
        const existingItemIndex = activeOrder.items.findIndex(
          (i) => i.name.toLowerCase() === newItem.name.toLowerCase() && (i.notes || '') === (newItem.notes || '')
        );
        if (existingItemIndex > -1) {
          activeOrder.items[existingItemIndex].quantity += newItem.quantity;
          activeOrder.items[existingItemIndex].total += newItem.total;
        } else {
          activeOrder.items.push(newItem);
        }
      }

      // Recalculate totals
      const newSubtotal = activeOrder.items.reduce((sum, it) => sum + it.total, 0);
      const newTax = Math.round(newSubtotal * (gstRate / 100));
      const newGrandTotal = newSubtotal + newTax - (activeOrder.discount || 0);

      activeOrder.subtotal = newSubtotal;
      activeOrder.tax = newTax;
      activeOrder.grandTotal = newGrandTotal;

      if (data.notes) {
        activeOrder.notes = activeOrder.notes ? `${activeOrder.notes} | ${data.notes}` : data.notes;
      }
      if (data.customerName && (!activeOrder.customerName || activeOrder.customerName.includes('Guest'))) {
        activeOrder.customerName = data.customerName;
      }
      if (data.customerPhone && !activeOrder.customerPhone) {
        activeOrder.customerPhone = data.customerPhone;
      }

      // Set orderStatus to PREPARING if it was READY or ACCEPTED so chef prepares the extra items
      if (activeOrder.orderStatus === ORDER_STATUS.READY || activeOrder.orderStatus === ORDER_STATUS.ACCEPTED) {
        activeOrder.orderStatus = ORDER_STATUS.PREPARING;
      }

      await activeOrder.save();

      const populatedUpdated = await Order.findById(activeOrder._id).lean();

      SocketEventService.emitOrderStatusChange(restaurantId.toString(), SOCKET_EVENTS.ORDER_PREPARING, populatedUpdated);
      SocketEventService.emitNewOrder(restaurantId.toString(), {
        ...populatedUpdated,
        isAppended: true,
        newItems: calculatedItems,
      });

      return {
        ...populatedUpdated,
        isAppended: true,
      };
    }

    const tax = Math.round(subtotal * (gstRate / 100));
    const grandTotal = subtotal + tax;
    const orderNumber = await getNextOrderNumber(restaurantId);

    const order = await Order.create({
      restaurantId,
      orderNumber,
      items: calculatedItems,
      subtotal,
      tax,
      discount: 0,
      grandTotal,
      paymentMethod: PAYMENT_METHOD.CASH,
      paymentStatus: PAYMENT_STATUS.PENDING,
      orderStatus: ORDER_STATUS.NEW,
      orderType: 'TABLE_QR',
      tableNumber: data.tableNumber,
      notes: data.notes,
      customerName: data.customerName || `${data.tableNumber} Guest`,
      customerPhone: data.customerPhone,
    });

    const populatedOrder = await Order.findById(order._id).lean();

    SocketEventService.emitNewOrder(restaurantId.toString(), populatedOrder);

    return populatedOrder;
  }

  public static async getActiveTableOrder(restaurantId: string, tableNumber: string) {
    if (!restaurantId || !tableNumber) return null;
    const order = await Order.findOne({
      restaurantId,
      tableNumber: { $regex: new RegExp(`^${tableNumber.trim()}$`, 'i') },
      orderStatus: { $in: [ORDER_STATUS.NEW, ORDER_STATUS.ACCEPTED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY] },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!order) return null;

    return {
      id: order._id,
      orderNumber: order.orderNumber,
      restaurantId: order.restaurantId,
      status: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      orderType: order.orderType,
      tableNumber: order.tableNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      items: order.items,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.grandTotal,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  public static async getPublicTrack(orderIdOrNumber: string) {
    let order = null;
    if (mongoose.Types.ObjectId.isValid(orderIdOrNumber)) {
      order = await Order.findById(orderIdOrNumber).lean();
    }
    if (!order) {
      const num = parseInt(orderIdOrNumber, 10);
      if (!isNaN(num)) {
        order = await Order.findOne({ orderNumber: num }).sort({ createdAt: -1 }).lean();
      }
    }
    if (!order) {
      throw new AppError('Order not found', 404, ERROR_CODES.NOT_FOUND);
    }
    return {
      id: order._id,
      orderNumber: order.orderNumber,
      restaurantId: order.restaurantId,
      status: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      orderType: order.orderType,
      tableNumber: order.tableNumber,
      customerName: order.customerName,
      items: order.items,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.grandTotal,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  public static async getOrders(
    restaurantId: string | undefined,
    pagination: ParsedPagination,
    filters: {
      status?: string;
      paymentStatus?: string;
      paymentMethod?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    const query: any = {};
    if (restaurantId) {
      query.restaurantId = restaurantId;
    }

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
      .populate('restaurantId', 'name city ownerName phone')
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
        notes: item.notes,
      })),
      pricing: {
        subtotal: order.subtotal,
        discount: order.discount,
        tax: order.tax,
        grandTotal: order.grandTotal,
      },
      billFooter: {
        thankYouMessage: 'Thank you for dining with us!',
        poweredBy: 'Powered by ServDesk',
        contact: '8385973582',
      },
    };
  }

  public static async addItemsToOrder(
    restaurantId: string,
    id: string,
    requestItems: { menuItemId: string; quantity: number }[],
    paymentMethod?: string
  ) {
    const order = await Order.findOne({ _id: id, restaurantId });
    if (!order) {
      throw new AppError('Order not found.', 404, ERROR_CODES.NOT_FOUND);
    }
    if (order.orderStatus === ORDER_STATUS.CANCELLED) {
      throw new AppError('Cannot add items to a cancelled order.', 400, ERROR_CODES.BAD_REQUEST);
    }

    const menuItemIds = requestItems.map((item) => item.menuItemId);
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

    let hasKitchenItem = false;

    for (const reqItem of requestItems) {
      const dbItem = dbMenuMap.get(reqItem.menuItemId);
      const unitPrice = dbItem.discountPrice && dbItem.discountPrice > 0 ? dbItem.discountPrice : dbItem.price;
      const itemTotal = unitPrice * reqItem.quantity;
      const requiresKitchen = dbItem.requiresKitchen !== false;

      if (requiresKitchen) {
        hasKitchenItem = true;
      }

      // Check if item already exists in order
      const existingItem = order.items.find(
        (it) => it.menuItemId.toString() === dbItem._id.toString()
      );

      if (existingItem) {
        existingItem.quantity += reqItem.quantity;
        existingItem.total += itemTotal;
        if ((reqItem as any).notes) {
          existingItem.notes = existingItem.notes
            ? `${existingItem.notes}, ${(reqItem as any).notes}`
            : (reqItem as any).notes;
        }
      } else {
        order.items.push({
          menuItemId: dbItem._id,
          name: dbItem.name,
          quantity: reqItem.quantity,
          price: unitPrice,
          total: itemTotal,
          requiresKitchen,
          notes: (reqItem as any).notes,
        });
      }
    }

    // Recalculate totals
    const subtotal = order.items.reduce((acc, it) => acc + it.total, 0);
    const tax = Math.round(subtotal * 0.05); // 5% GST
    const grandTotal = Math.max(0, subtotal - (order.discount || 0) + tax);

    order.subtotal = subtotal;
    order.tax = tax;
    order.grandTotal = grandTotal;

    if (hasKitchenItem && (order.orderStatus === ORDER_STATUS.COMPLETED || order.orderStatus === ORDER_STATUS.READY)) {
      order.orderStatus = ORDER_STATUS.PREPARING;
    }

    if (paymentMethod) {
      order.paymentMethod = paymentMethod as any;
    }

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('createdBy', 'name email')
      .lean();

    SocketEventService.emitOrderStatusChange(
      restaurantId,
      SOCKET_EVENTS.ORDER_PREPARING,
      populatedOrder
    );

    return populatedOrder;
  }
}

