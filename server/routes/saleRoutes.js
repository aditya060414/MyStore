import express from 'express';
import { createSale, getSales, getSaleById } from '../controllers/saleController.js';
import { protect } from '../middleware/authMiddleware.js';
import { resolveTenant } from '../middleware/tenantMiddleware.js';

const router = express.Router();

router.use(protect, resolveTenant);

router.post('/', createSale);
router.get('/', getSales);
router.get('/:idOrBill', getSaleById);

export default router;
