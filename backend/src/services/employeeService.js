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
  return Employee.create(payload);
}

async function getEmployeeByEmployeeId(employeeId) {
  return Employee.findOne({ employeeId });
}

async function updateEmployee(employeeId, updates) {
  return Employee.findOneAndUpdate({ employeeId }, updates, { new: true });
}

// Rule 9: deactivation, not destructive deletion - historical attendance
// records must remain valid and attributable.
async function deactivateEmployee(employeeId) {
  return Employee.findOneAndUpdate(
    { employeeId },
    { status: 'inactive' },
    { new: true }
  );
}

async function storeFaceEmbedding(employeeId, vector, label = 'primary') {
  return Employee.findOneAndUpdate(
    { employeeId },
    {
      faceRegistered: true,
      $push: { faceEmbeddings: { vector, label } },
    },
    { new: true }
  );
}

module.exports = {
  listEmployees,
  createEmployee,
  getEmployeeByEmployeeId,
  updateEmployee,
  deactivateEmployee,
  storeFaceEmbedding,
};
