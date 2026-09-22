const glucoseService = require('../services/glucose.service');

async function getCurrent(req, res, next) {
  try {
    const data = await glucoseService.getCurrent(req.user);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getSimulator(req, res, next) {
  try {
    const data = await glucoseService.getSimulatorState(req.user);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function setSimulator(req, res, next) {
  try {
    const data = await glucoseService.setSimulatorControls(req.user, req.body);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCurrent, getSimulator, setSimulator };
