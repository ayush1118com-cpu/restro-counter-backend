import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { initCloudinary } from './config/cloudinary.js';
import { errorHandler, AppError } from './middleware/error.middleware.js';
import { ERROR_CODES } from './constants/index.js';

import authRoutes from './routes/auth.routes.js';
import restaurantRoutes from './routes/restaurant.routes.js';
import leadRoutes from './routes/lead.routes.js';
import categoryRoutes from './routes/category.routes.js';
import menuRoutes from './routes/menu.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import reportRoutes from './routes/report.routes.js';
import staffRoutes from './routes/staff.routes.js';
import healthRoutes from './routes/health.routes.js';
import swaggerRoutes from './routes/swagger.routes.js';

initCloudinary();

const app: Application = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: [
      env.FRONTEND_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://restro-counter.vercel.app',
      'https://restro-counter-system.vercel.app',
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/docs', swaggerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/staff', staffRoutes);

// 404 Route Handler
app.use('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Resource not found: ${req.originalUrl}`, 404, ERROR_CODES.NOT_FOUND));
});

// Central Error Handler
app.use(errorHandler as any);

export default app;
