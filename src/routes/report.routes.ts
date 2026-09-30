import { Router } from 'express';
import { ReportController } from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { ROLES } from '../constants/index.js';

const router = Router();

router.use(authenticate);
router.use(authorize(ROLES.SUPER_ADMIN, ROLES.RESTAURANT_ADMIN));

router.get('/sales', ReportController.getSalesReport);
router.get('/orders', ReportController.getOrdersReport);
router.get('/payments', ReportController.getPaymentReport);

export default router;
