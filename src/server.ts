import http from 'http';
import mongoose from 'mongoose';
import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { initSocket, getIO } from './sockets/socket.js';
import { logger } from './utils/logger.js';

const startServer = async () => {
  await connectDB();

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  const server = httpServer.listen(env.PORT, () => {
    logger.info(`Restro Counter Backend Server running on port ${env.PORT} in ${env.NODE_ENV} mode.`);
    logger.info(`Swagger API Documentation: http://localhost:${env.PORT}/api/docs`);
    logger.info(`Health Check Endpoint: http://localhost:${env.PORT}/api/health`);
  });

  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Initiating graceful shutdown...`);

    server.close(() => {
      logger.info('HTTP server closed.');
    });

    try {
      const io = getIO();
      io.close(() => {
        logger.info('Socket.IO server closed.');
      });
    } catch (e) {
      // Socket might not be initialized
    }

    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed.');
    } catch (err: any) {
      logger.error(`Error closing MongoDB connection: ${err.message}`);
    }

    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

startServer().catch((error) => {
  logger.error(`Fatal error starting server: ${error.message}`);
  process.exit(1);
});
