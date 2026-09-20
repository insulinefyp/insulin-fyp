const mongoose = require('mongoose');
const User = require('../models/user.model');
const PatientProfile = require('../models/patientProfile.model');
const AppError = require('../utils/AppError');

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

    return createdUser.toSafeObject();
  } finally {
    await session.endSession();
  }
}

module.exports = { register };
