import express from 'express';
import {
  onboardBusiness,
  getCurrentBusiness,
  updateSettings,
  getStaff,
  addStaff,
} from '../controllers/businessController.js';
import { protect, requireRoles } from '../middleware/authMiddleware.js';
import { resolveBusiness } from '../middleware/businessMiddleware.js';

const router = express.Router();

router.post('/onboard', protect, onboardBusiness);
router.get('/current', protect, resolveBusiness, getCurrentBusiness);
router.put('/settings', protect, resolveBusiness, requireRoles(['owner', 'manager']), updateSettings);
router.get('/staff', protect, resolveBusiness, getStaff);
router.post('/staff', protect, resolveBusiness, requireRoles(['owner']), addStaff);

export default router;
