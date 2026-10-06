const { failure } = require('../utils/response');

function employeeTwoFactorMiddleware(req, res, next) {
  if (!req.employee) {
    return failure(res, 401, 'Employee authentication required');
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ')
    ? header.slice(7)
    : null;

  if (!token) {
    return failure(res, 401, 'Authentication token missing');
  }

  try {
    const jwt = require('jsonwebtoken');
    const env = require('../config/environment');

    const payload = jwt.verify(token, env.jwtSecret);

    if (payload.type !== 'employee') {
      return failure(res, 401, 'Invalid employee authentication token');
    }

    if (payload.twoFactorVerified !== true) {
      return failure(
        res,
        403,
        'Two-factor authentication is required to access this information'
      );
    }

    next();
  } catch (err) {
    return failure(res, 401, 'Invalid or expired employee token');
  }
}

module.exports = employeeTwoFactorMiddleware;