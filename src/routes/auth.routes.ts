import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.post('/login', authRateLimiter, AuthController.login);
router.post('/refresh', AuthController.refreshToken);
router.get('/me', authenticate, AuthController.me);
router.post('/logout', authenticate, AuthController.logout);
router.post('/change-password', authenticate, AuthController.changePassword);

export default router;
