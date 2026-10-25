import { Router } from 'express';
import { RestaurantController } from '../controllers/restaurant.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { uploadSingleImage } from '../middleware/upload.middleware.js';
import { ROLES } from '../constants/index.js';

const router = Router();

router.use(authenticate);

// RESTAURANT_ADMIN & SUPER_ADMIN can view and update their own restaurant profile
router.get('/me', authorize(ROLES.RESTAURANT_ADMIN, ROLES.SUPER_ADMIN, ROLES.KITCHEN_STAFF), RestaurantController.getMyRestaurant);
router.patch('/me', authorize(ROLES.RESTAURANT_ADMIN, ROLES.SUPER_ADMIN), uploadSingleImage('logo'), RestaurantController.updateMyRestaurant);

router.get('/:id', authorize(ROLES.SUPER_ADMIN, ROLES.RESTAURANT_ADMIN), RestaurantController.getById);
router.patch('/:id', authorize(ROLES.SUPER_ADMIN, ROLES.RESTAURANT_ADMIN), uploadSingleImage('logo'), RestaurantController.update);

// SUPER_ADMIN only operations
router.post('/', authorize(ROLES.SUPER_ADMIN), uploadSingleImage('logo'), RestaurantController.create);
router.get('/', authorize(ROLES.SUPER_ADMIN), RestaurantController.getAll);
router.patch('/:id/status', authorize(ROLES.SUPER_ADMIN), RestaurantController.updateStatus);
router.patch('/:id/password', authorize(ROLES.SUPER_ADMIN), RestaurantController.updatePassword);
router.delete('/:id', authorize(ROLES.SUPER_ADMIN), RestaurantController.delete);

export default router;
