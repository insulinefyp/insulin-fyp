const {
  calculateTrend,
  categorise,
  MIN_READINGS,
  MIN_SPAN_MINUTES,
} = require('../glucoseTrend');

// Fixed base time: tests construct their own readings rather than depending
// on the clock, so the suite is deterministic and instant.
const BASE = new Date('2026-01-01T12:00:00.000Z').getTime();

// Builds readings one minute apart, oldest first.
function series(values, { intervalMinutes = 1 } = {}) {
  return values.map((valueMgdl, i) => ({
    valueMgdl,
    recordedAt: new Date(BASE + i * intervalMinutes * 60000).toISOString(),
  }));
}

describe('categorise', () => {
  test.each([
    [3, 'rising_rapidly'],
    [2, 'rising_rapidly'],
    [1.99, 'rising'],
    [1, 'rising'],
    [0.99, 'steady'],
    [0, 'steady'],
    [-0.99, 'steady'],
    [-1, 'falling'],
    [-1.99, 'falling'],
    [-2, 'falling_rapidly'],
    [-3, 'falling_rapidly'],
  ])('slope %p is %s', (slope, expected) => {
    expect(categorise(slope)).toBe(expected);
  });
});

describe('calculateTrend — refusals', () => {
  // These are the important tests. A flat arrow asserts "steady", which the
  // data does not support; refusing is the safe answer.

  test('refuses with no readings', () => {
    expect(calculateTrend([])).toEqual({
      available: false,
      reason: 'insufficient_readings',
    });
  });

  test('refuses with fewer than the minimum readings', () => {
    const readings = series([100, 110]);
    expect(readings).toHaveLength(MIN_READINGS - 1);
    expect(calculateTrend(readings).available).toBe(false);
    expect(calculateTrend(readings).reason).toBe('insufficient_readings');
  });

  test('refuses when the window is too short', () => {
    // Three readings 30 seconds apart: enough readings, not enough time.
    const readings = series([100, 105, 110], { intervalMinutes: 0.5 });
    const result = calculateTrend(readings);
    expect(result.available).toBe(false);
    expect(result.reason).toBe('window_too_short');
  });

  test('refuses on a non-array input', () => {
    expect(calculateTrend(null).available).toBe(false);
    expect(calculateTrend(undefined).available).toBe(false);
  });

  test('refuses when all readings share one timestamp', () => {
    const at = new Date(BASE).toISOString();
    const readings = [
      { valueMgdl: 100, recordedAt: at },
      { valueMgdl: 120, recordedAt: at },
      { valueMgdl: 140, recordedAt: at },
    ];
    expect(calculateTrend(readings).available).toBe(false);
  });

  test('accepts exactly at the minimum span', () => {
    const readings = series([100, 102, 104, 106, 108, 110]);
    expect(calculateTrend(readings).spanMinutes).toBe(MIN_SPAN_MINUTES);
    expect(calculateTrend(readings).available).toBe(true);
  });
});

describe('calculateTrend — direction', () => {
  test('flat readings are steady with zero slope', () => {
    const result = calculateTrend(series([120, 120, 120, 120, 120, 120]));
    expect(result.available).toBe(true);
    expect(result.mgdlPerMinute).toBe(0);
    expect(result.direction).toBe('steady');
  });

  test('a 2 mg/dL per minute rise is rising_rapidly', () => {
    const result = calculateTrend(series([100, 102, 104, 106, 108, 110]));
    expect(result.mgdlPerMinute).toBe(2);
    expect(result.direction).toBe('rising_rapidly');
  });

  test('a 1.5 mg/dL per minute rise is rising', () => {
    const result = calculateTrend(series([100, 101.5, 103, 104.5, 106, 107.5]));
    expect(result.mgdlPerMinute).toBe(1.5);
    expect(result.direction).toBe('rising');
  });

  test('a steady fall is falling_rapidly', () => {
    const result = calculateTrend(series([180, 177, 174, 171, 168, 165]));
    expect(result.mgdlPerMinute).toBe(-3);
    expect(result.direction).toBe('falling_rapidly');
  });

  test('a slow drift stays steady', () => {
    const result = calculateTrend(series([120, 120.5, 121, 121.5, 122, 122.5]));
    expect(result.direction).toBe('steady');
  });

  test('a genuine reversal is reported as a fall', () => {
    // Values that truly end lower than they began, weighted toward the fall.
    const result = calculateTrend(series([140, 136, 132, 128, 124, 120]));
    expect(result.direction).toBe('falling_rapidly');
  });
});

describe('calculateTrend — robustness', () => {
  // Regression was chosen over last-minus-first for exactly these reasons.

  test('a mid-series outlier does not change the direction', () => {
    const clean = calculateTrend(series([100, 102, 104, 106, 108, 110]));
    const noisy = calculateTrend(series([100, 102, 90, 106, 108, 110]));

    expect(clean.direction).toBe('rising_rapidly');
    expect(noisy.direction).toBe('rising_rapidly');
    expect(noisy.mgdlPerMinute).toBeGreaterThan(0);
  });

  test('one bad final reading does not flip a rise into a fall', () => {
    // Rises steadily, then a single spurious low reading at the end.
    const result = calculateTrend(series([100, 105, 110, 115, 120, 98]));

    expect(result.mgdlPerMinute).toBeGreaterThan(0);
    expect(result.direction).toBe('rising');
  });

  test('last-minus-first would be misled where regression is not', () => {
    const readings = series([100, 105, 110, 115, 120, 98]);
    const result = calculateTrend(readings);

    // Comparing only the endpoints reads this as a fall.
    const naive = (98 - 100) / 5;

    expect(naive).toBeLessThan(0);
    expect(result.mgdlPerMinute).toBeGreaterThan(0);
  });

  test('unsorted input gives the same result as sorted', () => {
    const sorted = series([100, 102, 104, 106, 108, 110]);
    const shuffled = [sorted[3], sorted[0], sorted[5], sorted[1], sorted[4], sorted[2]];

    expect(calculateTrend(shuffled)).toEqual(calculateTrend(sorted));
  });

  test('irregular intervals are handled by time, not by position', () => {
    // Readings at 0, 1, 2, 10, 11, 12 minutes rising 2 mg/dL per minute.
    const readings = [0, 1, 2, 10, 11, 12].map((m) => ({
      valueMgdl: 100 + m * 2,
      recordedAt: new Date(BASE + m * 60000).toISOString(),
    }));

    const result = calculateTrend(readings);
    expect(result.mgdlPerMinute).toBe(2);
    expect(result.spanMinutes).toBe(12);
  });

  test('reports how many readings it used', () => {
    const result = calculateTrend(series([100, 102, 104, 106, 108, 110]));
    expect(result.readingsUsed).toBe(6);
  });
});
