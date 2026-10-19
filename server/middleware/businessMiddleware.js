import Business from '../models/Business.js';
import Membership from '../models/Membership.js';

export const resolveBusiness = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    let businessId =
      req.headers['x-business-id'] ||
      req.headers['x-tenant-id'] ||
      req.query.businessId ||
      req.query.tenantId;

    // Platform admin bypass or inspection
    if (req.user && ['super_admin', 'admin'].includes(req.user.role)) {
      if (businessId) {
        const business = await Business.findById(businessId);
        if (business) {
          req.businessId = business._id;
          req.business = business;
          // Aliases for compatibility
          req.tenantId = business._id;
          req.tenant = business;
          req.membership = { role: 'owner' };
          return next();
        }
      }
    }

    // If businessId was not provided in header, look for user's primary/active membership
    let membership;
    if (businessId) {
      membership = await Membership.findOne({
        userId: req.user._id,
        $or: [{ businessId }, { tenantId: businessId }],
        status: 'active',
      });
    } else {
      membership = await Membership.findOne({
        userId: req.user._id,
        status: 'active',
      }).sort({ updatedAt: -1, createdAt: -1 });
    }

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'No active business membership found for this user',
      });
    }

    const business = await Business.findById(membership.businessId || membership.tenantId);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }

    // Attach verified business scope and backward compatibility aliases
    req.businessId = business._id;
    req.business = business;
    req.tenantId = business._id;
    req.tenant = business;
    req.membership = membership;

    next();
  } catch (error) {
    console.error('[Business Middleware Error]:', error.message);
    res.status(500).json({ success: false, message: 'Business resolution error' });
  }
};

// Backward-compatibility alias
export const resolveTenant = resolveBusiness;
