import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'mystore_super_secret_jwt_key_2026_saas_production_secure'
      );

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'User account not found' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('[Auth Error] Token verification failed:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
    }
  } else {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

export const requirePlatformAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'platform_admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Requires Platform Admin privileges',
    });
  }
};
