import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Membership from '../models/Membership.js';
import Tenant from '../models/Tenant.js';
import AuditLog from '../models/AuditLog.js';

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'mystore_super_secret_jwt_key_2026_saas_production_secure',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
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

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        token,
        tenants: [],
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

    // Fetch user memberships and tenants
    const memberships = await Membership.find({ userId: user._id, status: 'active' }).populate({
      path: 'tenantId',
      populate: { path: 'planId' },
    });

    const tenants = memberships.map((m) => ({
      membershipId: m._id,
      role: m.role,
      tenant: m.tenantId,
    }));

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        token,
        tenants,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current logged in user & active tenant
// @route   GET /api/v1/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const memberships = await Membership.find({ userId: user._id, status: 'active' }).populate({
      path: 'tenantId',
      populate: { path: 'planId' },
    });

    const tenants = memberships.map((m) => ({
      membershipId: m._id,
      role: m.role,
      tenant: m.tenantId,
    }));

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        tenants,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
