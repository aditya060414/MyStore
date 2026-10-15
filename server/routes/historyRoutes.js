import express from 'express';
import { getHistory } from '../controllers/historyController.js';
import { protect } from '../middleware/authMiddleware.js';
import { resolveTenant } from '../middleware/tenantMiddleware.js';

const router = express.Router();

router.use(protect, resolveTenant);

router.get('/', getHistory);

export default router;
