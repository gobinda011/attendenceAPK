const logger = require('../utils/logger');
const { failure } = require('../utils/response');

// Catches: unhandled errors from controllers/services, Multer errors,
// and anything thrown asynchronously that reaches Express's error handler.
function errorMiddleware(err, req, res, next) {
  logger.error(err.stack || err.message);

  if (err.name === 'ValidationError') {
    return failure(res, 400, err.message);
  }
  if (err.code === 11000) {
    // Duplicate key - most commonly the (employeeId, date) unique index,
    // i.e. a race-condition duplicate check-in that slipped past the
    // application-level check.
    return failure(res, 409, 'Duplicate record - this action was already recorded');
  }

  return failure(res, err.statusCode || 500, err.message || 'Internal server error');
}

module.exports = errorMiddleware;
