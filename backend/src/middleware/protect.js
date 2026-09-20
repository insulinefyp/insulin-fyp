const User = require('../models/user.model');
const AppError = require('../utils/AppError');
const { verifyToken } = require('../utils/token');

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';

    if (!header.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401, 'NO_TOKEN');
    }

    const payload = verifyToken(header.slice(7).trim());

    // Loading the user rather than trusting the token alone means a deleted
    // account stops working immediately instead of at token expiry.
    const user = await User.findById(payload.sub);

    if (!user) {
      throw new AppError('Account no longer exists', 401, 'USER_NOT_FOUND');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(...roles) {
  return function checkRole(req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Not permitted', 403, 'FORBIDDEN'));
    }
    next();
  };
}

module.exports = { protect, requireRole };
