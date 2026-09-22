const config = require('../config');
const glucoseSource = require('./glucoseSource');
const simulator = require('../simulation/glucoseSimulator');
const AppError = require('../utils/AppError');
const { classifyFreshness } = require('../utils/glucoseMath');
const { GLUCOSE_UNIT } = require('../config/safetyLimits');

function freshnessOf(reading) {
  return classifyFreshness(
    reading ? reading.recordedAt : null,
    new Date(),
    config.glucose.intervalSeconds,
    config.glucose.staleAfterIntervals
  );
}

// A stale reading is still returned with its age. The app should show the
// last known value clearly marked as old, not hide it.
async function getCurrent(user) {
  const reading = await glucoseSource.getCurrentReading(user._id);
  const { status, ageSeconds } = freshnessOf(reading);

  return {
    unit: GLUCOSE_UNIT,
    source: glucoseSource.name,
    intervalSeconds: config.glucose.intervalSeconds,
    staleAfterSeconds:
      config.glucose.intervalSeconds * config.glucose.staleAfterIntervals,
    status,
    ageSeconds,
    reading,
  };
}

// For stages 8, 10 and 11. Anything that acts on glucose calls this first;
// without a fresh reading the answer is to hold, never to guess.
async function requireFreshReading(userId) {
  const reading = await glucoseSource.getCurrentReading(userId);
  const { status } = freshnessOf(reading);

  if (status !== 'fresh') {
    throw new AppError(
      'No current glucose reading. Actions that depend on glucose are on hold until data resumes.',
      409,
      'GLUCOSE_DATA_GAP'
    );
  }

  return reading;
}

function assertSimulatorAvailable() {
  if (!config.simulator.enabled || glucoseSource.name !== 'simulator') {
    throw new AppError('The glucose simulator is not active', 409, 'SIMULATOR_DISABLED');
  }
}

async function getSimulatorState(user) {
  assertSimulatorAvailable();
  return simulator.getPatientState(user._id);
}

async function setSimulatorControls(user, controls) {
  assertSimulatorAvailable();
  return simulator.setPatientControls(user._id, controls);
}

module.exports = {
  getCurrent,
  requireFreshReading,
  getSimulatorState,
  setSimulatorControls,
};
