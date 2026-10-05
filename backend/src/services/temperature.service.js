const TemperatureReading = require('../models/temperatureReading.model');
const TemperatureExcursion = require('../models/temperatureExcursion.model');
const { TEMPERATURE } = require('../config/safetyLimits');
const {
  classifyTemperature,
  isExcursion,
  shouldStoreReading,
} = require('../utils/temperatureRules');

// In-memory state, so a decision about whether to store does not require a
// database read on every poll.
const lastStored = new Map();   // deviceId -> { celsius, status, recordedAt }
const openExcursion = new Map(); // deviceId -> excursion document id

async function closeExcursion(deviceId, endedAt) {
  const id = openExcursion.get(deviceId);
  if (!id) return;

  await TemperatureExcursion.updateOne({ _id: id }, { $set: { endedAt } });
  openExcursion.delete(deviceId);
}

async function openOrExtendExcursion(deviceId, reading) {
  const id = openExcursion.get(deviceId);

  if (!id) {
    const created = await TemperatureExcursion.create({
      deviceId,
      status: reading.status,
      startedAt: reading.recordedAt,
      peakCelsius: reading.celsius,
      readingCount: 1,
      simulated: reading.simulated,
    });
    openExcursion.set(deviceId, created._id);
    return;
  }

  const existing = await TemperatureExcursion.findById(id);
  if (!existing) {
    openExcursion.delete(deviceId);
    return;
  }

  // A move between excursion levels (warning to critical, say) closes the
  // old period and opens a new one, so each has its own duration.
  if (existing.status !== reading.status) {
    await closeExcursion(deviceId, reading.recordedAt);
    await openOrExtendExcursion(deviceId, reading);
    return;
  }

  const furtherFromNormal =
    reading.status === 'critical_cold'
      ? reading.celsius < existing.peakCelsius
      : reading.celsius > existing.peakCelsius;

  existing.readingCount += 1;
  if (furtherFromNormal) existing.peakCelsius = reading.celsius;
  await existing.save();
}

// Called by the poller on every successful read. Decides what to persist.
async function recordObservation(deviceId, { celsius, simulated, observedAt }) {
  if (typeof celsius !== 'number' || !Number.isFinite(celsius)) {
    // No reading means no record. The system does not invent data, and an
    // open excursion is left open rather than silently closed.
    return null;
  }

  // Classified here from the raw value. The device's own status field is
  // checked against this but never trusted in its place.
  const status = classifyTemperature(celsius);
  const reading = { celsius, status, simulated: Boolean(simulated), recordedAt: observedAt };

  const previous = lastStored.get(deviceId);

  if (isExcursion(status)) {
    await openOrExtendExcursion(deviceId, reading);
  } else if (openExcursion.has(deviceId)) {
    await closeExcursion(deviceId, observedAt);
  }

  if (!shouldStoreReading(previous, reading)) return null;

  await TemperatureReading.create({ deviceId, ...reading });
  lastStored.set(deviceId, reading);

  return reading;
}

async function getHistory(deviceId, { hours = 6, includeSimulated = false } = {}) {
  const to = new Date();
  const from = new Date(to.getTime() - hours * 3600000);

  const query = { deviceId, recordedAt: { $gte: from, $lte: to } };
  if (!includeSimulated) query.simulated = false;

  const readings = await TemperatureReading.find(query).sort({ recordedAt: 1 });

  const values = readings.map((r) => r.celsius);

  return {
    unit: TEMPERATURE.unit,
    thresholds: TEMPERATURE,
    from,
    to,
    count: readings.length,
    min: values.length ? Math.min(...values) : null,
    max: values.length ? Math.max(...values) : null,
    readings: readings.map((r) => r.toSafeObject()),
  };
}

async function getExcursions(deviceId, { limit = 20, includeSimulated = false } = {}) {
  const query = { deviceId };
  if (!includeSimulated) query.simulated = false;

  const excursions = await TemperatureExcursion.find(query)
    .sort({ startedAt: -1 })
    .limit(Math.min(limit, 100));

  return { excursions: excursions.map((e) => e.toSafeObject()) };
}

module.exports = { recordObservation, getHistory, getExcursions };
