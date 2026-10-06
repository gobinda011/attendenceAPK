// const Employee = require('../models/Employee');

// async function listEmployees({ search, department, status } = {}) {
//   const query = {};
//   if (status) query.status = status;
//   if (department) query.department = department;
//   if (search) {
//     query.$or = [
//       { name: new RegExp(search, 'i') },
//       { employeeId: new RegExp(search, 'i') },
//       { email: new RegExp(search, 'i') },
//     ];
//   }
//   return Employee.find(query).sort({ createdAt: -1 });
// }

// async function createEmployee(payload) {
//   return Employee.create(payload);
// }

// async function getEmployeeByEmployeeId(employeeId) {
//   return Employee.findOne({ employeeId });
// }

// async function updateEmployee(employeeId, updates) {
//   return Employee.findOneAndUpdate({ employeeId }, updates, { new: true });
// }

// // Rule 9: deactivation, not destructive deletion - historical attendance
// // records must remain valid and attributable.
// async function deactivateEmployee(employeeId) {
//   return Employee.findOneAndUpdate(
//     { employeeId },
//     { status: 'inactive' },
//     { new: true }
//   );
// }

// async function storeFaceEmbedding(employeeId, vector, label = 'primary') {
//   return Employee.findOneAndUpdate(
//     { employeeId },
//     {
//       faceRegistered: true,
//       $push: { faceEmbeddings: { vector, label } },
//     },
//     { new: true }
//   );
// }

// module.exports = {
//   listEmployees,
//   createEmployee,
//   getEmployeeByEmployeeId,
//   updateEmployee,
//   deactivateEmployee,
//   storeFaceEmbedding,
// };


const bcrypt = require('bcrypt');
const Employee = require('../models/Employee');

async function listEmployees({ search, department, status } = {}) {
  const query = {};

  if (status) query.status = status;

  if (department) query.department = department;

  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { employeeId: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
    ];
  }

  return Employee.find(query).sort({ createdAt: -1 });
}


async function createEmployee(payload) {
  const {
    loginEnabled = true,
    ...employeeData
  } = payload;

  const authentication = {
    loginEnabled: Boolean(loginEnabled),
    mustChangePassword: Boolean(loginEnabled),
    lastLoginAt: null,
    passwordHash: null,
  };

  let temporaryPassword = null;

  if (loginEnabled) {
    temporaryPassword = require('crypto')
      .randomBytes(9)
      .toString('base64url');

    authentication.passwordHash = await bcrypt.hash(
      temporaryPassword,
      12
    );
  }

  const employee = await Employee.create({
    ...employeeData,
    authentication,
  });

  const result = employee.toObject();

  if (result.authentication) {
    delete result.authentication.passwordHash;
  }

  return {
    employee: result,
    temporaryPassword,
  };
}

//new update for reseting the password for the employee if somehow employee lost or forget the password
async function resetEmployeePassword(employeeId) {
  const employee = await Employee.findOne({
    employeeId,
    status: 'active',
  });

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

  const temporaryPassword = require('crypto')
    .randomBytes(9)
    .toString('base64url');

  employee.authentication.passwordHash = await bcrypt.hash(
    temporaryPassword,
    12
  );

  // Force the employee to change this password at next login.
  employee.authentication.mustChangePassword = true;

  // A password reset should not invalidate the employee's 2FA setup.
  // The employee can still use TOTP after changing the password.
  
  await employee.save();

  return {
    success: true,
    temporaryPassword,
  };
}


async function getEmployeeByEmployeeId(employeeId) {
  return Employee.findOne({ employeeId });
}

async function updateEmployee(employeeId, updates) {
  return Employee.findOneAndUpdate(
    { employeeId },
    updates,
    { new: true }
  );
}

// Rule 9: deactivation, not destructive deletion.
// Historical attendance records remain valid and attributable.
async function deactivateEmployee(employeeId) {
  return Employee.findOneAndUpdate(
    { employeeId },
    { status: 'inactive' },
    { new: true }
  );
}

async function enableEmployeeLogin(employeeId) {
  const employee = await Employee.findOne({
    employeeId,
    status: 'active',
  });

  if (!employee) {
    return {
      success: false,
      message: 'Employee not found',
    };
  }

  if (employee.authentication?.loginEnabled) {
    return {
      success: false,
      message: 'Employee login is already enabled',
    };
  }

  const temporaryPassword = require('crypto')
    .randomBytes(9)
    .toString('base64url');

  employee.authentication = {
    ...(employee.authentication?.toObject?.() || employee.authentication || {}),
    passwordHash: await bcrypt.hash(temporaryPassword, 12),
    loginEnabled: true,
    mustChangePassword: true,
    lastLoginAt: null,
  };

  await employee.save();

  return {
    success: true,
    temporaryPassword,
  };
}


async function disableEmployeeLogin(employeeId) {
  const employee = await Employee.findOne({
    employeeId,
    status: 'active',
  });

  if (!employee) {
    return {
      success: false,
      message: 'Employee not found',
    };
  }

  if (!employee.authentication?.loginEnabled) {
    return {
      success: false,
      message: 'Employee login is already disabled',
    };
  }

  employee.authentication.loginEnabled = false;

  await employee.save();

  return {
    success: true,
  };
}


async function storeFaceEmbedding(
  employeeId,
  vector,
  label = 'primary'
) {
  return Employee.findOneAndUpdate(
    { employeeId },
    {
      faceRegistered: true,
      $push: {
        faceEmbeddings: {
          vector,
          label,
        },
      },
    },
    { new: true }
  );
}

module.exports = {
  listEmployees,
  createEmployee,
  resetEmployeePassword,
  enableEmployeeLogin,
  disableEmployeeLogin,
  getEmployeeByEmployeeId,
  updateEmployee,
  deactivateEmployee,
  storeFaceEmbedding,
};