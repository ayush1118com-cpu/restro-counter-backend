import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env.js';
import { socketAuthMiddleware, AuthenticatedSocket } from './socketAuth.js';
import { SocketEventService } from './socketEvents.js';
import { logger } from '../utils/logger.js';
import { ROLES } from '../constants/index.js';

let ioInstance: Server | null = null;

export const initSocket = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use(socketAuthMiddleware as any);

  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const user = authSocket.user;

    if (!user) {
      logger.warn(`Unauthenticated socket connection rejected: ${socket.id}`);
      socket.disconnect(true);
      return;
    }

    logger.info(`Socket client connected: ${socket.id} (User: ${user.email}, Role: ${user.role})`);

    if ((user.role === ROLES.RESTAURANT_ADMIN || user.role === ROLES.KITCHEN_STAFF) && user.restaurantId) {
      const room = `restaurant:${user.restaurantId}`;
      socket.join(room);
      logger.info(`Socket ${socket.id} joined room: ${room}`);
    } else if (user.role === ROLES.SUPER_ADMIN) {
      socket.join('super-admin');
      logger.info(`Socket ${socket.id} joined super-admin room`);
    }

    socket.on('disconnect', (reason) => {
      logger.info(`Socket client disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });

  SocketEventService.init(io);
  ioInstance = io;
  return io;
};

export const getIO = (): Server => {
  if (!ioInstance) {
    throw new Error('Socket.IO is not initialized!');
  }
  return ioInstance;
};
