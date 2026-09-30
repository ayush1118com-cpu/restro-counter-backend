import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { requireRestaurant } from '../middleware/restaurant.middleware.js';
import { ROLES } from '../constants/index.js';

const router = Router();

router.use(authenticate);

router.get(
  '/super-admin',
  authorize(ROLES.SUPER_ADMIN),
  DashboardController.getSuperAdminMetrics
);

router.get(
  '/',
  authorize(ROLES.RESTAURANT_ADMIN),
  requireRestaurant,
  DashboardController.getRestaurantMetrics
);

export default router;
