const deviceService = require('../services/device.service');

function getStatus(req, res) {
  res.status(200).json({ success: true, data: deviceService.getStatus() });
}

module.exports = { getStatus };
