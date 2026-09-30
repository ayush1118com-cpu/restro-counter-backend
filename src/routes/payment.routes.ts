import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { requireRestaurant } from '../middleware/restaurant.middleware.js';
import { ROLES } from '../constants/index.js';

const router = Router();

router.use(authenticate);
router.use(authorize(ROLES.RESTAURANT_ADMIN));
router.use(requireRestaurant);

router.post('/', PaymentController.create);
router.get('/', PaymentController.getAll);
router.get('/:id', PaymentController.getById);

export default router;
