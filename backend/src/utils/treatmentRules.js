const { FIELDS, FIELD_KEYS } = require('../config/safetyLimits');

function countDecimals(n) {
  const s = String(n);
  if (s.includes('e')) return Infinity;
  const i = s.indexOf('.');
  return i === -1 ? 0 : s.length - i - 1;
}

// Pure: numbers in, errors out. No database, no HTTP. This is what the stage
// 14 Jest tests for safety clamping exercise directly.
function checkTreatmentParameters(values) {
  const errors = {};

  FIELD_KEYS.forEach((key) => {
    const def = FIELDS[key];
    const v = values[key];

    if (typeof v !== 'number' || !Number.isFinite(v)) {
      errors[key] = `${def.label} is required`;
      return;
    }
    if (v < def.min || v > def.max) {
      errors[key] = `${def.label} must be between ${def.min} and ${def.max} ${def.unit}`;
      return;
    }
    if (countDecimals(v) > def.decimals) {
      errors[key] =
        def.decimals === 0
          ? `${def.label} must be a whole number`
          : `${def.label} allows at most ${def.decimals} decimal place${def.decimals > 1 ? 's' : ''}`;
    }
  });

  // Cross-field rules only run once each field is individually valid, so the
  // user sees one clear problem per field rather than a cascade.
  const ok = (k) => !errors[k];

  if (
    ok('targetGlucoseLowMgdl') &&
    ok('targetGlucoseHighMgdl') &&
    values.targetGlucoseLowMgdl >= values.targetGlucoseHighMgdl
  ) {
    errors.targetGlucoseHighMgdl = 'Target high must be above target low';
  }

  if (
    ok('maxBolusUnits') &&
    ok('maxDailyDoseUnits') &&
    values.maxBolusUnits > values.maxDailyDoseUnits
  ) {
    errors.maxBolusUnits = 'Max bolus cannot exceed max daily dose';
  }

  // Background delivery alone must never be able to exhaust the daily limit.
  // Compared in hundredths to avoid floating-point error (0.8 * 24).
  if (
    ok('basalRateUnitsPerHour') &&
    ok('maxDailyDoseUnits') &&
    Math.round(values.basalRateUnitsPerHour * 24 * 100) >
      Math.round(values.maxDailyDoseUnits * 100)
  ) {
    errors.basalRateUnitsPerHour =
      'Basal rate over 24 hours would exceed max daily dose';
  }

  return errors;
}

module.exports = { checkTreatmentParameters };
