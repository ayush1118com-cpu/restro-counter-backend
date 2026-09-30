import { Router } from 'express';
import { StaffController } from '../controllers/staff.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { requireRestaurant } from '../middleware/restaurant.middleware.js';
import { ROLES } from '../constants/index.js';

const router = Router();

router.use(authenticate);
router.use(authorize(ROLES.RESTAURANT_ADMIN));
router.use(requireRestaurant);

router.post('/', StaffController.create);
router.get('/', StaffController.getAll);
router.delete('/:id', StaffController.delete);

export default router;
