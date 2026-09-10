const jwt = require('jsonwebtoken');
const env = require('../config/environment');
const { failure } = require('../utils/response');
const Admin = require('../models/Admin');

// FR-001: employees never authenticate; only admin-facing routes use this.
async function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return failure(res, 401, 'Authentication token missing');
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const admin = await Admin.findById(payload.id);

    if (!admin || admin.status !== 'active') {
      return failure(res, 401, 'Account is not authorized');
    }

    req.admin = { id: admin._id.toString(), role: admin.role, name: admin.name };
    next();
  } catch (err) {
    return failure(res, 401, 'Invalid or expired token');
  }
}

module.exports = authMiddleware;
