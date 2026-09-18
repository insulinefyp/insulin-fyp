const healthService = require('../services/health.service');

function getHealth(req, res, next) {
  try {
    const data = healthService.getHealthStatus();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getHealth };
