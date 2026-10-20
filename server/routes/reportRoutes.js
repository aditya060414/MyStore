import express from 'express';
import { getDashboardMetrics, getFinancialReport, getSalesReport } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';
import { resolveBusiness } from '../middleware/businessMiddleware.js';

const router = express.Router();

router.use(protect, resolveBusiness);

router.get('/dashboard', getDashboardMetrics);
router.get('/financial', getFinancialReport);
router.get('/sales-report', getSalesReport);

export default router;
