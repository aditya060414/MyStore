import express from 'express';
import { getDashboardMetrics, getFinancialReport } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';
import { resolveTenant } from '../middleware/tenantMiddleware.js';

const router = express.Router();

router.use(protect, resolveTenant);

router.get('/dashboard', getDashboardMetrics);
router.get('/financial', getFinancialReport);

export default router;
