const { connectDatabase, disconnectDatabase } = require('../config/database');
const User = require('../models/user.model');
const PatientProfile = require('../models/patientProfile.model');

const TEST_EMAIL = 'verify-script@example.com';

async function run() {
  await connectDatabase();

  await User.deleteOne({ email: TEST_EMAIL });

  console.log('\n1. Creating user...');
  const user = await User.create({
    email: TEST_EMAIL,
    passwordHash: 'testpassword123',
    fullName: 'Verify Script',
  });
  console.log('   created:', user._id.toString());

  console.log('\n2. Checking the password was hashed...');
  const withHash = await User.findById(user._id).select('+passwordHash');
  const looksHashed = withHash.passwordHash.startsWith('$2');
  console.log('   stored:', withHash.passwordHash.slice(0, 20) + '...');
  console.log('   hashed:', looksHashed ? 'YES' : 'NO — FAIL');

  console.log('\n3. Comparing passwords...');
  console.log('   correct password:', await withHash.comparePassword('testpassword123'));
  console.log('   wrong password:  ', await withHash.comparePassword('wrongpassword'));

  console.log('\n4. Hash excluded by default...');
  const plain = await User.findById(user._id);
  console.log('   passwordHash present:', plain.passwordHash !== undefined ? 'YES — FAIL' : 'NO');

  console.log('\n5. Creating profile...');
  await PatientProfile.deleteOne({ userId: user._id });
  const profile = await PatientProfile.create({
    userId: user._id,
    dateOfBirth: new Date('2001-02-28'),
    sex: 'male',
    weightKg: 70,
    heightCm: 175,
    diabetesType: 'type1',
    diagnosisYear: 2015,
    emergencyContact: {
      name: 'Test Contact',
      phone: '+92 300 1234567',
      relationship: 'parent',
    },
  });
  console.log('   created:', profile._id.toString());
  console.log('   age virtual:', profile.age);

  console.log('\n6. Rejecting an out-of-range weight...');
  try {
    await PatientProfile.create({
      userId: new (require('mongoose').Types.ObjectId)(),
      dateOfBirth: new Date('2001-02-28'),
      sex: 'male',
      weightKg: 700,
      heightCm: 175,
      diabetesType: 'type1',
      diagnosisYear: 2015,
      emergencyContact: { name: 'X', phone: '1234567', relationship: 'other' },
    });
    console.log('   FAIL — 700 kg was accepted');
  } catch (err) {
    console.log('   rejected:', err.errors?.weightKg?.message || err.message);
  }

  console.log('\n7. Rejecting a duplicate email...');
  try {
    await User.create({
      email: TEST_EMAIL,
      passwordHash: 'anotherpassword',
      fullName: 'Duplicate',
    });
    console.log('   FAIL — duplicate accepted');
  } catch (err) {
    console.log('   rejected:', err.code === 11000 ? 'duplicate key' : err.message);
  }

  console.log('\n8. Cleaning up...');
  await PatientProfile.deleteOne({ userId: user._id });
  await User.deleteOne({ _id: user._id });
  console.log('   done\n');

  await disconnectDatabase();
}

run().catch(async (err) => {
  console.error('\nScript failed:', err.message);
  await disconnectDatabase();
  process.exit(1);
});
