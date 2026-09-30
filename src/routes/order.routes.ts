import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { requireRestaurant } from '../middleware/restaurant.middleware.js';
import { ROLES } from '../constants/index.js';

const router = Router();

router.use(authenticate);
router.use(requireRestaurant);

// Create order (Counter POS / Admin)
router.post('/', authorize(ROLES.RESTAURANT_ADMIN), OrderController.create);

// Order List & Details (Admin & Kitchen Staff)
router.get('/', authorize(ROLES.RESTAURANT_ADMIN, ROLES.KITCHEN_STAFF), OrderController.getAll);
router.get('/:id', authorize(ROLES.RESTAURANT_ADMIN, ROLES.KITCHEN_STAFF), OrderController.getById);
router.get('/:id/bill', authorize(ROLES.RESTAURANT_ADMIN, ROLES.KITCHEN_STAFF), OrderController.getBill);

// Update Status (Admin & Kitchen Staff)
router.patch('/:id/status', authorize(ROLES.RESTAURANT_ADMIN, ROLES.KITCHEN_STAFF), OrderController.updateStatus);

export default router;
