import express from 'express';
import {
  onboardTenant,
  getCurrentTenant,
  updateSettings,
  getStaff,
  addStaff,
} from '../controllers/tenantController.js';
import { protect } from '../middleware/authMiddleware.js';
import { resolveTenant } from '../middleware/tenantMiddleware.js';
import { requireRoles } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.post('/onboard', protect, onboardTenant);
router.get('/current', protect, resolveTenant, getCurrentTenant);
router.put('/settings', protect, resolveTenant, requireRoles(['owner', 'manager']), updateSettings);
router.get('/staff', protect, resolveTenant, getStaff);
router.post('/staff', protect, resolveTenant, requireRoles(['owner']), addStaff);

export default router;
