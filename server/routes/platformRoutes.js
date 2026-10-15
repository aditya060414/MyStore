import express from 'express';
import {
  getPlatformOverview,
  getPlatformTenants,
  updateTenantStatus,
} from '../controllers/platformController.js';
import { protect, requirePlatformAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, requirePlatformAdmin);

router.get('/overview', getPlatformOverview);
router.get('/tenants', getPlatformTenants);
router.put('/tenants/:id/status', updateTenantStatus);

export default router;
