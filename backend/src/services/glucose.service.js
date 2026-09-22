const config = require('../config');
const glucoseSource = require('./glucoseSource');
const simulator = require('../simulation/glucoseSimulator');
const AppError = require('../utils/AppError');
const { classifyFreshness } = require('../utils/glucoseMath');
const { calculateTrend } = require('../utils/glucoseTrend');
const { bucketReadings, summarise } = require('../utils/glucoseBuckets');
const { GLUCOSE_UNIT } = require('../config/safetyLimits');
const {
  RANGES,
  RANGE_KEYS,
  DEFAULT_RANGE,
  TREND_WINDOW_MINUTES,
} = require('../config/glucoseRanges');

function freshnessOf(reading) {
  return classifyFreshness(
    reading ? reading.recordedAt : null,
    new Date(),
    config.glucose.intervalSeconds,
    config.glucose.staleAfterIntervals
  );
}

async function computeTrend(userId, now) {
  const from = new Date(now.getTime() - TREND_WINDOW_MINUTES * 60000);
  const readings = await glucoseSource.getHistory(userId, { from, to: now });
  return calculateTrend(readings);
}

// A stale reading is still returned with its age. The app shows the last
// known value clearly marked as old, rather than hiding it.
async function getCurrent(user) {
  const now = new Date();
  const reading = await glucoseSource.getCurrentReading(user._id);
  const { status, ageSeconds } = freshnessOf(reading);

  // A trend computed from stale data would describe the past while looking
  // like the present.
  const trend =
    status === 'fresh'
      ? await computeTrend(user._id, now)
      : { available: false, reason: status === 'stale' ? 'data_stale' : 'no_data' };

  return {
    unit: GLUCOSE_UNIT,
    source: glucoseSource.name,
    intervalSeconds: config.glucose.intervalSeconds,
    staleAfterSeconds:
      config.glucose.intervalSeconds * config.glucose.staleAfterIntervals,
    status,
    ageSeconds,
    reading,
    trend,
    trendWindowMinutes: TREND_WINDOW_MINUTES,
  };
}

async function getHistory(user, rangeKey = DEFAULT_RANGE) {
  const range = RANGES[rangeKey];

  if (!range) {
    throw new AppError(`Unknown range "${rangeKey}"`, 400, 'INVALID_RANGE');
  }

  const to = new Date();
  const from = new Date(to.getTime() - range.hours * 3600000);

  const readings = await glucoseSource.getHistory(user._id, { from, to });

  const points = bucketReadings(readings, {
    from,
    to,
    bucketMinutes: range.bucketMinutes,
  });

  return {
    unit: GLUCOSE_UNIT,
    range: rangeKey,
    from: from.toISOString(),
    to: to.toISOString(),
    bucketMinutes: range.bucketMinutes,
    readingCount: readings.length,
    summary: summarise(points),
    points,
  };
}

function getRanges() {
  return {
    ranges: RANGE_KEYS.map((key) => ({ key, ...RANGES[key] })),
    defaultRange: DEFAULT_RANGE,
    trendWindowMinutes: TREND_WINDOW_MINUTES,
  };
}

// For stages 8, 10 and 11. Anything acting on glucose calls this first;
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
  getHistory,
  getRanges,
  requireFreshReading,
  getSimulatorState,
  setSimulatorControls,
};
