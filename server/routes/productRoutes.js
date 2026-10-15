import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';
import { resolveTenant } from '../middleware/tenantMiddleware.js';
import { requireRoles } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(protect, resolveTenant);

router.get('/', getProducts);
router.get('/:idOrBarcode', getProduct);
router.post('/', requireRoles(['owner', 'manager', 'inventory_manager']), createProduct);
router.put('/:id', requireRoles(['owner', 'manager', 'inventory_manager']), updateProduct);
router.delete('/:id', requireRoles(['owner', 'manager']), deleteProduct);

export default router;
