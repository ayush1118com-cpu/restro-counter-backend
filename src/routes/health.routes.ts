import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { sendSuccess } from '../utils/response.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  sendSuccess(res, 'Restro Counter API is running', {
    status: 'healthy',
    database: dbState,
    timestamp: new Date().toISOString(),
  });
});

export default router;
