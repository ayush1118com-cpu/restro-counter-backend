import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response.js';

export const leadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(res, 'Too many lead submissions from this IP, please try again after 15 minutes.', 429);
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(res, 'Too many login attempts from this IP, please try again after 15 minutes.', 429);
  },
});
