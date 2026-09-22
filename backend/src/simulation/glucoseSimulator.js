const config = require('../config');
const User = require('../models/user.model');
const GlucoseReading = require('../models/glucoseReading.model');
const { nextGlucose } = require('../utils/glucoseMath');
const {
  SCENARIOS,
  DEFAULT_SCENARIO,
  START_VALUE_MGDL,
} = require('./scenarios');

// Per-patient state, in memory. Scenario and pause reset on restart; the
// glucose value itself continues from the last stored reading.
const patients = new Map();

let timer = null;
let tickInProgress = false;
let lastTickAt = null;
let lastError = null;

async function seedPatient(userId) {
  const last = await GlucoseReading.findOne({ userId, source: 'simulator' })
    .sort({ recordedAt: -1 })
    .lean();

  return {
    value: last ? last.valueMgdl : START_VALUE_MGDL,
    scenario: DEFAULT_SCENARIO,
    paused: false,
  };
}

async function getOrSeed(userId) {
  const key = String(userId);
  if (!patients.has(key)) {
    patients.set(key, await seedPatient(userId));
  }
  return patients.get(key);
}

async function tick() {
  // A slow database must not cause overlapping ticks writing duplicates.
  if (tickInProgress) return;
  tickInProgress = true;

  try {
    const users = await User.find({ role: 'patient' }).select('_id').lean();
    const now = new Date();
    const dtMinutes = config.glucose.intervalSeconds / 60;
    const docs = [];

    for (const user of users) {
      const state = await getOrSeed(user._id);
      if (state.paused) continue;

      state.value = nextGlucose(state.value, SCENARIOS[state.scenario], dtMinutes);

      docs.push({
        userId: user._id,
        valueMgdl: state.value,
        recordedAt: now,
        source: 'simulator',
      });
    }

    if (docs.length > 0) {
      await GlucoseReading.insertMany(docs);
    }

    lastTickAt = now;
    lastError = null;
  } catch (err) {
    // Deliberately no retry. A failed tick leaves a gap, readings go stale,
    // and the hold state engages: the same thing a real sensor dropout does.
    lastError = err.message;
    console.error('[simulator] tick failed:', err.message);
  } finally {
    tickInProgress = false;
  }
}

function start() {
  if (timer) return;
  tick();
  timer = setInterval(tick, config.glucose.intervalSeconds * 1000);
  console.log(
    `Glucose simulator started: one reading every ${config.glucose.intervalSeconds}s`
  );
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
}

function getStatus() {
  return {
    enabled: config.simulator.enabled,
    running: Boolean(timer),
    intervalSeconds: config.glucose.intervalSeconds,
    lastTickAt,
    lastError,
    patientsTracked: patients.size,
  };
}

async function getPatientState(userId) {
  const state = await getOrSeed(userId);
  return {
    scenario: state.scenario,
    paused: state.paused,
    lastValueMgdl: state.value,
    availableScenarios: Object.entries(SCENARIOS).map(([key, s]) => ({
      key,
      label: s.label,
    })),
  };
}

async function setPatientControls(userId, { scenario, paused }) {
  const state = await getOrSeed(userId);
  if (scenario !== undefined) state.scenario = scenario;
  if (paused !== undefined) state.paused = paused;
  return getPatientState(userId);
}

module.exports = { start, stop, getStatus, getPatientState, setPatientControls };
