// Display order. Safety limits lead because the delivery path depends on
// them; dosing factors are used later by the advisory layer.
export const FIELD_GROUPS = [
  { title: 'Safety limits', keys: ['maxBolusUnits', 'maxDailyDoseUnits'] },
  { title: 'Background delivery', keys: ['basalRateUnitsPerHour'] },
  { title: 'Dosing factors', keys: ['insulinSensitivityFactor', 'carbRatioGrams'] },
  { title: 'Target range', keys: ['targetGlucoseLowMgdl', 'targetGlucoseHighMgdl'] },
  { title: 'Timing', keys: ['insulinDurationHours'] },
];

export const FIELD_HELP = {
  maxBolusUnits:
    'The largest single delivery the system will accept. Every delivery is checked against this.',
  maxDailyDoseUnits:
    'The most the system will deliver in any 24 hours, background delivery included.',
  basalRateUnitsPerHour: 'Continuous background delivery per hour.',
  insulinSensitivityFactor:
    'How far 1 unit lowers glucose. Used to size correction amounts.',
  carbRatioGrams: 'Grams of carbohydrate covered by 1 unit. Used to size meal amounts.',
  targetGlucoseLowMgdl: 'Lower edge of the range the system aims for.',
  targetGlucoseHighMgdl: 'Upper edge of the range the system aims for.',
  insulinDurationHours:
    'How long a delivery keeps acting. Used to track insulin still active.',
};

// Accepts a comma as the decimal separator, which some Android keyboards
// produce depending on locale.
export function parseNumber(value) {
  if (value === null || value === undefined) return NaN;
  const s = String(value).trim().replace(',', '.');
  if (s === '') return NaN;
  return Number(s);
}

function countDecimals(n) {
  const s = String(n);
  if (s.includes('e')) return Infinity;
  const i = s.indexOf('.');
  return i === -1 ? 0 : s.length - i - 1;
}

// Mirrors backend/src/utils/treatmentRules.js. Ranges come from the server's
// /limits response; the three cross-field rules are repeated here so the
// user sees problems before submitting. The server remains authoritative.
export function checkParameters(values, fields) {
  const errors = {};

  Object.entries(fields).forEach(([key, def]) => {
    const v = values[key];
    if (!Number.isFinite(v)) {
      errors[key] = `Enter ${def.label.toLowerCase()}`;
      return;
    }
    if (v < def.min || v > def.max) {
      errors[key] = `Must be between ${def.min} and ${def.max} ${def.unit}`;
      return;
    }
    if (countDecimals(v) > def.decimals) {
      errors[key] =
        def.decimals === 0
          ? 'Must be a whole number'
          : `At most ${def.decimals} decimal place${def.decimals > 1 ? 's' : ''}`;
    }
  });

  const ok = (k) => !errors[k];

  if (
    ok('targetGlucoseLowMgdl') &&
    ok('targetGlucoseHighMgdl') &&
    values.targetGlucoseLowMgdl >= values.targetGlucoseHighMgdl
  ) {
    errors.targetGlucoseHighMgdl = 'Must be above target low';
  }

  if (
    ok('maxBolusUnits') &&
    ok('maxDailyDoseUnits') &&
    values.maxBolusUnits > values.maxDailyDoseUnits
  ) {
    errors.maxBolusUnits = 'Cannot exceed max daily dose';
  }

  if (
    ok('basalRateUnitsPerHour') &&
    ok('maxDailyDoseUnits') &&
    Math.round(values.basalRateUnitsPerHour * 24 * 100) >
      Math.round(values.maxDailyDoseUnits * 100)
  ) {
    errors.basalRateUnitsPerHour = 'Over 24 hours this would exceed max daily dose';
  }

  return errors;
}

export function valuesToForm(params, keys) {
  const out = {};
  keys.forEach((k) => {
    out[k] = params ? String(params[k]) : '';
  });
  return out;
}

export function formToValues(form, keys) {
  const out = {};
  keys.forEach((k) => {
    out[k] = parseNumber(form[k]);
  });
  return out;
}

export function formatValue(value, def) {
  if (value === null || value === undefined) return '—';
  return `${value} ${def.unit}`;
}

export function rangeHint(def) {
  return `Allowed ${def.min}–${def.max} ${def.unit}`;
}

export function diffVersions(newer, older, keys) {
  return keys
    .filter((k) => newer[k] !== older[k])
    .map((k) => ({ key: k, from: older[k], to: newer[k] }));
}
