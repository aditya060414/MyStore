export const requireRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    // Platform admin has all privileges
    if (req.user && req.user.role === 'platform_admin') {
      return next();
    }

    if (!req.membership || !allowedRoles.includes(req.membership.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Action requires one of [${allowedRoles.join(', ')}] role`,
      });
    }

    next();
  };
};
