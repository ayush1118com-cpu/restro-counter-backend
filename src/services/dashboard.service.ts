import { Restaurant } from '../models/Restaurant.js';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { Lead } from '../models/Lead.js';
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS, RESTAURANT_STATUS } from '../constants/index.js';

export class DashboardService {
  public static async getSuperAdminDashboardMetrics() {
    const totalRestaurants = await Restaurant.countDocuments();
    const activeRestaurants = await Restaurant.countDocuments({ status: RESTAURANT_STATUS.ACTIVE });
    const suspendedRestaurants = await Restaurant.countDocuments({ status: RESTAURANT_STATUS.SUSPENDED });
    const blockedRestaurants = await Restaurant.countDocuments({ status: RESTAURANT_STATUS.BLOCKED });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayOrders = await Order.countDocuments({ createdAt: { $gte: startOfDay } });

    const todayRevenueAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay },
          orderStatus: { $ne: ORDER_STATUS.CANCELLED },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$grandTotal' },
        },
      },
    ]);
    const todayRevenue = todayRevenueAgg[0]?.total || 0;

    const totalOrdersAllTime = await Order.countDocuments();
    const totalRevenueAllTimeAgg = await Order.aggregate([
      { $match: { orderStatus: { $ne: ORDER_STATUS.CANCELLED } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]);
    const totalRevenueAllTime = totalRevenueAllTimeAgg[0]?.total || 0;

    const newLeads = await Lead.countDocuments({ createdAt: { $gte: startOfDay } });

    return {
      totalRestaurants,
      activeRestaurants,
      suspendedRestaurants,
      blockedRestaurants,
      todayOrders,
      todayRevenue,
      totalOrdersAllTime,
      totalRevenueAllTime,
      newLeads,
    };
  }

  public static async getRestaurantDashboardMetrics(restaurantId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const rObjectId = (Restaurant as any).base.Types.ObjectId.isValid(restaurantId)
      ? (Restaurant as any).base.Types.ObjectId.createFromHexString(restaurantId)
      : restaurantId;

    const queryToday = { restaurantId: rObjectId, createdAt: { $gte: startOfDay } };

    const todayOrders = await Order.countDocuments(queryToday);

    const salesAgg = await Order.aggregate([
      {
        $match: {
          restaurantId: rObjectId,
          createdAt: { $gte: startOfDay },
          orderStatus: { $ne: ORDER_STATUS.CANCELLED },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$grandTotal' },
          cashTotal: {
            $sum: { $cond: [{ $eq: ['$paymentMethod', PAYMENT_METHOD.CASH] }, '$grandTotal', 0] },
          },
          upiTotal: {
            $sum: { $cond: [{ $eq: ['$paymentMethod', PAYMENT_METHOD.UPI] }, '$grandTotal', 0] },
          },
          cardTotal: {
            $sum: { $cond: [{ $eq: ['$paymentMethod', PAYMENT_METHOD.CARD] }, '$grandTotal', 0] },
          },
        },
      },
    ]);

    const salesData = salesAgg[0] || { totalSales: 0, cashTotal: 0, upiTotal: 0, cardTotal: 0 };

    const pendingOrders = await Order.countDocuments({
      restaurantId: rObjectId,
      orderStatus: { $in: [ORDER_STATUS.NEW, ORDER_STATUS.ACCEPTED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY] },
    });

    const completedOrders = await Order.countDocuments({
      restaurantId: rObjectId,
      orderStatus: ORDER_STATUS.COMPLETED,
      createdAt: { $gte: startOfDay },
    });

    return {
      todayOrders,
      todaySales: salesData.totalSales,
      pendingOrders,
      completedOrders,
      cashTotal: salesData.cashTotal,
      upiTotal: salesData.upiTotal,
      cardTotal: salesData.cardTotal,
    };
  }
}
