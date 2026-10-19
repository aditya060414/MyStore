import Business from '../models/Business.js';
import Store from '../models/Store.js';
import Membership from '../models/Membership.js';
import Plan from '../models/Plan.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import AuditLog from '../models/AuditLog.js';

// @desc    Onboarding: create business, primary store, subscription and assign owner
// @route   POST /api/v1/businesses/onboard (and POST /api/v1/tenants/onboard)
export const onboardBusiness = async (req, res) => {
  try {
    const {
      businessName,
      storeName,
      storeHandle,
      handle: inputHandle,
      planSlug = 'free',
      planHandle,
      phone,
      currency = 'INR',
      city = 'Bangalore',
      address = '123 Market Street',
      businessId: targetBusinessId,
      createNew = false,
    } = req.body;

    if (!businessName || !storeName) {
      return res.status(400).json({ success: false, message: 'Business name and store name are required' });
    }

    // Find requested or default plan (defaults to 'free')
    const targetPlanKey = planHandle || planSlug || 'free';
    let plan = await Plan.findOne({ $or: [{ slug: targetPlanKey }, { handle: targetPlanKey }] });
    if (!plan) {
      plan =
        (await Plan.findOne({ slug: 'free' })) ||
        (await Plan.findOne({ handle: 'free' })) ||
        (await Plan.findOne({ priceMonthly: 0 })) ||
        (await Plan.findOne({ isDefault: true }));
    }
    if (!plan) {
      plan = await Plan.create({
        name: 'Free Starter',
        slug: 'free',
        handle: 'free',
        description: 'Essential billing and single-counter POS for local micro-retailers.',
        priceMonthly: 0,
        priceAnnual: 0,
        features: ['1 Counter POS', 'Basic Inventory', 'Thermal Bill Print', 'Up to 50 Products'],
        limits: { maxStores: 1, maxProducts: 50, maxStaff: 1, onlineStorefront: false, qrStoreSharing: true },
        sortOrder: 1,
      });
    }

    let existingBusiness = null;
    const specifiedId = targetBusinessId || req.headers['x-business-id'] || req.headers['x-tenant-id'];

    if (specifiedId) {
      existingBusiness = await Business.findOne({ _id: specifiedId, ownerId: req.user._id });
    }
    if (!existingBusiness) {
      // Always reuse the user's existing business if one already exists for this owner
      existingBusiness =
        (await Business.findOne({ ownerId: req.user._id, name: new RegExp(`^${businessName.trim()}$`, 'i') })) ||
        (await Business.findOne({ ownerId: req.user._id }));
    }

    let business;
    let store;
    let subscription;

    if (existingBusiness) {
      // Update existing initial business instead of creating duplicate handle or business
      existingBusiness.name = businessName;
      existingBusiness.planId = plan ? plan._id : null;
      existingBusiness.currency = currency;
      existingBusiness.currencySymbol = currency === 'INR' ? '₹' : '$';
      if (phone || req.user.phone) existingBusiness.contactPhone = phone || req.user.phone;
      if (req.user.email) existingBusiness.contactEmail = req.user.email;
      if (storeHandle || inputHandle) {
        const cleanHandle = (storeHandle || inputHandle).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        existingBusiness.handle = cleanHandle;
        existingBusiness.slug = cleanHandle;
      } else if (!existingBusiness.handle && existingBusiness.slug) {
        existingBusiness.handle = existingBusiness.slug;
      }
      existingBusiness.settings = {
        ...existingBusiness.settings,
        receiptHeader: storeName,
      };

      // Find or update primary store (never create duplicate store if one exists)
      store =
        (await Store.findOne({ businessId: existingBusiness._id, isPrimary: true })) ||
        (await Store.findOne({ businessId: existingBusiness._id }));
      if (store) {
        store.name = storeName;
        store.phone = phone || store.phone || '9876543210';
        store.isPrimary = true;
        if (storeHandle || inputHandle) {
          const cleanHandle = (storeHandle || inputHandle).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          store.handle = cleanHandle;
          store.slug = cleanHandle;
        } else if (!store.handle && store.slug) {
          store.handle = store.slug;
        }
        store.address = {
          street: address,
          city: city,
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        };
        await store.save();
      } else {
        let storeHandleVal = (storeHandle || inputHandle || storeName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        store = await Store.create({
          businessId: existingBusiness._id,
          name: storeName,
          handle: storeHandleVal,
          slug: storeHandleVal,
          phone: phone || '9876543210',
          email: req.user.email,
          isPrimary: true,
          address: {
            street: address,
            city: city,
            state: 'Karnataka',
            postalCode: '560001',
            country: 'India',
          },
        });
      }

      // Update or create active subscription
      subscription = await Subscription.findOne({ businessId: existingBusiness._id });
      if (subscription) {
        subscription.planId = plan ? plan._id : null;
        subscription.status = 'active';
        subscription.amount = plan ? (plan.priceMonthly || 0) : 0;
        subscription.currency = currency;
        await subscription.save();
      } else {
        subscription = await Subscription.create({
          businessId: existingBusiness._id,
          planId: plan ? plan._id : null,
          status: 'active',
          billingCycle: 'monthly',
          amount: plan ? (plan.priceMonthly || 0) : 0,
          currency,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
      }

      existingBusiness.subscriptionId = subscription._id;
      await existingBusiness.save();
      business = existingBusiness;

      // Update membership touch date
      await Membership.findOneAndUpdate(
        { userId: req.user._id, businessId: business._id },
        { updatedAt: new Date(), status: 'active' },
        { new: true }
      );
    } else {
      // Generate unique store handle
      let baseHandle = (storeHandle || inputHandle || businessName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      let handle = baseHandle;
      let counter = 1;
      while (await Business.findOne({ $or: [{ handle }, { slug: handle }] })) {
        handle = `${baseHandle}-${counter}`;
        counter++;
      }

      // Create Business
      business = await Business.create({
        name: businessName,
        handle,
        slug: handle,
        ownerId: req.user._id,
        status: 'active',
        planId: plan ? plan._id : null,
        currency,
        currencySymbol: currency === 'INR' ? '₹' : '$',
        contactPhone: phone || req.user.phone || '',
        contactEmail: req.user.email,
        settings: {
          taxRate: 0,
          taxName: 'GST',
          invoicePrefix: 'INV-',
          receiptHeader: storeName,
          receiptFooter: 'Thank you for shopping with us! Visit again | BisonMooves Store',
        },
      });

      // Create Primary Store
      let storeHandleVal = (storeHandle || inputHandle || storeName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      store = await Store.create({
        businessId: business._id,
        name: storeName,
        handle: storeHandleVal,
        slug: storeHandleVal,
        phone: phone || '9876543210',
        email: req.user.email,
        isPrimary: true,
        address: {
          street: address,
          city: city,
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        },
      });

      // Create Active Subscription
      subscription = await Subscription.create({
        businessId: business._id,
        planId: plan ? plan._id : null,
        status: 'active',
        billingCycle: 'monthly',
        amount: plan ? (plan.priceMonthly || 0) : 0,
        currency,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      business.subscriptionId = subscription._id;
      await business.save();

      // Create Owner Membership
      await Membership.create({
        userId: req.user._id,
        businessId: business._id,
        role: 'owner',
        assignedStoreIds: [store._id],
        status: 'active',
      });
    }

    // Populate business planId and subscriptionId for consistent API responses
    const populatedBusiness = await Business.findById(business._id)
      .populate('planId')
      .populate('subscriptionId');

    const populatedSubscription = await Subscription.findById(subscription._id).populate('planId');

    // Audit log
    await AuditLog.create({
      businessId: business._id,
      userId: req.user._id,
      userName: req.user.name,
      action: existingBusiness ? 'BUSINESS_CONFIGURED' : 'BUSINESS_ONBOARDED',
      entityType: 'Business',
      entityId: business._id.toString(),
      details: { businessName, storeName, plan: plan?.name },
    });

    res.status(existingBusiness ? 200 : 201).json({
      success: true,
      data: {
        business: populatedBusiness,
        tenant: populatedBusiness, // Compatibility alias
        store,
        subscription: populatedSubscription,
        productsCount: 0,
      },
      message: existingBusiness
        ? 'Business store setup configured successfully'
        : 'Business store onboarded successfully',
    });
  } catch (error) {
    console.error('[Onboard Business Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current business details and active store
// @route   GET /api/v1/businesses/current (and GET /api/v1/tenants/current)
export const getCurrentBusiness = async (req, res) => {
  try {
    const activeId = req.businessId || req.tenantId;
    const business = await Business.findById(activeId).populate('planId').populate('subscriptionId');
    const stores = await Store.find({ businessId: activeId, isActive: true });
    const memberships = await Membership.find({ businessId: activeId, status: 'active' }).populate('userId', 'name email phone avatar');
    const productsCount = await Product.countDocuments({ businessId: activeId, isArchived: false });

    res.json({
      success: true,
      data: {
        business,
        tenant: business, // Compatibility alias
        stores,
        memberships,
        usage: {
          productsCount,
          storesCount: stores.length,
          staffCount: memberships.length,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update business settings (invoice, branding, tax)
// @route   PUT /api/v1/businesses/settings (and PUT /api/v1/tenants/settings)
export const updateSettings = async (req, res) => {
  try {
    const { name, settings, contactPhone, contactEmail } = req.body;
    const activeId = req.businessId || req.tenantId;

    const business = await Business.findById(activeId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    if (name && name.trim()) {
      business.name = name.trim();
      const newSlug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      business.slug = newSlug;
      await Store.updateMany(
        { businessId: business._id, isPrimary: true },
        { name: name.trim(), slug: newSlug }
      );
    }

    if (settings) {
      business.settings = { ...business.settings, ...settings };
    }
    if (contactPhone) business.contactPhone = contactPhone;
    if (contactEmail) business.contactEmail = contactEmail;

    await business.save();

    await AuditLog.create({
      businessId: activeId,
      userId: req.user._id,
      userName: req.user.name,
      action: 'BUSINESS_SETTINGS_UPDATED',
      entityType: 'BusinessSettings',
      entityId: business._id.toString(),
      details: { updatedKeys: Object.keys(settings || {}) },
    });

    res.json({ success: true, data: business });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all staff for business
// @route   GET /api/v1/businesses/staff (and GET /api/v1/tenants/staff)
export const getStaff = async (req, res) => {
  try {
    const activeId = req.businessId || req.tenantId;
    const staff = await Membership.find({ businessId: activeId }).populate('userId', 'name email phone avatar');
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add new staff member to business
// @route   POST /api/v1/businesses/staff (and POST /api/v1/tenants/staff)
export const addStaff = async (req, res) => {
  try {
    const { name, email, password, phone, role = 'cashier' } = req.body;
    const activeId = req.businessId || req.tenantId;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    // Check staff plan limits
    const business = await Business.findById(activeId).populate('planId');
    const currentStaffCount = await Membership.countDocuments({ businessId: activeId, status: 'active' });
    const maxStaff = business.planId?.limits?.maxStaff || 1;

    if (currentStaffCount >= maxStaff) {
      return res.status(403).json({
        success: false,
        message: `Plan limit reached (${maxStaff} staff members). Please upgrade your subscription to add more staff.`,
      });
    }

    // Find or create User
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        phone,
        role: 'merchant_staff',
      });
    }

    // Check if membership already exists
    const existingMembership = await Membership.findOne({ userId: user._id, businessId: activeId });
    if (existingMembership) {
      return res.status(400).json({ success: false, message: 'User is already a member of this business' });
    }

    const primaryStore = await Store.findOne({ businessId: activeId, isPrimary: true });

    const membership = await Membership.create({
      userId: user._id,
      businessId: activeId,
      role,
      assignedStoreIds: primaryStore ? [primaryStore._id] : [],
      status: 'active',
    });

    await AuditLog.create({
      businessId: activeId,
      userId: req.user._id,
      userName: req.user.name,
      action: 'STAFF_INVITED',
      entityType: 'User',
      entityId: user._id.toString(),
      details: { invitedEmail: email, role },
    });

    res.status(201).json({
      success: true,
      data: {
        membership,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
        },
      },
      message: 'Staff member added successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Backward-compatibility aliases
export const onboardTenant = onboardBusiness;
export const getCurrentTenant = getCurrentBusiness;
