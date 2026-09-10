// Consistent API response envelope so the frontend can rely on one shape.
function success(res, statusCode, message, data = {}) {
  return res.status(statusCode).json({ success: true, message, ...data });
}

function failure(res, statusCode, message, errors = null) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

module.exports = { success, failure };
