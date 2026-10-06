const employeeService = require('../services/employeeService');
const faceService = require('../services/faceService');
const { success, failure } = require('../utils/response');
const AuditLog = require('../models/AuditLog');

// FR-002 and Section 28: Employee CRUD.

async function list(req, res, next) {
  try {
    const { search, department, status } = req.query;
    const employees = await employeeService.listEmployees({ search, department, status });
    return success(res, 200, 'Employees retrieved', { employees });
  } catch (err) {
    next(err);
  }
}

// async function create(req, res, next) {
//   try {
//     const employee = await employeeService.createEmployee(req.body);
//     return success(res, 201, 'Employee created', { employee });
//   } catch (err) {
//     next(err);
//   }
// }
async function create(req, res, next) {
  try {
    const { employee, temporaryPassword } =
      await employeeService.createEmployee(req.body);

    return success(res, 201, 'Employee created', {
      employee,
      temporaryPassword,
    });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const result = await employeeService.resetEmployeePassword(
      req.params.id
    );

    if (!result.success) {
      return failure(res, 404, result.message);
    }

    await AuditLog.create({
      adminId: req.admin.id,
      action: 'RESET_EMPLOYEE_PASSWORD',
      entity: 'Employee',
      entityId: req.params.id,
      previousValue: null,
      newValue: {
        passwordReset: true,
        mustChangePassword: true,
      },
    });

    return success(
      res,
      200,
      'Employee password reset successfully',
      {
        temporaryPassword: result.temporaryPassword,
      }
    );
  } catch (err) {
    next(err);
  }
}

async function enableLogin(req, res, next) {
  try {
    const result = await employeeService.enableEmployeeLogin(
      req.params.id
    );

    if (!result.success) {
      return failure(res, 400, result.message);
    }

    await AuditLog.create({
      adminId: req.admin.id,
      action: 'ENABLE_EMPLOYEE_LOGIN',
      entity: 'Employee',
      entityId: req.params.id,
      previousValue: {
        loginEnabled: false,
      },
      newValue: {
        loginEnabled: true,
        mustChangePassword: true,
      },
    });

    return success(
      res,
      200,
      'Employee app login enabled successfully',
      {
        temporaryPassword: result.temporaryPassword,
      }
    );
  } catch (err) {
    next(err);
  }
}


async function disableLogin(req, res, next) {
  try {
    const result = await employeeService.disableEmployeeLogin(
      req.params.id
    );

    if (!result.success) {
      return failure(res, 400, result.message);
    }

    await AuditLog.create({
      adminId: req.admin.id,
      action: 'DISABLE_EMPLOYEE_LOGIN',
      entity: 'Employee',
      entityId: req.params.id,
      previousValue: {
        loginEnabled: true,
      },
      newValue: {
        loginEnabled: false,
      },
    });

    return success(
      res,
      200,
      'Employee App login disabled successfully',
      {
        loginEnabled: false,
      }
    );
  } catch (err) {
    next(err);
  }
}



async function getOne(req, res, next) {
  try {
    const employee = await employeeService.getEmployeeByEmployeeId(req.params.id);
    if (!employee) return failure(res, 404, 'Employee not found');
    return success(res, 200, 'Employee retrieved', { employee });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const before = await employeeService.getEmployeeByEmployeeId(req.params.id);
    const employee = await employeeService.updateEmployee(req.params.id, req.body);
    if (!employee) return failure(res, 404, 'Employee not found');

    await AuditLog.create({
      adminId: req.admin.id,
      action: 'UPDATE_EMPLOYEE',
      entity: 'Employee',
      entityId: req.params.id,
      previousValue: before,
      newValue: employee,
    });

    return success(res, 200, 'Employee updated', { employee });
  } catch (err) {
    next(err);
  }
}

// DELETE maps to deactivation, per Rule 9.
async function remove(req, res, next) {
  try {
    const employee = await employeeService.deactivateEmployee(req.params.id);
    if (!employee) return failure(res, 404, 'Employee not found');

    await AuditLog.create({
      adminId: req.admin.id,
      action: 'DEACTIVATE_EMPLOYEE',
      entity: 'Employee',
      entityId: req.params.id,
      previousValue: null,
      newValue: { status: 'inactive' },
    });

    return success(res, 200, 'Employee deactivated', { employee });
  } catch (err) {
    next(err);
  }
}

// FR-003: Face Registration.
async function registerFace(req, res, next) {
  try {
    if (!req.file) return failure(res, 400, 'Face image is required');

    const employee = await employeeService.getEmployeeByEmployeeId(req.params.id);
    if (!employee) return failure(res, 404, 'Employee not found');

    const result = await faceService.registerFace(req.params.id, req.file.buffer, req.body.label);

    if (!result.success) {
      // e.g. no face detected, poor quality, multiple faces
      return failure(res, 422, result.message || 'Face registration failed quality checks');
    }

    await employeeService.storeFaceEmbedding(req.params.id, result.embedding, req.body.label);

    return success(res, 200, 'Face registered successfully', { employeeId: req.params.id });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, getOne, update, resetPassword,enableLogin, disableLogin, remove, registerFace };
