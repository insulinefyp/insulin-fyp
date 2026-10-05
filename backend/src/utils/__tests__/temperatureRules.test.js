const {
  STATUSES,
  classifyTemperature,
  isExcursion,
  severityOf,
  shouldStoreReading,
  STORE_MIN_DELTA_C,
} = require('../temperatureRules');

describe('classifyTemperature — boundaries', () => {
  // Insulin degrades from heat, not cold, but freezing destroys it outright.
  // Both extremes are critical; only the hot side has a warning tier.

  test.each([
    [-10, STATUSES.CRITICAL_COLD],
    [0, STATUSES.CRITICAL_COLD],
    [1.9, STATUSES.CRITICAL_COLD],
    [2, STATUSES.NORMAL],
    [20, STATUSES.NORMAL],
    [30, STATUSES.NORMAL],
    [30.1, STATUSES.WARNING_HOT],
    [35, STATUSES.WARNING_HOT],
    [37, STATUSES.WARNING_HOT],
    [37.1, STATUSES.CRITICAL_HOT],
    [45, STATUSES.CRITICAL_HOT],
  ])('%p C is %s', (celsius, expected) => {
    expect(classifyTemperature(celsius)).toBe(expected);
  });

  test('exactly at the cold threshold is normal, not critical', () => {
    expect(classifyTemperature(2)).toBe(STATUSES.NORMAL);
  });

  test('exactly at the critical hot threshold is still a warning', () => {
    expect(classifyTemperature(37)).toBe(STATUSES.WARNING_HOT);
  });
});

describe('classifyTemperature — invalid input', () => {
  test.each([null, undefined, NaN, Infinity, '25', {}])(
    '%p is unavailable',
    (value) => {
      expect(classifyTemperature(value)).toBe(STATUSES.UNAVAILABLE);
    }
  );
});

describe('isExcursion', () => {
  test('normal and unavailable are not excursions', () => {
    expect(isExcursion(STATUSES.NORMAL)).toBe(false);
    expect(isExcursion(STATUSES.UNAVAILABLE)).toBe(false);
  });

  test('all three alert states are excursions', () => {
    expect(isExcursion(STATUSES.WARNING_HOT)).toBe(true);
    expect(isExcursion(STATUSES.CRITICAL_HOT)).toBe(true);
    expect(isExcursion(STATUSES.CRITICAL_COLD)).toBe(true);
  });
});

describe('severityOf', () => {
  test('critical outranks warning', () => {
    expect(severityOf(STATUSES.CRITICAL_HOT)).toBeGreaterThan(
      severityOf(STATUSES.WARNING_HOT)
    );
    expect(severityOf(STATUSES.CRITICAL_COLD)).toBeGreaterThan(
      severityOf(STATUSES.WARNING_HOT)
    );
  });

  test('normal is the lowest severity', () => {
    expect(severityOf(STATUSES.NORMAL)).toBe(0);
  });
});

describe('shouldStoreReading', () => {
  const base = new Date('2026-01-01T12:00:00.000Z');

  function reading(celsius, status, offsetSeconds = 0) {
    return {
      celsius,
      status,
      recordedAt: new Date(base.getTime() + offsetSeconds * 1000),
    };
  }

  test('stores the first reading', () => {
    expect(shouldStoreReading(null, reading(22, 'normal'))).toBe(true);
  });

  test('stores when the status changes', () => {
    const prev = reading(29, 'normal');
    const next = reading(31, 'warning_hot', 3);
    expect(shouldStoreReading(prev, next)).toBe(true);
  });

  // The point of the rule: at a 3-second poll interval, storing every reading
  // would be 28,800 near-identical rows a day.
  test('skips a small change soon after the last', () => {
    const prev = reading(22.0, 'normal');
    const next = reading(22.1, 'normal', 3);
    expect(shouldStoreReading(prev, next)).toBe(false);
  });

  test('stores a change at exactly the delta threshold', () => {
    const prev = reading(22.0, 'normal');
    const next = reading(22.0 + STORE_MIN_DELTA_C, 'normal', 3);
    expect(shouldStoreReading(prev, next)).toBe(true);
  });

  test('stores after the maximum gap even with no change', () => {
    const prev = reading(22.0, 'normal');
    const next = reading(22.0, 'normal', 60);
    expect(shouldStoreReading(prev, next)).toBe(true);
  });

  test('a fall as well as a rise crosses the delta threshold', () => {
    const prev = reading(22.0, 'normal');
    const next = reading(21.5, 'normal', 3);
    expect(shouldStoreReading(prev, next)).toBe(true);
  });

  // An excursion must never be missed because the value moved slowly.
  test('a status change always stores, however small the delta', () => {
    const prev = reading(30.0, 'normal');
    const next = reading(30.05, 'warning_hot', 1);
    expect(shouldStoreReading(prev, next)).toBe(true);
  });
});
