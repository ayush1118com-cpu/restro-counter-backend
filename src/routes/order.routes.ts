import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { requireRestaurant } from '../middleware/restaurant.middleware.js';
import { ROLES } from '../constants/index.js';

const router = Router();

router.use(authenticate);
router.use(requireRestaurant);

// Create order (Counter POS / Admin / Kitchen Staff / Super Admin)
router.post('/', authorize(ROLES.RESTAURANT_ADMIN, ROLES.KITCHEN_STAFF, ROLES.SUPER_ADMIN), OrderController.create);

// Order List & Details (Admin & Kitchen Staff & Super Admin)
router.get('/', authorize(ROLES.RESTAURANT_ADMIN, ROLES.KITCHEN_STAFF, ROLES.SUPER_ADMIN), OrderController.getAll);
router.get('/:id', authorize(ROLES.RESTAURANT_ADMIN, ROLES.KITCHEN_STAFF, ROLES.SUPER_ADMIN), OrderController.getById);
router.get('/:id/bill', authorize(ROLES.RESTAURANT_ADMIN, ROLES.KITCHEN_STAFF, ROLES.SUPER_ADMIN), OrderController.getBill);

// Update Status (Admin & Kitchen Staff & Super Admin)
router.patch('/:id/status', authorize(ROLES.RESTAURANT_ADMIN, ROLES.KITCHEN_STAFF, ROLES.SUPER_ADMIN), OrderController.updateStatus);

// Add items to existing order (Counter POS / Admin / Kitchen Staff / Super Admin)
router.post('/:id/items', authorize(ROLES.RESTAURANT_ADMIN, ROLES.KITCHEN_STAFF, ROLES.SUPER_ADMIN), OrderController.addItems);

export default router;
