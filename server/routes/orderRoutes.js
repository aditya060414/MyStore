import express from 'express';
import {
  getOrders,
  updateOrderStatus,
  getPublicStoreCatalog,
  createPublicOrder,
  trackPublicOrder,
} from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';
import { resolveBusiness } from '../middleware/businessMiddleware.js';

const router = express.Router();

// Public storefront order placement, catalog and tracking
router.get('/public/:storeHandle', getPublicStoreCatalog);
router.post('/public/:storeHandle', createPublicOrder);
router.get('/public/track/:orderNumber', trackPublicOrder);

// Business authenticated management
router.get('/', protect, resolveBusiness, getOrders);
router.put('/:id/status', protect, resolveBusiness, updateOrderStatus);

export default router;
