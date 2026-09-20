const config = require('../config');

function translate(err) {
  // Duplicate key on a unique index
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return {
      status: 409,
      code: field === 'email' ? 'EMAIL_TAKEN' : 'DUPLICATE',
      message:
        field === 'email'
          ? 'An account with that email already exists'
          : `Duplicate value for ${field}`,
    };
  }

  // Schema-level validation that got past zod
  if (err.name === 'ValidationError') {
    const first = Object.values(err.errors)[0];
    return {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: first?.message || 'Validation failed',
    };
  }

  if (err.name === 'CastError') {
    return { status: 400, code: 'INVALID_ID', message: 'Invalid identifier' };
  }

  return {
    status: err.status || 500,
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'Internal server error',
  };
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const { status, code, message } = translate(err);

  console.error(`[ERROR] ${req.method} ${req.originalUrl}: ${code} - ${err.message}`);

  res.status(status).json({
    success: false,
    error: {
      message,
      code,
      ...(config.env === 'development' && { stack: err.stack }),
    },
  });
}

module.exports = errorHandler;
