import Plan from '../models/Plan.js';
import Subscription from '../models/Subscription.js';
import Tenant from '../models/Tenant.js';
import AuditLog from '../models/AuditLog.js';

// @desc    Get all active subscription plans
// @route   GET /api/v1/subscriptions/plans
export const getPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ sortOrder: 1 });
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current tenant subscription
// @route   GET /api/v1/subscriptions/current
export const getCurrentSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ tenantId: req.tenantId }).populate('planId');
    const tenant = await Tenant.findById(req.tenantId);

    res.json({
      success: true,
      data: {
        subscription,
        tenantStatus: tenant?.status,
        trialEndsAt: tenant?.trialEndsAt,
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
    const plan = await Plan.findById(planId);

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    let subscription = await Subscription.findOne({ tenantId: req.tenantId });
    const amount = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;

    if (!subscription) {
      subscription = await Subscription.create({
        tenantId: req.tenantId,
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

    await Tenant.findByIdAndUpdate(req.tenantId, {
      planId: plan._id,
      subscriptionId: subscription._id,
      status: 'active',
    });

    await AuditLog.create({
      tenantId: req.tenantId,
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
