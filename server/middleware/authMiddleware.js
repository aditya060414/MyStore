import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getSession, refreshSession, updateSession } from '../config/redis.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1]?.replace(/^["']|["']$/g, '').trim();
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'mystore_super_secret_jwt_key_2026_saas_production_secure'
      );

      // Verify active session in Upstash Redis
      const session = await getSession(token);

      if (session && session._redisError) {
        // Fallback: If Redis is temporarily unreachable, log warning and allow verified JWT + DB lookup
        console.warn('[Auth Middleware] Upstash Redis check failed, falling back to database verification');
      } else if (!session) {
        // Session was logged out or expired in Redis
        return res.status(401).json({
          success: false,
          message: 'Session has expired or was terminated. Please sign in again.',
        });
      } else {
        // Valid Redis session found
        req.session = session;
        // Asynchronously slide expiration window
        refreshSession(token).catch((err) =>
          console.warn('[Redis] Failed to refresh session:', err.message)
        );
      }

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'User account not found' });
      }

      const isAdmin = ['super_admin', 'admin'].includes(user.role);
      req.user = user;
      req.user.isAdmin = isAdmin;
      req.token = token;

      // Always synchronize req.session with the latest database state
      if (req.session && !req.session._redisError) {
        const userEmail = user.email || '';
        const userPhone = user.phone || '';
        const needsSync =
          req.session.role !== user.role ||
          req.session.isAdmin !== isAdmin ||
          (req.session.email || '') !== userEmail ||
          (req.session.phone || '') !== userPhone ||
          req.session.name !== user.name;

        req.session.role = user.role;
        req.session.isAdmin = isAdmin;
        req.session.email = userEmail;
        req.session.phone = userPhone;
        req.session.name = user.name;

        if (needsSync) {
          updateSession(token, {
            role: user.role,
            isAdmin,
            email: userEmail,
            phone: userPhone,
            name: user.name,
          }).catch((err) =>
            console.warn('[Redis] Failed to sync session with DB:', err.message)
          );
        }
      }

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
  if (
    req.user &&
    (['super_admin', 'admin'].includes(req.user.role) ||
      (process.env.ADMIN_SECRET_KEY && req.headers['x-admin-key'] === process.env.ADMIN_SECRET_KEY))
  ) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Requires Platform Administrator privileges',
    });
  }
};

// Re-export RBAC middleware for compatibility
export { requireRoles } from './rbacMiddleware.js';

