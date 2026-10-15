import express from 'express';
import {
  getOrders,
  updateOrderStatus,
  createPublicOrder,
  trackPublicOrder,
} from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';
import { resolveTenant } from '../middleware/tenantMiddleware.js';

const router = express.Router();

// Public storefront order placement and tracking
router.post('/public/:storeSlug', createPublicOrder);
router.get('/public/track/:orderNumber', trackPublicOrder);

// Merchant authenticated management
router.get('/', protect, resolveTenant, getOrders);
router.put('/:id/status', protect, resolveTenant, updateOrderStatus);

export default router;
