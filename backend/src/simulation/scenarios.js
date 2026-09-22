// Test scenarios for the simulated patient. They exist so later stages can
// reproduce specific situations on demand (a fast fall, a sustained high),
// not to model physiology faithfully.
//
// driftPerMin      steady change in mg/dL per minute
// baseline         value the patient is pulled toward (null = no pull)
// reversionPerMin  fraction of the gap to baseline closed per minute
// noiseSd          random variation, mg/dL per sqrt(minute)

function scenario(def) {
  return Object.freeze(def);
}

const SCENARIOS = Object.freeze({
  steady: scenario({
    label: 'Steady',
    baseline: 120,
    reversionPerMin: 0.05,
    driftPerMin: 0,
    noiseSd: 2,
  }),
  rising: scenario({
    label: 'Rising',
    baseline: null,
    reversionPerMin: 0,
    driftPerMin: 2.5,
    noiseSd: 1.5,
  }),
  falling: scenario({
    label: 'Falling',
    baseline: null,
    reversionPerMin: 0,
    driftPerMin: -2.5,
    noiseSd: 1.5,
  }),
  high: scenario({
    label: 'Sustained high',
    baseline: 260,
    reversionPerMin: 0.05,
    driftPerMin: 0,
    noiseSd: 3,
  }),
  low: scenario({
    label: 'Sustained low',
    baseline: 62,
    reversionPerMin: 0.08,
    driftPerMin: 0,
    noiseSd: 1.5,
  }),
});

const SCENARIO_KEYS = Object.freeze(Object.keys(SCENARIOS));
const DEFAULT_SCENARIO = 'steady';
const START_VALUE_MGDL = 120;

module.exports = { SCENARIOS, SCENARIO_KEYS, DEFAULT_SCENARIO, START_VALUE_MGDL };
