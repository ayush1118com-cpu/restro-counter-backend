import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { requireRestaurant } from '../middleware/restaurant.middleware.js';
import { uploadSingleImage } from '../middleware/upload.middleware.js';
import { ROLES } from '../constants/index.js';

const router = Router();

router.use(authenticate);
router.use(authorize(ROLES.RESTAURANT_ADMIN));
router.use(requireRestaurant);

router.post('/', uploadSingleImage('image'), CategoryController.create);
router.get('/', CategoryController.getAll);
router.get('/:id', CategoryController.getById);
router.patch('/:id', uploadSingleImage('image'), CategoryController.update);
router.delete('/:id', CategoryController.delete);

export default router;
