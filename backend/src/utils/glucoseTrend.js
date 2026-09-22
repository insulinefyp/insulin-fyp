// Pure: readings in, trend out. No database, no clock. Exercised directly by
// the Jest tests, since trend calculation is one of the three tested pieces.

// Thresholds in mg/dL per minute, matching the arrow categories CGM systems
// conventionally use (2 and 1 mg/dL per minute).
const RAPID_THRESHOLD = 2;
const MODERATE_THRESHOLD = 1;

const MIN_READINGS = 3;
const MIN_SPAN_MINUTES = 5;

function categorise(slope) {
  if (slope >= RAPID_THRESHOLD) return 'rising_rapidly';
  if (slope >= MODERATE_THRESHOLD) return 'rising';
  if (slope <= -RAPID_THRESHOLD) return 'falling_rapidly';
  if (slope <= -MODERATE_THRESHOLD) return 'falling';
  return 'steady';
}

// Least-squares slope of value against time, in mg/dL per minute. Regression
// rather than last-minus-first so a single noisy reading cannot flip the
// direction.
function regressionSlope(points) {
  const n = points.length;
  const meanX = points.reduce((s, p) => s + p.x, 0) / n;
  const meanY = points.reduce((s, p) => s + p.y, 0) / n;

  let numerator = 0;
  let denominator = 0;

  points.forEach((p) => {
    numerator += (p.x - meanX) * (p.y - meanY);
    denominator += (p.x - meanX) ** 2;
  });

  if (denominator === 0) return null;
  return numerator / denominator;
}

// Returns { available: false, reason } rather than a flat arrow when the data
// cannot support a claim. "Steady" is an assertion, not a safe default.
function calculateTrend(readings) {
  if (!Array.isArray(readings) || readings.length < MIN_READINGS) {
    return { available: false, reason: 'insufficient_readings' };
  }

  const sorted = [...readings].sort(
    (a, b) => new Date(a.recordedAt) - new Date(b.recordedAt)
  );

  const startMs = new Date(sorted[0].recordedAt).getTime();
  const endMs = new Date(sorted[sorted.length - 1].recordedAt).getTime();
  const spanMinutes = (endMs - startMs) / 60000;

  if (spanMinutes < MIN_SPAN_MINUTES) {
    return { available: false, reason: 'window_too_short' };
  }

  const points = sorted.map((r) => ({
    x: (new Date(r.recordedAt).getTime() - startMs) / 60000,
    y: r.valueMgdl,
  }));

  const slope = regressionSlope(points);

  if (slope === null || !Number.isFinite(slope)) {
    return { available: false, reason: 'insufficient_readings' };
  }

  const rounded = Math.round(slope * 100) / 100;

  return {
    available: true,
    mgdlPerMinute: rounded,
    direction: categorise(rounded),
    readingsUsed: sorted.length,
    spanMinutes: Math.round(spanMinutes),
  };
}

module.exports = {
  calculateTrend,
  categorise,
  regressionSlope,
  RAPID_THRESHOLD,
  MODERATE_THRESHOLD,
  MIN_READINGS,
  MIN_SPAN_MINUTES,
};
