import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { requireRestaurant } from '../middleware/restaurant.middleware.js';
import { uploadSingleImage } from '../middleware/upload.middleware.js';
import { ROLES } from '../constants/index.js';

const router = Router();

router.use(authenticate);
router.use(requireRestaurant);

router.post('/', authorize(ROLES.RESTAURANT_ADMIN), uploadSingleImage('image'), CategoryController.create);
router.get('/', authorize(ROLES.RESTAURANT_ADMIN, ROLES.KITCHEN_STAFF), CategoryController.getAll);
router.get('/:id', authorize(ROLES.RESTAURANT_ADMIN, ROLES.KITCHEN_STAFF), CategoryController.getById);
router.patch('/:id', authorize(ROLES.RESTAURANT_ADMIN), uploadSingleImage('image'), CategoryController.update);
router.delete('/:id', authorize(ROLES.RESTAURANT_ADMIN), CategoryController.delete);

export default router;
