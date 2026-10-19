import Plan from '../models/Plan.js';
import Subscription from '../models/Subscription.js';
import Business from '../models/Business.js';
import Product from '../models/Product.js';
import Store from '../models/Store.js';
import Membership from '../models/Membership.js';
import AuditLog from '../models/AuditLog.js';

// @desc    Get all active subscription plans
// @route   GET /api/v1/subscriptions/plans
export const getPlans = async (req, res) => {
  try {
    let plans = await Plan.find({ isActive: true }).sort({ sortOrder: 1, priceMonthly: 1 });
    if (plans.length === 0) {
      const totalCount = await Plan.countDocuments();
      if (totalCount === 0) {
        await Plan.create([
          {
            name: 'Free Starter',
            slug: 'free',
            description: 'Essential billing and single-counter POS for local micro-retailers.',
            priceMonthly: 0,
            priceAnnual: 0,
            currency: 'INR',
            badge: 'Starter',
            isDefault: true,
            isActive: true,
            features: ['1 Counter POS', 'Basic Inventory', 'Thermal Bill Print', 'Up to 50 Products'],
            limits: { maxStores: 1, maxProducts: 50, maxStaff: 1, onlineStorefront: false, qrStoreSharing: true },
            sortOrder: 1,
          },
          {
            name: 'Pro Merchant',
            slug: 'pro',
            description: 'Full-featured online storefront, multi-store support, analytics & WhatsApp orders.',
            priceMonthly: 999,
            priceAnnual: 9990,
            currency: 'INR',
            badge: 'Popular',
            isDefault: false,
            isActive: true,
            features: ['Online Storefront', 'Unlimited Products', 'Daily Reports', 'WhatsApp Orders', 'QR Standee'],
            limits: { maxStores: 3, maxProducts: 5000, maxStaff: 5, onlineStorefront: true, qrStoreSharing: true, advancedReports: true },
            sortOrder: 2,
          },
          {
            name: 'Enterprise Retail',
            slug: 'enterprise',
            description: 'Multi-branch retail chains, custom domains, VIP support & unlimited scale.',
            priceMonthly: 2499,
            priceAnnual: 24990,
            currency: 'INR',
            badge: 'VIP Enterprise',
            isDefault: false,
            isActive: true,
            features: ['Multi-Branch Warehouses', 'Unlimited Stores', 'Custom Domain', 'Dedicated Account Manager'],
            limits: { maxStores: 25, maxProducts: 50000, maxStaff: 50, onlineStorefront: true, customBranding: true, advancedReports: true, prioritySupport: true, customDomain: true },
            sortOrder: 3,
          },
        ]);
        plans = await Plan.find({ isActive: true }).sort({ sortOrder: 1, priceMonthly: 1 });
      }
    }
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current business subscription and real-time usage
// @route   GET /api/v1/subscriptions/current
export const getCurrentSubscription = async (req, res) => {
  try {
    const activeBusinessId = req.businessId || req.tenantId;
    const subscription = await Subscription.findOne({ businessId: activeBusinessId }).populate('planId');
    const business = await Business.findById(activeBusinessId).populate('planId');

    const productsCount = await Product.countDocuments({ businessId: activeBusinessId, isArchived: false });
    const storesCount = await Store.countDocuments({ businessId: activeBusinessId, isActive: true });
    const staffCount = await Membership.countDocuments({ businessId: activeBusinessId, status: 'active' });

    res.json({
      success: true,
      data: {
        subscription,
        plan: business?.planId || subscription?.planId,
        businessStatus: business?.status,
        trialEndsAt: business?.trialEndsAt,
        usage: {
          productsCount,
          storesCount,
          staffCount,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upgrade or switch plan
// @route   POST /api/v1/subscriptions/upgrade
export const upgradePlan = async (req, res) => {
  try {
    const { planId, billingCycle = 'monthly' } = req.body;
    const activeBusinessId = req.businessId || req.tenantId;
    const plan = await Plan.findById(planId);

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    let subscription = await Subscription.findOne({ businessId: activeBusinessId });
    const amount = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;

    if (!subscription) {
      subscription = await Subscription.create({
        businessId: activeBusinessId,
        planId: plan._id,
        status: 'active',
        billingCycle,
        amount,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + (billingCycle === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000),
      });
    } else {
      subscription.planId = plan._id;
      subscription.status = 'active';
      subscription.billingCycle = billingCycle;
      subscription.amount = amount;
      subscription.currentPeriodStart = new Date();
      subscription.currentPeriodEnd = new Date(Date.now() + (billingCycle === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000);
      await subscription.save();
    }

    await Business.findByIdAndUpdate(activeBusinessId, {
      planId: plan._id,
      subscriptionId: subscription._id,
      status: 'active',
    });

    await AuditLog.create({
      businessId: activeBusinessId,
      userId: req.user?._id,
      userName: req.user?.name || 'Owner',
      action: 'PLAN_UPGRADED',
      entityType: 'Subscription',
      entityId: subscription._id.toString(),
      details: { newPlan: plan.name, billingCycle, amount },
    });

    res.json({ success: true, data: subscription, message: `Successfully upgraded to ${plan.name} plan` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
