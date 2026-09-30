import { Router } from 'express';
import { RestaurantController } from '../controllers/restaurant.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { uploadSingleImage } from '../middleware/upload.middleware.js';
import { ROLES } from '../constants/index.js';

const router = Router();

router.use(authenticate);
router.use(authorize(ROLES.SUPER_ADMIN));

router.post('/', uploadSingleImage('logo'), RestaurantController.create);
router.get('/', RestaurantController.getAll);
router.get('/:id', RestaurantController.getById);
router.patch('/:id', uploadSingleImage('logo'), RestaurantController.update);
router.patch('/:id/status', RestaurantController.updateStatus);

export default router;
