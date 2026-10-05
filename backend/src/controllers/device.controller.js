const deviceService = require('../services/device.service');

function getStatus(req, res) {
  res.status(200).json({ success: true, data: deviceService.getStatus() });
}

async function getTemperatureHistory(req, res, next) {
  try {
    const hours = Math.min(parseInt(req.query.hours, 10) || 6, 168);
    const includeSimulated = req.query.includeSimulated === 'true';
    const data = await deviceService.getTemperatureHistory({
      hours,
      includeSimulated,
    });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getTemperatureExcursions(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const includeSimulated = req.query.includeSimulated === 'true';
    const data = await deviceService.getTemperatureExcursions({
      limit,
      includeSimulated,
    });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStatus, getTemperatureHistory, getTemperatureExcursions };
