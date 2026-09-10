const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const env = require('../config/environment');
const { success, failure } = require('../utils/response');

// FR-001: Admin Authentication.
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email }).select('+passwordHash');

    if (!admin || admin.status !== 'active') {
      return failure(res, 401, 'Invalid credentials');
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      return failure(res, 401, 'Invalid credentials');
    }

    const token = jwt.sign({ id: admin._id, role: admin.role }, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn,
    });

    return success(res, 200, 'Login successful', {
      token,
      admin: { id: admin._id, name: admin.name, role: admin.role },
    });
  } catch (err) {
    next(err);
  }
}

// Convenience endpoint used once during setup to create the first admin.
// In production this should be disabled or protected after initial setup.
async function registerFirstAdmin(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const existing = await Admin.countDocuments();
    if (existing > 0) {
      return failure(res, 403, 'An admin already exists. Use the dashboard to add more admins.');
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await Admin.create({ name, email, passwordHash, role: 'super_admin' });
    return success(res, 201, 'Initial admin created', { admin: { id: admin._id, email: admin.email } });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, registerFirstAdmin };
