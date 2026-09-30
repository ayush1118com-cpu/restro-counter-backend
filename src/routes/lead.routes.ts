import { Router } from 'express';
import { LeadController } from '../controllers/lead.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { leadRateLimiter } from '../middleware/rateLimit.middleware.js';
import { ROLES } from '../constants/index.js';

const router = Router();

// Public endpoint
router.post('/', leadRateLimiter, LeadController.create);

// Super Admin protected endpoints
router.get('/', authenticate, authorize(ROLES.SUPER_ADMIN), LeadController.getAll);
router.get('/:id', authenticate, authorize(ROLES.SUPER_ADMIN), LeadController.getById);
router.patch('/:id', authenticate, authorize(ROLES.SUPER_ADMIN), LeadController.updateStatus);
router.delete('/:id', authenticate, authorize(ROLES.SUPER_ADMIN), LeadController.delete);

export default router;
