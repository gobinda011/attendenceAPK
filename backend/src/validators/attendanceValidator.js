const Joi = require('joi');

const updateAttendanceSchema = Joi.object({
  checkIn: Joi.object({
    timestamp: Joi.date(),
  }),
  checkOut: Joi.object({
    timestamp: Joi.date(),
  }),
  status: Joi.string().valid('present', 'checked_out', 'absent'),
});

module.exports = { updateAttendanceSchema };
