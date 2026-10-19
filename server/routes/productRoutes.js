import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductStock,
} from '../controllers/productController.js';
import { protect, requireRoles } from '../middleware/authMiddleware.js';
import { resolveBusiness } from '../middleware/businessMiddleware.js';

const router = express.Router();

router.use(protect, resolveBusiness);

router.get('/', getProducts);
router.get('/:idOrBarcode', getProduct);
router.post('/', requireRoles(['owner', 'manager', 'inventory_manager']), createProduct);
router.post('/:id/stock', requireRoles(['owner', 'manager', 'inventory_manager']), addProductStock);
router.put('/:id', requireRoles(['owner', 'manager', 'inventory_manager']), updateProduct);
router.delete('/:id', requireRoles(['owner', 'manager']), deleteProduct);

export default router;
