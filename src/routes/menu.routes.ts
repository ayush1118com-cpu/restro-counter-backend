import { Router } from 'express';
import { MenuController } from '../controllers/menu.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { requireRestaurant } from '../middleware/restaurant.middleware.js';
import { uploadSingleImage } from '../middleware/upload.middleware.js';
import { ROLES } from '../constants/index.js';

const router = Router();

router.use(authenticate);
router.use(authorize(ROLES.RESTAURANT_ADMIN));
router.use(requireRestaurant);

router.post('/', uploadSingleImage('image'), MenuController.create);
router.get('/', MenuController.getAll);
router.get('/:id', MenuController.getById);
router.patch('/:id', uploadSingleImage('image'), MenuController.update);
router.patch('/:id/availability', MenuController.updateAvailability);
router.delete('/:id', MenuController.delete);

export default router;
