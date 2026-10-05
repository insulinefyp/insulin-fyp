const { TEMPERATURE } = require('../config/safetyLimits');

// Pure: a number in, a classification out. No database, no clock.
// Exercised directly by Jest.

const STATUSES = Object.freeze({
  UNAVAILABLE: 'unavailable',
  CRITICAL_COLD: 'critical_cold',
  NORMAL: 'normal',
  WARNING_HOT: 'warning_hot',
  CRITICAL_HOT: 'critical_hot',
});

const SEVERITY = Object.freeze({
  unavailable: 0,
  normal: 0,
  warning_hot: 1,
  critical_cold: 2,
  critical_hot: 2,
});

function classifyTemperature(celsius) {
  if (typeof celsius !== 'number' || !Number.isFinite(celsius)) {
    return STATUSES.UNAVAILABLE;
  }
  if (celsius < TEMPERATURE.criticalLowC) return STATUSES.CRITICAL_COLD;
  if (celsius > TEMPERATURE.criticalHighC) return STATUSES.CRITICAL_HOT;
  if (celsius > TEMPERATURE.warningHighC) return STATUSES.WARNING_HOT;
  return STATUSES.NORMAL;
}

function isExcursion(status) {
  return status !== STATUSES.NORMAL && status !== STATUSES.UNAVAILABLE;
}

function severityOf(status) {
  return SEVERITY[status] ?? 0;
}

// A reading is stored when something meaningful changed, not on every poll.
// At a 3-second poll interval, storing everything would be 28,800 rows a day
// of near-identical values; this keeps the history usable without ever
// missing an excursion.
const STORE_MIN_DELTA_C = 0.3;
const STORE_MAX_GAP_SECONDS = 60;

function shouldStoreReading(previous, next, maxGapSeconds = STORE_MAX_GAP_SECONDS) {
  if (!previous) return true;
  if (previous.status !== next.status) return true;
  if (Math.abs(previous.celsius - next.celsius) >= STORE_MIN_DELTA_C) return true;

  const gapSeconds = (next.recordedAt - previous.recordedAt) / 1000;
  return gapSeconds >= maxGapSeconds;
}

module.exports = {
  STATUSES,
  classifyTemperature,
  isExcursion,
  severityOf,
  shouldStoreReading,
  STORE_MIN_DELTA_C,
  STORE_MAX_GAP_SECONDS,
};
