import express from 'express';
import {
  getPlatformOverview,
  getPlatformBusinesses,
  updateBusinessStatus,
  updateBusinessPlan,
  grantBusinessFreebie,
  getPlatformPlans,
  createPlatformPlan,
  updatePlatformPlan,
  togglePlatformPlanStatus,
  deletePlatformPlan,
  getPlatformAds,
  createPlatformAd,
  updatePlatformAdStatus,
  deletePlatformAd,
  getPlatformPromotions,
  createPlatformPromotion,
  getPlatformBroadcast,
  setPlatformBroadcast,
} from '../controllers/platformController.js';
import { protect, requirePlatformAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public broadcast fetch (for merchants)
router.get('/broadcast', getPlatformBroadcast);

// Protected operator console routes
router.use(protect, requirePlatformAdmin);

router.get('/overview', getPlatformOverview);

// Businesses & Store management
router.get('/businesses', getPlatformBusinesses);
router.put('/businesses/:id/status', updateBusinessStatus);
router.put('/businesses/:id/plan', updateBusinessPlan);
router.post('/businesses/:id/freebie', grantBusinessFreebie);

// Plans & Subscription management
router.get('/plans', getPlatformPlans);
router.post('/plans', createPlatformPlan);
router.put('/plans/:id', updatePlatformPlan);
router.patch('/plans/:id/status', togglePlatformPlanStatus);
router.delete('/plans/:id', deletePlatformPlan);

// Customer Store Ads & Promotions
router.get('/ads', getPlatformAds);
router.post('/ads', createPlatformAd);
router.put('/ads/:id/status', updatePlatformAdStatus);
router.delete('/ads/:id', deletePlatformAd);

// Promo codes & Freebies
router.get('/promotions', getPlatformPromotions);
router.post('/promotions', createPlatformPromotion);

// Broadcast update
router.post('/broadcast', setPlatformBroadcast);

// Backward compatibility endpoints
router.get('/tenants', getPlatformBusinesses);
router.put('/tenants/:id/status', updateBusinessStatus);

export default router;
