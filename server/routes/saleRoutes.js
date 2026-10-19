import express from 'express';
import { createSale, getSales, getSaleById } from '../controllers/saleController.js';
import { protect } from '../middleware/authMiddleware.js';
import { resolveBusiness } from '../middleware/businessMiddleware.js';

const router = express.Router();

router.use(protect, resolveBusiness);

router.post('/', createSale);
router.get('/', getSales);
router.get('/:idOrBill', getSaleById);

export default router;
