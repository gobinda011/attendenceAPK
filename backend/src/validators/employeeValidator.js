const Joi = require('joi');

const createEmployeeSchema = Joi.object({
  employeeId: Joi.string().trim().required(),
  name: Joi.string().trim().required(),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().allow('', null),
  department: Joi.string().allow('', null),
  designation: Joi.string().allow('', null),
  joiningDate: Joi.date().allow(null),
});

const updateEmployeeSchema = Joi.object({
  name: Joi.string().trim(),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().allow('', null),
  department: Joi.string().allow('', null),
  designation: Joi.string().allow('', null),
  joiningDate: Joi.date().allow(null),
  status: Joi.string().valid('active', 'inactive'),
});

module.exports = { createEmployeeSchema, updateEmployeeSchema };
