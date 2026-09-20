const jwt = require('jsonwebtoken');
const config = require('../config');
const AppError = require('./AppError');

// A JWT is signed, not encrypted: anything in here is readable by whoever
// holds the token. Only what is needed to authorise goes in, and the
// database stays the source of truth for everything else.
function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Session expired, sign in again', 401, 'TOKEN_EXPIRED');
    }
    throw new AppError('Invalid authentication token', 401, 'TOKEN_INVALID');
  }
}

module.exports = { signToken, verifyToken };
