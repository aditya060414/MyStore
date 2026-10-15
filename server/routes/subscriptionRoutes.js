import express from 'express';
import {
  getPlans,
  getCurrentSubscription,
  upgradePlan,
} from '../controllers/subscriptionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { resolveTenant } from '../middleware/tenantMiddleware.js';
import { requireRoles } from '../middleware/rbacMiddleware.js';

const router = express.Router();

// Public plans list
router.get('/plans', getPlans);

// Tenant subscription management
router.get('/current', protect, resolveTenant, getCurrentSubscription);
router.post('/upgrade', protect, resolveTenant, requireRoles(['owner']), upgradePlan);

export default router;
