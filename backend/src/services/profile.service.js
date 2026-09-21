const mongoose = require('mongoose');
const User = require('../models/user.model');
const PatientProfile = require('../models/patientProfile.model');
const ProfileChange = require('../models/profileChange.model');
const AppError = require('../utils/AppError');

// Changes to these propagate into dose calculations, so they are recorded
// with their previous value. Name and contact details are not logged.
const DOSING_RELEVANT = ['weightKg', 'heightCm'];

async function getProfile(user) {
  const profile = await PatientProfile.findOne({ userId: user._id });

  if (!profile) {
    throw new AppError('Patient profile not found', 404, 'PROFILE_NOT_FOUND');
  }

  return { user: user.toSafeObject(), profile: profile.toJSON() };
}

async function updateProfile(user, updates) {
  const profile = await PatientProfile.findOne({ userId: user._id });

  if (!profile) {
    throw new AppError('Patient profile not found', 404, 'PROFILE_NOT_FOUND');
  }

  const { fullName, ...profileUpdates } = updates;

  const logEntries = DOSING_RELEVANT.filter(
    (field) =>
      profileUpdates[field] !== undefined &&
      profileUpdates[field] !== profile[field]
  ).map((field) => ({
    userId: user._id,
    field,
    previousValue: profile[field],
    newValue: profileUpdates[field],
    changedBy: user._id,
  }));

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      if (fullName !== undefined) {
        await User.updateOne(
          { _id: user._id },
          { $set: { fullName } },
          { session }
        );
      }

      if (Object.keys(profileUpdates).length > 0) {
        Object.assign(profile, profileUpdates);
        await profile.save({ session });
      }

      if (logEntries.length > 0) {
        await ProfileChange.create(logEntries, { session });
      }
    });
  } finally {
    await session.endSession();
  }

  const freshUser = await User.findById(user._id);
  const freshProfile = await PatientProfile.findOne({ userId: user._id });

  return {
    user: freshUser.toSafeObject(),
    profile: freshProfile.toJSON(),
    logged: logEntries.map((e) => e.field),
  };
}

async function getChangeHistory(user, limit = 20) {
  const changes = await ProfileChange.find({ userId: user._id })
    .sort({ changedAt: -1 })
    .limit(Math.min(limit, 100));

  return { changes };
}

module.exports = { getProfile, updateProfile, getChangeHistory };
