const { failure } = require('../utils/response');

// Role-based authorization (Section 7, Security).
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return failure(res, 403, 'Insufficient permissions for this operation');
    }
    next();
  };
}

module.exports = requireRole;
