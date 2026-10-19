import express from 'express';
import {
  getPlans,
  getCurrentSubscription,
  upgradePlan,
} from '../controllers/subscriptionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { resolveBusiness } from '../middleware/businessMiddleware.js';
import { requireRoles } from '../middleware/rbacMiddleware.js';

const router = express.Router();

// Public plans list
router.get('/plans', getPlans);

// Business subscription management
router.get('/current', protect, resolveBusiness, getCurrentSubscription);
router.post('/upgrade', protect, resolveBusiness, requireRoles(['owner']), upgradePlan);

export default router;
