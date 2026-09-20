const mongoose = require('mongoose');
const User = require('../models/user.model');
const PatientProfile = require('../models/patientProfile.model');
const AppError = require('../utils/AppError');
const { signToken } = require('../utils/token');

async function register({ fullName, email, password, profile }) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError(
      'An account with that email already exists',
      409,
      'EMAIL_TAKEN'
    );
  }

  const session = await mongoose.startSession();

  try {
    let createdUser;

    // Both documents or neither. A user without a profile could sign in but
    // would have no clinical record, and nothing would flag it.
    await session.withTransaction(async () => {
      const [user] = await User.create(
        [{ fullName, email, passwordHash: password, role: 'patient' }],
        { session }
      );

      await PatientProfile.create(
        [
          {
            userId: user._id,
            dateOfBirth: new Date(profile.dateOfBirth),
            sex: profile.sex,
            weightKg: profile.weightKg,
            heightCm: profile.heightCm,
            diabetesType: profile.diabetesType,
            diagnosisYear: profile.diagnosisYear,
            emergencyContact: profile.emergencyContact,
          },
        ],
        { session }
      );

      createdUser = user;
    });

    return {
      user: createdUser.toSafeObject(),
      token: signToken(createdUser),
    };
  } finally {
    await session.endSession();
  }
}

async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');

  // Same error whether the email is unknown or the password is wrong.
  // Distinguishing them lets anyone test which emails have accounts.
  const invalid = new AppError(
    'Incorrect email or password',
    401,
    'INVALID_CREDENTIALS'
  );

  if (!user) throw invalid;

  const matches = await user.comparePassword(password);
  if (!matches) throw invalid;

  return {
    user: user.toSafeObject(),
    token: signToken(user),
  };
}

async function getCurrentUser(user) {
  const profile = await PatientProfile.findOne({ userId: user._id });

  return {
    user: user.toSafeObject(),
    profile: profile ? profile.toJSON() : null,
  };
}

module.exports = { register, login, getCurrentUser };
