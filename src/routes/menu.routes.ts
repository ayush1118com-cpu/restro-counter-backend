import { Router } from 'express';
import { MenuController } from '../controllers/menu.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { requireRestaurant } from '../middleware/restaurant.middleware.js';
import { uploadSingleImage } from '../middleware/upload.middleware.js';
import { ROLES } from '../constants/index.js';

const router = Router();

// Public Menu Endpoint for Table QR Scanning
router.get('/public/:restaurantId', MenuController.getPublicMenu);

router.use(authenticate);
router.use(requireRestaurant);

router.post('/', authorize(ROLES.RESTAURANT_ADMIN, ROLES.SUPER_ADMIN), uploadSingleImage('image'), MenuController.create);
router.get('/', authorize(ROLES.RESTAURANT_ADMIN, ROLES.KITCHEN_STAFF, ROLES.SUPER_ADMIN), MenuController.getAll);
router.get('/:id', authorize(ROLES.RESTAURANT_ADMIN, ROLES.KITCHEN_STAFF, ROLES.SUPER_ADMIN), MenuController.getById);
router.patch('/:id', authorize(ROLES.RESTAURANT_ADMIN, ROLES.SUPER_ADMIN), uploadSingleImage('image'), MenuController.update);
router.patch('/:id/availability', authorize(ROLES.RESTAURANT_ADMIN, ROLES.KITCHEN_STAFF, ROLES.SUPER_ADMIN), MenuController.updateAvailability);
router.delete('/:id', authorize(ROLES.RESTAURANT_ADMIN, ROLES.SUPER_ADMIN), MenuController.delete);

export default router;
