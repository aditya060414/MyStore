import Tenant from '../models/Tenant.js';
import Store from '../models/Store.js';
import Membership from '../models/Membership.js';
import Plan from '../models/Plan.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import AuditLog from '../models/AuditLog.js';

// Starter products to seed upon onboarding so the merchant immediately has a working store
const STARTER_PRODUCTS = [
  {
    name: 'Maggi Noodles',
    brand: 'Nestle',
    category: 'Snacks',
    sellingPrice: 12,
    costPrice: 9,
    stock: 50,
    barcode: '8901058852372',
    image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Coca Cola',
    brand: 'Coca Cola',
    category: 'Beverages',
    sellingPrice: 40,
    costPrice: 30,
    stock: 30,
    barcode: '5449000000996',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Lays Classic',
    brand: 'Lays',
    category: 'Snacks',
    sellingPrice: 20,
    costPrice: 15,
    stock: 25,
    barcode: '8901491101837',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Amul Milk',
    brand: 'Amul',
    category: 'Dairy',
    sellingPrice: 28,
    costPrice: 24,
    stock: 12,
    barcode: '8901262010052',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Parle-G',
    brand: 'Parle',
    category: 'Biscuits',
    sellingPrice: 10,
    costPrice: 7,
    stock: 100,
    barcode: '8901719101018',
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=200&q=80',
  },
];

// @desc    Onboarding: create tenant, primary store, subscription and assign owner
// @route   POST /api/v1/tenants/onboard
export const onboardTenant = async (req, res) => {
  try {
    const { businessName, storeName, planSlug = 'pro', phone, currency = 'INR', city = 'Bangalore', address = '123 Market Street' } = req.body;

    if (!businessName || !storeName) {
      return res.status(400).json({ success: false, message: 'Business name and store name are required' });
    }

    // Generate unique slug
    let baseSlug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await Tenant.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Find requested or default plan
    let plan = await Plan.findOne({ slug: planSlug });
    if (!plan) {
      plan = await Plan.findOne({ slug: 'pro' }) || await Plan.findOne();
    }

    // Create Tenant
    const tenant = await Tenant.create({
      name: businessName,
      slug,
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
        receiptFooter: 'Thank you for shopping with us! Visit again | MyStore',
      },
    });

    // Create Primary Store
    let storeSlug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const store = await Store.create({
      tenantId: tenant._id,
      name: storeName,
      slug: storeSlug,
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

    // Create Subscription
    const subscription = await Subscription.create({
      tenantId: tenant._id,
      planId: plan ? plan._id : null,
      status: 'active',
      billingCycle: 'monthly',
      amount: plan ? plan.priceMonthly : 999,
      currency,
    });

    tenant.subscriptionId = subscription._id;
    await tenant.save();

    // Create Membership as Owner
    const membership = await Membership.create({
      userId: req.user._id,
      tenantId: tenant._id,
      role: 'owner',
      assignedStoreIds: [store._id],
      status: 'active',
    });

    // Seed starter products for immediate playability
    const productsToCreate = STARTER_PRODUCTS.map((p) => ({
      ...p,
      tenantId: tenant._id,
      storeId: store._id,
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    }));
    await Product.insertMany(productsToCreate);

    // Audit log
    await AuditLog.create({
      tenantId: tenant._id,
      userId: req.user._id,
      userName: req.user.name,
      action: 'TENANT_ONBOARDED',
      entityType: 'Tenant',
      entityId: tenant._id.toString(),
      details: { businessName, storeName, plan: plan?.name },
    });

    res.status(201).json({
      success: true,
      data: {
        tenant,
        store,
        membership,
        subscription,
      },
    });
  } catch (error) {
    console.error('[Onboarding Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current tenant details and active store
// @route   GET /api/v1/tenants/current
export const getCurrentTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenantId).populate('planId').populate('subscriptionId');
    const stores = await Store.find({ tenantId: req.tenantId, isActive: true });
    const memberships = await Membership.find({ tenantId: req.tenantId, status: 'active' }).populate('userId', 'name email phone avatar');

    res.json({
      success: true,
      data: {
        tenant,
        stores,
        staff: memberships,
        userRole: req.membership.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update tenant settings (invoice, branding, tax)
// @route   PUT /api/v1/tenants/settings
export const updateSettings = async (req, res) => {
  try {
    const { settings, contactPhone, contactEmail } = req.body;
    const tenant = await Tenant.findById(req.tenantId);

    if (settings) {
      tenant.settings = { ...tenant.settings, ...settings };
    }
    if (contactPhone) tenant.contactPhone = contactPhone;
    if (contactEmail) tenant.contactEmail = contactEmail;

    await tenant.save();

    await AuditLog.create({
      tenantId: req.tenantId,
      userId: req.user._id,
      userName: req.user.name,
      action: 'SETTINGS_UPDATED',
      entityType: 'TenantSettings',
      entityId: tenant._id.toString(),
      details: settings,
    });

    res.json({ success: true, data: tenant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all staff for tenant
// @route   GET /api/v1/tenants/staff
export const getStaff = async (req, res) => {
  try {
    const staff = await Membership.find({ tenantId: req.tenantId }).populate('userId', 'name email phone avatar');
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Invite/add staff member
// @route   POST /api/v1/tenants/staff
export const addStaff = async (req, res) => {
  try {
    const { name, email, password = 'password123', phone, role = 'cashier' } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    // Check plan limits
    const tenant = await Tenant.findById(req.tenantId).populate('planId');
    const currentStaffCount = await Membership.countDocuments({ tenantId: req.tenantId, status: 'active' });
    const maxStaff = tenant.planId?.limits?.maxStaff || 1;

    if (currentStaffCount >= maxStaff) {
      return res.status(403).json({
        success: false,
        message: `Plan staff limit reached (${maxStaff}). Please upgrade your subscription to add more team members.`,
      });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        phone,
      });
    }

    const existingMembership = await Membership.findOne({ userId: user._id, tenantId: req.tenantId });
    if (existingMembership) {
      return res.status(400).json({ success: false, message: 'User is already a member of this tenant' });
    }

    const primaryStore = await Store.findOne({ tenantId: req.tenantId, isPrimary: true });

    const membership = await Membership.create({
      userId: user._id,
      tenantId: req.tenantId,
      role,
      assignedStoreIds: primaryStore ? [primaryStore._id] : [],
      status: 'active',
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
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
