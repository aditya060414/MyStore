import express from 'express';
import { getHistory } from '../controllers/historyController.js';
import { protect } from '../middleware/authMiddleware.js';
import { resolveBusiness } from '../middleware/businessMiddleware.js';

const router = express.Router();

router.use(protect, resolveBusiness);

router.get('/', getHistory);

export default router;
