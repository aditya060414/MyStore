import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Membership from '../models/Membership.js';
import Business from '../models/Business.js';
import Store from '../models/Store.js';
import Plan from '../models/Plan.js';
import Subscription from '../models/Subscription.js';
import AuditLog from '../models/AuditLog.js';
import { createSession, destroySession, destroyAllUserSessions } from '../config/redis.js';

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'mystore_super_secret_jwt_key_2026_saas_production_secure',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Helper: Get or initialize businesses and primary store for an owner
const getUserBusinessesWithStores = async (user) => {
  let memberships = await Membership.find({ userId: user._id, status: 'active' }).populate({
    path: 'businessId',
    populate: { path: 'planId' },
  });

  // If user has no active membership in context, check if they already have an existing business in DB
  if (memberships.length === 0 && !['super_admin', 'admin'].includes(user.role)) {
    let existingBusiness = await Business.findOne({ ownerId: user._id });

    if (existingBusiness) {
      // Re-use existing business and ensure store, subscription, and membership are in sync
      let existingStore = await Store.findOne({ businessId: existingBusiness._id, isPrimary: true });
      if (!existingStore) {
        const storeHandle = existingBusiness.handle || existingBusiness.slug || 'my-store';
        existingStore = await Store.create({
          businessId: existingBusiness._id,
          name: existingBusiness.name,
          handle: storeHandle,
          slug: storeHandle,
          phone: user.phone || '9876543210',
          email: user.email,
          isPrimary: true,
        });
      } else if (!existingStore.handle && existingStore.slug) {
        existingStore.handle = existingStore.slug;
        await existingStore.save();
      }

      let existingSub = await Subscription.findOne({ businessId: existingBusiness._id });
      if (!existingSub) {
        let plan = await Plan.findOne({ $or: [{ slug: 'free' }, { handle: 'free' }] }) || await Plan.findOne({ priceMonthly: 0 });
        existingSub = await Subscription.create({
          businessId: existingBusiness._id,
          planId: plan ? plan._id : existingBusiness.planId,
          status: 'active',
          billingCycle: 'monthly',
          amount: 0,
          currency: 'INR',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        existingBusiness.subscriptionId = existingSub._id;
        await existingBusiness.save();
      }

      let existingMembership = await Membership.findOne({ userId: user._id, businessId: existingBusiness._id });
      if (existingMembership) {
        existingMembership.status = 'active';
        existingMembership.assignedStoreIds = [existingStore._id];
        await existingMembership.save();
      } else {
        existingMembership = await Membership.create({
          userId: user._id,
          businessId: existingBusiness._id,
          role: 'owner',
          assignedStoreIds: [existingStore._id],
          status: 'active',
        });
      }

      memberships = [
        await Membership.findById(existingMembership._id).populate({
          path: 'businessId',
          populate: { path: 'planId' },
        }),
      ];
    } else {
      // Only when user has no business whatsoever in database, initialize their first business
      const ownerStoreName = user.name ? `${user.name} Store` : 'BisonMooves Store';
      let defaultHandle = ownerStoreName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      const existingRecord = await Business.findOne({ $or: [{ handle: defaultHandle }, { slug: defaultHandle }] });
      if (existingRecord) {
        defaultHandle = `${defaultHandle}-${Date.now().toString().slice(-4)}`;
      }

      // Default plan is free
      let plan =
        (await Plan.findOne({ $or: [{ slug: 'free' }, { handle: 'free' }] })) ||
        (await Plan.findOne({ priceMonthly: 0 })) ||
        (await Plan.findOne({ isDefault: true }));
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

      const newBusiness = await Business.create({
        name: ownerStoreName,
        handle: defaultHandle,
        slug: defaultHandle,
        ownerId: user._id,
        status: 'active',
        planId: plan ? plan._id : null,
        currency: 'INR',
        currencySymbol: '₹',
        contactPhone: user.phone || '',
        contactEmail: user.email,
        settings: {
          taxRate: 0,
          taxName: 'GST',
          invoicePrefix: 'INV-',
          receiptHeader: ownerStoreName,
          receiptFooter: 'Thank you for shopping with us! Visit again',
        },
      });

      const newStore = await Store.create({
        businessId: newBusiness._id,
        name: ownerStoreName,
        handle: defaultHandle,
        slug: defaultHandle,
        phone: user.phone || '9876543210',
        email: user.email,
        isPrimary: true,
      });

      const subscription = await Subscription.create({
        businessId: newBusiness._id,
        planId: plan ? plan._id : null,
        status: 'active',
        billingCycle: 'monthly',
        amount: plan ? (plan.priceMonthly || 0) : 0,
        currency: 'INR',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      newBusiness.subscriptionId = subscription._id;
      await newBusiness.save();

      const newMembership = await Membership.create({
        userId: user._id,
        businessId: newBusiness._id,
        role: 'owner',
        assignedStoreIds: [newStore._id],
        status: 'active',
      });

      memberships = [
        await Membership.findById(newMembership._id).populate({
          path: 'businessId',
          populate: { path: 'planId' },
        }),
      ];
    }
  }

  const businesses = await Promise.all(
    memberships.map(async (m) => {
      const b = m.businessId;
      const primaryStore = b ? await Store.findOne({ businessId: b._id, isPrimary: true }) : null;
      return {
        membershipId: m._id,
        role: m.role,
        business: b,
        store: primaryStore,
      };
    })
  );

  // Deduplicate: ensure each business is strictly listed once, filtering out nulls and duplicate names
  const seenBusinessIds = new Set();
  const seenNames = new Set();
  const uniqueBusinesses = [];

  for (const item of businesses) {
    if (!item.business || !item.business._id) continue;
    const bIdStr = item.business._id.toString();
    const bNameNormalized = (item.business.name || '').trim().toLowerCase();

    if (seenBusinessIds.has(bIdStr)) continue;
    if (seenNames.has(bNameNormalized)) continue;

    seenBusinessIds.add(bIdStr);
    seenNames.add(bNameNormalized);
    uniqueBusinesses.push(item);
  }

  return uniqueBusinesses;
};

// @desc    Register a new user
// @route   POST /api/v1/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    // Default to 'merchant' when creating account from signup or dashboard
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      phone,
      role: 'merchant',
    });

    const token = generateToken(user._id);

    // Persist session to Upstash Redis
    await createSession(token, {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      isAdmin: false,
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isAdmin: false,
        avatar: user.avatar,
        token,
        businesses: [],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user & get token
// @route   POST /api/v1/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Verify admin role strictly from database (super_admin, admin)
    const isAdmin = ['super_admin', 'admin'].includes(user.role);

    // Fetch user memberships, businesses and primary stores
    const businesses = await getUserBusinessesWithStores(user);

    const token = generateToken(user._id);

    // Persist session to Upstash Redis
    await createSession(token, {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      isAdmin,
    });

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isAdmin,
        avatar: user.avatar,
        token,
        businesses,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current logged in user & active business
// @route   GET /api/v1/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    // Verify admin role strictly from backend database role (super_admin, admin)
    const isAdmin = ['super_admin', 'admin'].includes(user.role);
    const businesses = await getUserBusinessesWithStores(user);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isAdmin,
        avatar: user.avatar,
        businesses,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout user & invalidate session in Upstash Redis (Idempotent)
// @route   POST /api/v1/auth/logout
export const logout = async (req, res) => {
  try {
    let token = req.token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      token = token.replace(/^["']|["']$/g, '').trim();
    }

    if (token) {
      let userId = req.user?._id?.toString();
      if (!userId) {
        try {
          const decoded = jwt.decode(token);
          userId = decoded?.id;
        } catch (_) {}
      }
      await destroySession(token, userId);
    }

    // Explicitly wipe cookies on logout
    res.clearCookie('token', { path: '/' });
    res.clearCookie('mystore_token', { path: '/' });
    res.clearCookie('jwt', { path: '/' });
    res.clearCookie('session', { path: '/' });

    res.json({
      success: true,
      message: 'Logged out successfully. Token and Redis session destroyed.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout all devices & invalidate all Redis sessions (Idempotent)
// @route   POST /api/v1/auth/logout-all
export const logoutAll = async (req, res) => {
  try {
    let token = req.token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      token = token.replace(/^["']|["']$/g, '').trim();
    }

    let userId = req.user?._id?.toString();
    if (!userId && token) {
      try {
        const decoded = jwt.decode(token);
        userId = decoded?.id;
      } catch (_) {}
    }

    if (userId) {
      await destroyAllUserSessions(userId);
    }

    res.clearCookie('token', { path: '/' });
    res.clearCookie('mystore_token', { path: '/' });
    res.clearCookie('jwt', { path: '/' });
    res.clearCookie('session', { path: '/' });

    res.json({
      success: true,
      message: 'All active sessions across all devices revoked from Redis.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get session details from Redis
// @route   GET /api/v1/auth/session
export const getSessionInfo = async (req, res) => {
  try {
    res.json({
      success: true,
      session: req.session || null,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

