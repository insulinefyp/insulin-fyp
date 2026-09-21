const treatmentService = require('../services/treatment.service');

async function getCurrent(req, res, next) {
  try {
    const data = await treatmentService.getCurrent(req.user);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const data = await treatmentService.createVersion(req.user, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getHistory(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const data = await treatmentService.getHistory(req.user, limit);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

function getLimits(req, res) {
  res.status(200).json({ success: true, data: treatmentService.getLimits() });
}

module.exports = { getCurrent, create, getHistory, getLimits };
