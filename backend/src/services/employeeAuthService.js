const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Employee = require('../models/Employee');
const env = require('../config/environment');

async function authenticateEmployee(employeeId, password) {
  const employee = await Employee.findOne({
    employeeId: employeeId.trim(),
  }).select('+authentication.passwordHash');

  if (!employee || employee.status !== 'active') {
    return {
      success: false,
      message: 'Invalid credentials',
    };
  }

  if (!employee.authentication?.loginEnabled) {
    return {
      success: false,
      message: 'Employee login is not enabled',
    };
  }

  if (!employee.authentication?.passwordHash) {
    return {
      success: false,
      message: 'Employee account credentials are not configured',
    };
  }

  const validPassword = await bcrypt.compare(
    password,
    employee.authentication.passwordHash
  );

  if (!validPassword) {
    return {
      success: false,
      message: 'Invalid credentials',
    };
  }

  return {
    success: true,
    employee,
  };
}

function createEmployeeToken(employee, twoFactorVerified = false) {
  return jwt.sign(
    {
      id: employee._id.toString(),
      employeeId: employee.employeeId,
      type: 'employee',
      twoFactorVerified: Boolean(twoFactorVerified),
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

async function changeEmployeePassword(employeeId, currentPassword, newPassword) {
  const employee = await Employee.findOne({
    employeeId,
    status: 'active',
  }).select('+authentication.passwordHash');

  if (!employee) {
    return {
      success: false,
      message: 'Employee not found',
    };
  }

  if (!employee.authentication?.loginEnabled) {
    return {
      success: false,
      message: 'Employee login is not enabled',
    };
  }

  const validCurrentPassword = await bcrypt.compare(
    currentPassword,
    employee.authentication.passwordHash
  );

  if (!validCurrentPassword) {
    return {
      success: false,
      message: 'Current password is incorrect',
    };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  employee.authentication.passwordHash = passwordHash;
  employee.authentication.mustChangePassword = false;

  await employee.save();

  return {
    success: true,
  };
}

module.exports = {
  authenticateEmployee,
  createEmployeeToken,
  changeEmployeePassword,
};