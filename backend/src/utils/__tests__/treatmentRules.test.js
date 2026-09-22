const { checkTreatmentParameters } = require('../treatmentRules');

// A configuration that passes every rule. Each test changes one value, so a
// failure points at exactly one cause.
function validParameters(overrides = {}) {
  return {
    insulinSensitivityFactor: 50,
    carbRatioGrams: 10,
    targetGlucoseLowMgdl: 90,
    targetGlucoseHighMgdl: 140,
    basalRateUnitsPerHour: 0.8,
    maxBolusUnits: 8,
    maxDailyDoseUnits: 50,
    insulinDurationHours: 4,
    ...overrides,
  };
}

describe('checkTreatmentParameters — valid input', () => {
  test('accepts a well-formed configuration', () => {
    expect(checkTreatmentParameters(validParameters())).toEqual({});
  });

  test('accepts a zero basal rate', () => {
    const errors = checkTreatmentParameters(
      validParameters({ basalRateUnitsPerHour: 0 })
    );
    expect(errors.basalRateUnitsPerHour).toBeUndefined();
  });
});

describe('checkTreatmentParameters — required and type', () => {
  test.each([
    'insulinSensitivityFactor',
    'carbRatioGrams',
    'targetGlucoseLowMgdl',
    'targetGlucoseHighMgdl',
    'basalRateUnitsPerHour',
    'maxBolusUnits',
    'maxDailyDoseUnits',
    'insulinDurationHours',
  ])('%s is required', (key) => {
    const errors = checkTreatmentParameters(validParameters({ [key]: undefined }));
    expect(errors[key]).toBeDefined();
  });

  test('rejects a string where a number is required', () => {
    const errors = checkTreatmentParameters(validParameters({ maxBolusUnits: '8' }));
    expect(errors.maxBolusUnits).toBeDefined();
  });

  test('rejects NaN and Infinity', () => {
    expect(
      checkTreatmentParameters(validParameters({ maxBolusUnits: NaN }))
        .maxBolusUnits
    ).toBeDefined();
    expect(
      checkTreatmentParameters(validParameters({ maxBolusUnits: Infinity }))
        .maxBolusUnits
    ).toBeDefined();
  });
});

describe('checkTreatmentParameters — boundaries', () => {
  // Off-by-one errors live exactly here, and this is the layer a delivery
  // command is validated against at stage 8.

  test('accepts a value exactly at the maximum', () => {
    const errors = checkTreatmentParameters(
      validParameters({ maxBolusUnits: 25, maxDailyDoseUnits: 50 })
    );
    expect(errors.maxBolusUnits).toBeUndefined();
  });

  test('rejects a value a hair above the maximum', () => {
    const errors = checkTreatmentParameters(
      validParameters({ maxBolusUnits: 25.01, maxDailyDoseUnits: 50 })
    );
    expect(errors.maxBolusUnits).toBeDefined();
  });

  test('accepts a value exactly at the minimum', () => {
    const errors = checkTreatmentParameters(validParameters({ maxBolusUnits: 0.1 }));
    expect(errors.maxBolusUnits).toBeUndefined();
  });

  test('rejects a value below the minimum', () => {
    const errors = checkTreatmentParameters(validParameters({ maxBolusUnits: 0.09 }));
    expect(errors.maxBolusUnits).toBeDefined();
  });

  test('rejects the 80-instead-of-8 entry error', () => {
    const errors = checkTreatmentParameters(validParameters({ maxBolusUnits: 80 }));
    expect(errors.maxBolusUnits).toBeDefined();
  });
});

describe('checkTreatmentParameters — precision', () => {
  test('rejects a fractional target glucose', () => {
    const errors = checkTreatmentParameters(
      validParameters({ targetGlucoseLowMgdl: 90.5 })
    );
    expect(errors.targetGlucoseLowMgdl).toBeDefined();
  });

  test('accepts two decimal places on the basal rate', () => {
    const errors = checkTreatmentParameters(
      validParameters({ basalRateUnitsPerHour: 0.82 })
    );
    expect(errors.basalRateUnitsPerHour).toBeUndefined();
  });

  test('rejects three decimal places on the basal rate', () => {
    const errors = checkTreatmentParameters(
      validParameters({ basalRateUnitsPerHour: 0.825 })
    );
    expect(errors.basalRateUnitsPerHour).toBeDefined();
  });
});

describe('checkTreatmentParameters — cross-field rules', () => {
  test('target high must be above target low', () => {
    const errors = checkTreatmentParameters(
      validParameters({ targetGlucoseLowMgdl: 150, targetGlucoseHighMgdl: 120 })
    );
    expect(errors.targetGlucoseHighMgdl).toBeDefined();
  });

  test('equal target values are rejected', () => {
    const errors = checkTreatmentParameters(
      validParameters({ targetGlucoseLowMgdl: 120, targetGlucoseHighMgdl: 120 })
    );
    expect(errors.targetGlucoseHighMgdl).toBeDefined();
  });

  test('max bolus cannot exceed max daily dose', () => {
    const errors = checkTreatmentParameters(
      validParameters({
        maxBolusUnits: 20,
        maxDailyDoseUnits: 15,
        basalRateUnitsPerHour: 0.5,
      })
    );
    expect(errors.maxBolusUnits).toBeDefined();
  });

  test('max bolus equal to max daily dose is allowed', () => {
    const errors = checkTreatmentParameters(
      validParameters({
        maxBolusUnits: 15,
        maxDailyDoseUnits: 15,
        basalRateUnitsPerHour: 0.5,
      })
    );
    expect(errors.maxBolusUnits).toBeUndefined();
  });

  // Background delivery alone must never be able to exhaust the daily limit.
  test('basal over 24 hours cannot exceed max daily dose', () => {
    const errors = checkTreatmentParameters(
      validParameters({
        basalRateUnitsPerHour: 1,
        maxDailyDoseUnits: 20,
        maxBolusUnits: 5,
      })
    );
    expect(errors.basalRateUnitsPerHour).toBeDefined();
  });

  test('basal exactly equal to max daily dose over 24 hours is allowed', () => {
    const errors = checkTreatmentParameters(
      validParameters({
        basalRateUnitsPerHour: 0.5,
        maxDailyDoseUnits: 12,
        maxBolusUnits: 5,
      })
    );
    expect(errors.basalRateUnitsPerHour).toBeUndefined();
  });

  // 0.8 * 24 is 19.200000000000003 in floating point. Comparing raw would
  // reject a configuration that is exactly at the limit.
  test('floating point does not cause a false rejection', () => {
    const errors = checkTreatmentParameters(
      validParameters({
        basalRateUnitsPerHour: 0.8,
        maxDailyDoseUnits: 19.2,
        maxBolusUnits: 5,
      })
    );
    expect(errors.basalRateUnitsPerHour).toBeUndefined();
  });
});

describe('checkTreatmentParameters — error reporting', () => {
  test('reports several independent problems at once', () => {
    const errors = checkTreatmentParameters(
      validParameters({ maxBolusUnits: 80, targetGlucoseLowMgdl: 90.5 })
    );
    expect(Object.keys(errors).length).toBeGreaterThanOrEqual(2);
  });

  test('does not stack a cross-field error on an already invalid field', () => {
    // Max bolus is out of range; it should say so rather than also claiming
    // it exceeds the daily dose.
    const errors = checkTreatmentParameters(
      validParameters({ maxBolusUnits: 80, maxDailyDoseUnits: 50 })
    );
    expect(errors.maxBolusUnits).toContain('between');
  });
});
