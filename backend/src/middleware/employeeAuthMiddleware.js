const jwt = require('jsonwebtoken');

const env = require('../config/environment');
const { failure } = require('../utils/response');
const Employee = require('../models/Employee');

async function employeeAuthMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ')
    ? header.slice(7)
    : null;

  if (!token) {
    return failure(res, 401, 'Authentication token missing');
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);

    // Employee tokens must explicitly identify themselves.
    if (payload.type !== 'employee') {
      return failure(res, 401, 'Invalid employee authentication token');
    }

    const employee = await Employee.findOne({
      _id: payload.id,
      employeeId: payload.employeeId,
      status: 'active',
      'authentication.loginEnabled': true,
    });

    if (!employee) {
      return failure(res, 401, 'Employee account is not authorized');
    }

    req.employee = {
      id: employee._id.toString(),
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      department: employee.department,
      designation: employee.designation,
    };

    next();
  } catch (err) {
    return failure(res, 401, 'Invalid or expired employee token');
  }
}

module.exports = employeeAuthMiddleware;