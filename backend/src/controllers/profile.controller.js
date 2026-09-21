const profileService = require('../services/profile.service');

async function getProfile(req, res, next) {
  try {
    const data = await profileService.getProfile(req.user);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const data = await profileService.updateProfile(req.user, req.body);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getChangeHistory(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const data = await profileService.getChangeHistory(req.user, limit);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, getChangeHistory };
