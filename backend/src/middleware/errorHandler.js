const config = require('../config');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || 500;

  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);

  res.status(status).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
      code: err.code || 'INTERNAL_ERROR',
      ...(config.env === 'development' && { stack: err.stack }),
    },
  });
}

module.exports = errorHandler;
