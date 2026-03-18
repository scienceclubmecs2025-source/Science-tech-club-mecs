// Middleware to check committee permissions
const checkCommitteeRole = (...allowedRoles) => {
  return (req, res, next) => {
    const user = req.user;

    // Admin has all permissions
    if (user.role === 'admin') {
      return next();
    }

    // Chair has all committee permissions
    if (user.committee_role === 'chair') {
      return next();
    }

    // Check if user has required role
    if (!user.is_committee) {
      return res.status(403).json({ message: 'Committee membership required' });
    }

    if (!allowedRoles.includes(user.committee_role)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: allowedRoles,
        current: user.committee_role
      });
    }

    next();
  };
};

module.exports = { checkCommitteeRole };
