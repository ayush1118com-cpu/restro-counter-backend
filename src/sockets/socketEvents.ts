import { Server } from 'socket.io';
import { SOCKET_EVENTS } from '../constants/index.js';
import { logger } from '../utils/logger.js';

export class SocketEventService {
  private static io: Server | null = null;

  public static init(io: Server): void {
    SocketEventService.io = io;
  }

  public static emitNewOrder(restaurantId: string, order: any): void {
    if (!SocketEventService.io) return;
    const room = `restaurant:${restaurantId}`;
    logger.info(`Emitting '${SOCKET_EVENTS.NEW_ORDER}' to room '${room}' for Order #${order.orderNumber}`);

    SocketEventService.io.to(room).emit(SOCKET_EVENTS.NEW_ORDER, {
      type: 'NEW_ORDER',
      order,
    });
  }

  public static emitOrderStatusChange(
    restaurantId: string,
    event: string,
    order: any
  ): void {
    if (!SocketEventService.io) return;
    const room = `restaurant:${restaurantId}`;
    logger.info(`Emitting '${event}' to room '${room}' for Order #${order.orderNumber}`);

    SocketEventService.io.to(room).emit(event, {
      type: event.toUpperCase().replace('-', '_'),
      order,
    });
  }

  public static emitPaymentUpdate(restaurantId: string, payment: any): void {
    if (!SocketEventService.io) return;
    const room = `restaurant:${restaurantId}`;
    logger.info(`Emitting '${SOCKET_EVENTS.PAYMENT_UPDATED}' to room '${room}'`);

    SocketEventService.io.to(room).emit(SOCKET_EVENTS.PAYMENT_UPDATED, {
      type: 'PAYMENT_UPDATED',
      payment,
    });
  }
}
