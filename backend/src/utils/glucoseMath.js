// Pure functions: numbers in, numbers out. No database, no clock of their
// own. The stage 14 Jest tests exercise these directly.

const CGM_MIN_MGDL = 40;
const CGM_MAX_MGDL = 400;

// Standard normal sample via Box-Muller. `rand` is injectable so tests can
// supply a deterministic sequence.
function gaussian(rand = Math.random) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// One simulation step. Drift pushes steadily in one direction; reversion
// pulls toward a baseline; noise scales with the square root of elapsed
// time, so the same scenario behaves consistently at any interval.
function nextGlucose(current, scenario, dtMinutes, rand = Math.random) {
  let delta = scenario.driftPerMin * dtMinutes;

  if (scenario.baseline !== null) {
    delta += scenario.reversionPerMin * (scenario.baseline - current) * dtMinutes;
  }

  delta += scenario.noiseSd * Math.sqrt(dtMinutes) * gaussian(rand);

  const next = Math.round(current + delta);
  return Math.min(CGM_MAX_MGDL, Math.max(CGM_MIN_MGDL, next));
}

// Decided by age, never by how many readings exist. A missing or old reading
// is what puts glucose-dependent actions into a hold state.
function classifyFreshness(recordedAt, now, intervalSeconds, staleAfterIntervals) {
  if (!recordedAt) {
    return { status: 'no_data', ageSeconds: null };
  }

  const ageSeconds = Math.max(
    0,
    Math.floor((now.getTime() - new Date(recordedAt).getTime()) / 1000)
  );

  const staleAfterSeconds = intervalSeconds * staleAfterIntervals;

  return {
    status: ageSeconds > staleAfterSeconds ? 'stale' : 'fresh',
    ageSeconds,
  };
}

module.exports = {
  CGM_MIN_MGDL,
  CGM_MAX_MGDL,
  gaussian,
  nextGlucose,
  classifyFreshness,
};
