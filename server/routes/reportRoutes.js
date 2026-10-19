import express from 'express';
import { getDashboardMetrics, getFinancialReport } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';
import { resolveBusiness } from '../middleware/businessMiddleware.js';

const router = express.Router();

router.use(protect, resolveBusiness);

router.get('/dashboard', getDashboardMetrics);
router.get('/financial', getFinancialReport);

export default router;
