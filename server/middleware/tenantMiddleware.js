import Tenant from '../models/Tenant.js';
import Membership from '../models/Membership.js';

export const resolveTenant = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    let tenantId = req.headers['x-tenant-id'] || req.query.tenantId;

    // Platform admin bypass or inspection
    if (req.user.role === 'platform_admin') {
      if (tenantId) {
        const tenant = await Tenant.findById(tenantId);
        if (tenant) {
          req.tenantId = tenant._id;
          req.tenant = tenant;
          req.membership = { role: 'owner' };
          return next();
        }
      }
    }

    // If tenantId was not provided in header, look for user's primary/active membership
    let membership;
    if (tenantId) {
      membership = await Membership.findOne({
        userId: req.user._id,
        tenantId,
        status: 'active',
      });
    } else {
      membership = await Membership.findOne({
        userId: req.user._id,
        status: 'active',
      }).sort({ createdAt: 1 });
    }

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'No active business membership found for this user',
      });
    }

    const tenant = await Tenant.findById(membership.tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Business tenant not found',
      });
    }

    // Attach verified tenant scope
    req.tenantId = tenant._id;
    req.tenant = tenant;
    req.membership = membership;

    next();
  } catch (error) {
    console.error('[Tenant Middleware Error]:', error.message);
    res.status(500).json({ success: false, message: 'Tenant resolution error' });
  }
};
