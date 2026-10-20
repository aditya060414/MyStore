import express from 'express';
import {
  getCustomers,
  searchCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  archiveCustomer,
  restoreCustomer,
  getCustomerOrders,
  getCustomerDues,
  recordCustomerPayment,
  getCustomerPayments,
  getCustomerLedger,
  getCustomerStatement,
  getCustomerTimeline,
} from '../controllers/customerController.js';
import { protect } from '../middleware/authMiddleware.js';
import { resolveBusiness } from '../middleware/businessMiddleware.js';

const router = express.Router();

router.use(protect, resolveBusiness);

router.get('/', getCustomers);
router.post('/', createCustomer);
router.get('/search', searchCustomers);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);
router.delete('/:id', archiveCustomer);
router.patch('/:id/restore', restoreCustomer);
router.get('/:id/orders', getCustomerOrders);
router.get('/:id/dues', getCustomerDues);
router.post('/:id/payments', recordCustomerPayment);
router.get('/:id/payments', getCustomerPayments);
router.get('/:id/ledger', getCustomerLedger);
router.get('/:id/statement', getCustomerStatement);
router.get('/:id/timeline', getCustomerTimeline);

export default router;
