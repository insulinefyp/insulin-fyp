const config = require('../config');

function translate(err) {
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return {
      status: 409,
      code: field === 'email' ? 'EMAIL_TAKEN' : 'DUPLICATE',
      message:
        field === 'email'
          ? 'An account with that email already exists'
          : 'A conflicting change was saved at the same time. Try again.',
    };
  }

  if (err.name === 'ValidationError') {
    const fields = {};
    Object.entries(err.errors || {}).forEach(([key, e]) => {
      fields[key] = e.message;
    });
    return {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      fields,
    };
  }

  if (err.name === 'CastError') {
    return { status: 400, code: 'INVALID_ID', message: 'Invalid identifier' };
  }

  return {
    status: err.status || 500,
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'Internal server error',
    fields: err.fields,
  };
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const { status, code, message, fields } = translate(err);

  console.error(`[ERROR] ${req.method} ${req.originalUrl}: ${code} - ${err.message}`);

  res.status(status).json({
    success: false,
    error: {
      message,
      code,
      ...(fields && Object.keys(fields).length > 0 && { fields }),
      ...(config.env === 'development' && { stack: err.stack }),
    },
  });
}

module.exports = errorHandler;
