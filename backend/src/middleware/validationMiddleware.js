const { failure } = require('../utils/response');

// Generic Joi-schema validator used by every route that accepts a body.
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const errors = error.details.map((d) => d.message);
      return failure(res, 400, 'Validation failed', errors);
    }
    req.body = value;
    next();
  };
}

module.exports = validate;
