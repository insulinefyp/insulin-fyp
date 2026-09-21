// SYSTEM LIMITS — the outer tier of the safety architecture.
//
// No API call can change these. A patient's own treatment parameters must sit
// inside them, and the ESP32 firmware applies its own independent caps on top
// at stage 8.
//
// These are plausibility bounds for a benchtop research prototype that pumps
// water into a beaker. They are wide enough to accept any realistic
// configuration and tight enough to reject obvious entry errors (80 instead
// of 8). They are NOT clinical dosing guidance.

const GLUCOSE_UNIT = 'mg/dL';

function field(def) {
  return Object.freeze(def);
}

const FIELDS = Object.freeze({
  insulinSensitivityFactor: field({
    label: 'Insulin sensitivity factor',
    unit: 'mg/dL per U',
    min: 5,
    max: 400,
    decimals: 1,
  }),
  carbRatioGrams: field({
    label: 'Carb ratio',
    unit: 'g per U',
    min: 2,
    max: 150,
    decimals: 1,
  }),
  targetGlucoseLowMgdl: field({
    label: 'Target low',
    unit: 'mg/dL',
    min: 70,
    max: 180,
    decimals: 0,
  }),
  targetGlucoseHighMgdl: field({
    label: 'Target high',
    unit: 'mg/dL',
    min: 80,
    max: 250,
    decimals: 0,
  }),
  basalRateUnitsPerHour: field({
    label: 'Basal rate',
    unit: 'U/h',
    min: 0,
    max: 5,
    decimals: 2,
  }),
  maxBolusUnits: field({
    label: 'Max bolus',
    unit: 'U',
    min: 0.1,
    max: 25,
    decimals: 2,
  }),
  maxDailyDoseUnits: field({
    label: 'Max daily dose',
    unit: 'U',
    min: 1,
    max: 150,
    decimals: 1,
  }),
  insulinDurationHours: field({
    label: 'Insulin duration',
    unit: 'h',
    min: 2,
    max: 8,
    decimals: 1,
  }),
});

const FIELD_KEYS = Object.freeze(Object.keys(FIELDS));

// Raising either of these widens what the delivery path will accept, so the
// mobile app asks for confirmation before saving an increase.
const RAISE_SENSITIVE = Object.freeze(['maxBolusUnits', 'maxDailyDoseUnits']);

module.exports = { GLUCOSE_UNIT, FIELDS, FIELD_KEYS, RAISE_SENSITIVE };
